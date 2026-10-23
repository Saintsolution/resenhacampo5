import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash,randomBytes} from 'node:crypto';
import ts from 'typescript';
const dir='workflows/n8n/';
const core=fs.readFileSync(dir+'fontes/auth-owner-mvp-core.js.txt','utf8').replace('!config.pelada_id || ','').replace('const scope = players.rows.filter(row => row.values.pelada_id === config.pelada_id);','const scope = players.rows;')+'\n'+fs.readFileSync(dir+'fontes/pelada-bootstrap-core.js.txt','utf8');
const engine=new Function(core+';return {prepare,plan,prepareBootstrap,planBootstrap,planSession,PELADA_FIELDS,PLAYER_FIELDS,TOKEN_FIELDS,RATE_FIELDS};')();
const config={gid_jogadores:1,gid_tokens:2,gid_limites:3,gid_peladas:4,origem:'https://example.invalid'};
const pelada={nome:'Pelada Exemplo',local:'Campo Exemplo',cidade:'Rio de Janeiro',dia_semana:6,horario_inicio:'09:00',horario_fim:'10:00',mensalidade:30,diaria_sem_colete:15,diaria_com_colete:20,colete_avulso:5,vencimento_mensal:10,validade_convite_horas:72};
const body={organizador:{nome:'Organizador Exemplo',apelido:'Exemplo',cpf:'52998224725',telefone:'21900000000',email:'owner@example.invalid',senha:'SOMENTE-TESTE-2026',confirmacao_senha:'SOMENTE-TESTE-2026',categoria:'Mensalista'},pelada};
const key='12345678-1234-1234-1234-123456789abc';
const hash=x=>createHash('sha256').update(x).digest('hex');
function snapshot(){return {namedRanges:[],valueRanges:[{range:'JOGADORES!A:R',values:[engine.PLAYER_FIELDS]},{range:'TOKENS_ACESSO!A:F',values:[engine.TOKEN_FIELDS]},{range:'LIMITES_AUTH!A:E',values:[engine.RATE_FIELDS]},{range:'PELADAS!A:N',values:[engine.PELADA_FIELDS]}]};}
const prepare=(b=body,k=key)=>engine.prepareBootstrap({body:b,headers:{'idempotency-key':k}},config);
const hashes={passwordHash:hash(body.organizador.senha),candidate:randomBytes(32).toString('hex'),candidateHash:hash('candidate')};
function apply(snapshot,requests){for(const r of requests){if(r.addNamedRange)snapshot.namedRanges.push(r.addNamedRange.namedRange);if(r.appendCells){const i=r.appendCells.sheetId-1;for(const row of r.appendCells.rows)snapshot.valueRanges[i].values.push(row.values.map(v=>v.userEnteredValue?.stringValue??v.userEnteredValue?.numberValue??''));}if(r.updateCells){const {sheetId,rowIndex,columnIndex}=r.updateCells.start;const values=snapshot.valueRanges[sheetId-1].values;values[rowIndex]??=[];values[rowIndex][columnIndex]=r.updateCells.rows[0].values[0].userEnteredValue.stringValue??r.updateCells.rows[0].values[0].userEnteredValue.numberValue;}}}
test('bootstrap prepara um único lote OWNER + PELADAS; repetição idêntica não grava novamente',()=>{
 const s=snapshot();const first=engine.planBootstrap(prepare(),s,hashes,Date.now());assert.equal(first.status,201);
 assert.ok(first.requests.some(r=>r.addNamedRange));assert.ok(first.requests.some(r=>r.appendCells?.sheetId===1));assert.ok(first.requests.some(r=>r.appendCells?.sheetId===4));
 assert.ok(!JSON.stringify(first.requests).includes(body.organizador.senha));apply(s,first.requests);
 const row=s.valueRanges[0].values[1];assert.equal(row[8],'OWNER');assert.equal(row[7],'Mensalista');assert.equal(row[3],'Exemplo');
 assert.equal(s.valueRanges[3].values[1][2],'Campo Exemplo — Rio de Janeiro');
 assert.equal(s.valueRanges[3].values[1][12],row[0]);assert.equal(s.valueRanges[3].values[1][0],row[1]);assert.match(row[1],/^PELADA_/);
 const again=engine.planBootstrap(prepare(),s,hashes,Date.now());assert.equal(again.status,200);assert.equal(again.response.codigo,'PELADA_CRIADA');assert.deepEqual(again.requests,[]);
 const other=engine.planBootstrap(prepare(body,'aaaaaaaa-1234-1234-1234-123456789abc'),s,hashes,Date.now());assert.equal(other.status,409);assert.deepEqual(other.requests,[]);
 const altered=engine.planBootstrap(prepare({...body,pelada:{...pelada,mensalidade:99}}),s,hashes,Date.now());assert.equal(altered.status,409);
});
test('sessão OWNER lê a PELADAS vinculada e não vaza CPF; sem pelada falha',()=>{
 const s=snapshot();apply(s,engine.planBootstrap(prepare(),s,hashes,Date.now()).requests);
 const now=Date.now();const row=s.valueRanges[0].values[1];row[16]=hash('session');row[17]=new Date(now+60000).toISOString();
 const p={canRun:true,action:'sessao',config,token:'session'};
 const response=engine.planSession(p,s,{tokenHash:hash('session')},now);
 assert.equal(response.status,200);assert.equal(response.response.pelada.nome,pelada.nome);assert.equal(response.response.total_jogadores,1);assert.ok(!JSON.stringify(response.response).includes(body.organizador.cpf));
 s.valueRanges[3].values=[engine.PELADA_FIELDS];const invalid=engine.planSession(p,s,{tokenHash:hash('session')},now);assert.equal(invalid.status,503);assert.deepEqual(invalid.requests,[]);
});
test('CPF, apelido, senha, horários, categoria e chave inválidos não prosseguem',()=>{
 for(const b of [{...body,organizador:{...body.organizador,cpf:'11111111111'}},{...body,organizador:{...body.organizador,apelido:''}},{...body,organizador:{...body.organizador,categoria:'OWNER'}},{...body,organizador:{...body.organizador,confirmacao_senha:'outra'}},{...body,pelada:{...pelada,horario_fim:'08:00'}}])assert.equal(prepare(b).canRun,false);
 assert.equal(prepare(body,'').canRun,false);
});
test('grafo do novo workflow e sintaxe dos Code nodes',()=>{
 for(const file of ['13_criar_conta_pelada_APP_MVP.json','11_sessao_APP_MVP.json']) {
  const w=JSON.parse(fs.readFileSync(dir+file));const names=new Set(w.nodes.map(n=>n.name));assert.equal(w.active,false);assert.deepEqual(w.pinData,{});
  for(const n of w.nodes)if(n.parameters.jsCode)new Function(n.parameters.jsCode);
  for(const c of Object.values(w.connections))for(const branch of c.main)for(const e of branch)assert.ok(names.has(e.node));
  assert.ok(w.nodes.some(n=>n.parameters.url?.includes('ranges=PELADAS!A:N')));
 }
});
test('próxima partida considera dia e horário em São Paulo e virada de mês',async()=>{
 const js=ts.transpileModule(fs.readFileSync('src/lib/matchDate.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022}}).outputText;
 const {nextGameDate}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
 assert.equal(nextGameDate(pelada,new Date('2026-10-23T12:00:00Z')),'2026-10-24');
 assert.equal(nextGameDate(pelada,new Date('2026-10-24T12:30:00Z')),'2026-10-24');
 assert.equal(nextGameDate(pelada,new Date('2026-10-24T13:00:00Z')),'2026-10-31');
 assert.equal(nextGameDate(pelada,new Date('2026-10-31T13:00:00Z')),'2026-11-07');
});

test('login encontra o OWNER com pelada_id gerado, sem ID fixo em configuração',()=>{
 const s=snapshot();apply(s,engine.planBootstrap(prepare(),s,hashes,Date.now()).requests);
 const p=engine.prepare('login',{body:{cpf:body.organizador.cpf,senha:body.organizador.senha}},config);
 assert.equal(p.canRun,true);
 const result=engine.plan(p,s,{...hashes,candidateHash:hash(hashes.candidate)},Date.now());
 assert.equal(result.status,200);assert.equal(result.response.participante_id,s.valueRanges[0].values[1][0]);
});
