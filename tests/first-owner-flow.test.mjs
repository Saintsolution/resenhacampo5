import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash,randomBytes} from 'node:crypto';
import ts from 'typescript';
const dir='workflows/n8n/';
const core=fs.readFileSync(dir+'fontes/auth-owner-mvp-core.js.txt','utf8').replace('!config.pelada_id || ','').replace('const scope = players.rows.filter(row => row.values.pelada_id === config.pelada_id);','const scope = players.rows;')+'\n'+fs.readFileSync(dir+'fontes/pelada-bootstrap-core.js.txt','utf8');
const engine=new Function(core+';return {prepare,plan,prepareSession,prepareBootstrap,planBootstrap,planSession,prepareProfile,planProfile,PELADA_FIELDS,PLAYER_FIELDS,TOKEN_FIELDS,RATE_FIELDS};')();
const config={gid_jogadores:1,gid_tokens:2,gid_limites:3,gid_peladas:4,origem:'https://example.invalid'};
const pelada={nome:'Pelada Exemplo',local:'Campo Exemplo',cidade:'Rio de Janeiro',dia_semana:6,horario_inicio:'09:00',horario_fim:'10:00',mensalidade:30,diaria_sem_colete:15,diaria_com_colete:20,colete_avulso:5,vencimento_mensal:10,validade_convite_horas:72};
const body={organizador:{nome:'Organizador Exemplo',apelido:'Exemplo',cpf:'52998224725',telefone:'21900000000',email:'owner@example.invalid',senha:'SOMENTE-TESTE-2026',confirmacao_senha:'SOMENTE-TESTE-2026',categoria:'Mensalista'},pelada};
const key='12345678-1234-1234-1234-123456789abc';
const hash=x=>createHash('sha256').update(x).digest('hex');
function snapshot(){return {namedRanges:[],valueRanges:[{range:'JOGADORES!A:R',values:[engine.PLAYER_FIELDS]},{range:'TOKENS_ACESSO!A:F',values:[engine.TOKEN_FIELDS]},{range:'LIMITES_AUTH!A:E',values:[engine.RATE_FIELDS]},{range:'PELADAS!A:N',values:[engine.PELADA_FIELDS]}]};}
const prepare=(b=body,k=key)=>engine.prepareBootstrap({body:b,headers:{'idempotency-key':k}},config);
const hashes={cpfHash:hash(body.organizador.cpf),passwordHash:hash(body.organizador.senha),candidate:randomBytes(32).toString('hex'),candidateHash:hash('candidate')};
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
test('sessão OWNER lê suas peladas e seu cadastro pessoal, inclusive quando não há pelada',()=>{
 const s=snapshot();apply(s,engine.planBootstrap(prepare(),s,hashes,Date.now()).requests);
 const now=Date.now();const row=s.valueRanges[0].values[1];row[16]=hash('session');row[17]=new Date(now+60000).toISOString();
 const p={canRun:true,action:'sessao',config,token:'session'};
 const response=engine.planSession(p,s,{tokenHash:hash('session')},now);
 assert.equal(response.status,200);assert.equal(response.response.pelada.nome,pelada.nome);assert.equal(response.response.total_jogadores,1);assert.equal(response.response.meu_cadastro.cpf,body.organizador.cpf);assert.ok(!JSON.stringify(response.response).includes(hashes.passwordHash));
 s.valueRanges[3].values=[engine.PELADA_FIELDS];const invalid=engine.planSession(p,s,{tokenHash:hash('session')},now);assert.equal(invalid.status,200);assert.equal(invalid.response.pelada,null);assert.deepEqual(invalid.response.peladas,[]);
});
test('CPF, apelido, senha, horários, categoria e chave inválidos não prosseguem',()=>{
 for(const b of [{...body,organizador:{...body.organizador,cpf:'11111111111'}},{...body,organizador:{...body.organizador,apelido:''}},{...body,organizador:{...body.organizador,categoria:'OWNER'}},{...body,organizador:{...body.organizador,confirmacao_senha:'outra'}},{...body,pelada:{...pelada,horario_fim:'08:00'}}])assert.equal(prepare(b).canRun,false);
 assert.equal(prepare(body,'').canRun,false);
});
test('grafo do novo workflow e sintaxe dos Code nodes',()=>{
 for(const file of ['13_criar_conta_pelada_APP_MVP.json','11_sessao_APP_MVP.json','17_criar_pelada_APP_MVP.json','18_meu_cadastro_APP_MVP.json']) {
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

function authenticatedFixture() {
 const s=snapshot(),now=Date.now(),token='d'.repeat(64);
 apply(s,engine.planBootstrap(prepare(),s,hashes,now).requests);
 const owner=s.valueRanges[0].values[1];owner[16]=hash(token);owner[17]=new Date(now+3600000).toISOString();
 const p=(club=pelada,k='aaaaaaaa-1234-1234-1234-123456789abc')=>engine.prepareBootstrap({headers:{authorization:'Bearer '+token,'idempotency-key':k},body:{pelada:club,owner_id:'FORGED'}},config,true);
 return {s,now,token,owner,p,h:{...hashes,tokenHash:hash(token),candidate:'e'.repeat(64)}};
}
test('OWNER autenticado cria segunda pelada, preserva registros e não duplica OWNER',()=>{
 const {s,now,owner,p,h}=authenticatedFixture();const before=structuredClone(s.valueRanges[0].values);
 const club={...pelada,nome:'Segunda pelada',mensalidade:47};
 const result=engine.planBootstrap(p(club),s,h,now);assert.equal(result.status,201);
 assert.equal(result.requests.filter(r=>r.appendCells?.sheetId===1).length,0);
 assert.equal(result.requests.filter(r=>r.updateCells?.start.sheetId===1).length,0);
 apply(s,result.requests);assert.deepEqual(s.valueRanges[0].values,before);
 assert.equal(s.valueRanges[3].values.length,3);assert.notEqual(s.valueRanges[3].values[1][0],s.valueRanges[3].values[2][0]);
 assert.equal(s.valueRanges[3].values[2][12],owner[0]);assert.equal(s.valueRanges[3].values[2][6],47);
 const retry=engine.planBootstrap(p(club),s,{...h,candidate:'f'.repeat(64)},now);assert.equal(retry.status,200);assert.equal(retry.response.pelada_id,result.response.pelada_id);assert.deepEqual(retry.requests,[]);
 assert.equal(engine.planBootstrap(p({...club,mensalidade:99}),s,h,now).status,409);
});
test('outro OWNER pode fazer bootstrap com seu próprio CPF sem bloqueio global ou dados alterados',()=>{
 const {s,now}=authenticatedFixture();s.namedRanges.push({namedRangeId:'rc5_owner_bootstrap_v1',name:'MARCADOR_ANTIGO'});
 const b={...body,organizador:{...body.organizador,cpf:'11144477735',nome:'Outro Organizador'}};
 const result=engine.planBootstrap(prepare(b,'bbbbbbbb-1234-1234-1234-123456789abc'),s,{...hashes,cpfHash:hash(b.organizador.cpf),candidate:'f'.repeat(64)},now);
 assert.equal(result.status,201);apply(s,result.requests);assert.equal(s.valueRanges[0].values.length,3);assert.equal(s.valueRanges[3].values.length,3);
});
test('sessão lista somente peladas do OWNER, autoriza seleção e rejeita pelada alheia/inativa',()=>{
 const {s,now,owner,token,p,h}=authenticatedFixture();apply(s,engine.planBootstrap(p(),s,h,now).requests);
 const session=id=>engine.planSession(engine.prepareSession({headers:{authorization:'Bearer '+token},query:{pelada_id:id}},config),s,h,now);
 const second=s.valueRanges[3].values[2][0];const selected=session(second);
 assert.equal(selected.status,200);assert.equal(selected.response.peladas.length,2);assert.equal(selected.response.pelada.id,second);assert.equal(selected.response.total_jogadores,0);
 const third=[...s.valueRanges[3].values[2]];third[0]='PELADA_ALHEIA';third[12]='OTHER_OWNER';s.valueRanges[3].values.push(third);
 assert.equal(session('PELADA_ALHEIA').status,403);assert.equal(session('inexistente').status,403);assert.equal(session('').response.peladas.length,2);
 s.valueRanges[3].values[2][13]='inativo';assert.equal(session(second).status,403);assert.equal(owner[1],s.valueRanges[3].values[1][0]);
});
test('criação autenticada rejeita sessão inválida, expirada ou ADMIN e não aceita owner_id forjado',()=>{
 for(const mutate of [o=>o[16]='',o=>o[17]=new Date(0).toISOString(),o=>o[8]='ADMIN',o=>o[9]='inativo']) {
  const {s,now,owner,p,h}=authenticatedFixture();mutate(owner);const result=engine.planBootstrap(p(),s,h,now);
  assert.ok([401,403].includes(result.status));assert.ok(result.requests.every(r=>r.appendCells?.sheetId===3 || r.updateCells?.start.sheetId===3));
 }
 const {s,now,p,h}=authenticatedFixture();const unauth=engine.prepareBootstrap({body:{pelada},headers:{'idempotency-key':key}},config,true);assert.equal(unauth.canRun,false);
 const collision=engine.planBootstrap(p(),s,{...h,candidate:hashes.candidate},now);assert.equal(collision.status,503);assert.deepEqual(collision.requests,[]);
});
test('repetição do cadastro legado é compatível; marcador não permite mudar os parâmetros',()=>{
 const s=snapshot();apply(s,engine.planBootstrap(prepare(),s,hashes,Date.now()).requests);
 s.namedRanges=[{namedRangeId:'rc5_owner_bootstrap_v1',name:'RC5_OWNER_'+key.replaceAll('-','_')}];
 assert.equal(engine.planBootstrap(prepare(),s,hashes,Date.now()).status,200);
 assert.equal(engine.planBootstrap(prepare({...body,pelada:{...pelada,mensalidade:99}}),s,hashes,Date.now()).status,409);
});

test('lotes concorrentes usam claims por CPF/operação e falham sem gravação parcial',()=>{
 const s=snapshot();const a=engine.planBootstrap(prepare(),structuredClone(s),hashes,Date.now());
 const b=engine.planBootstrap(prepare(body,'cccccccc-1234-1234-1234-123456789abc'),structuredClone(s),{...hashes,candidate:'f'.repeat(64)},Date.now());
 assert.equal(a.status,201);assert.equal(b.status,201);
 const batch=requests=>{
  const ids=requests.filter(r=>r.addNamedRange).map(r=>r.addNamedRange.namedRange.namedRangeId);
  if(ids.some(id=>s.namedRanges.some(r=>r.namedRangeId===id)))throw new Error('Duplicate namedRangeId');
  apply(s,requests);
 };
 batch(a.requests);const before=structuredClone(s);assert.throws(()=>batch(b.requests),/Duplicate/);assert.deepEqual(s,before);
 assert.equal(s.valueRanges[0].values.length,2);assert.equal(s.valueRanges[3].values.length,2);
});
test('workflows A têm autenticação correta e referências para nós existentes',()=>{
 for(const [file,auth] of [['13_criar_conta_pelada_APP_MVP.json','headerAuth'],['17_criar_pelada_APP_MVP.json','none']]) {
  const w=JSON.parse(fs.readFileSync(dir+file));const names=new Set(w.nodes.map(n=>n.name));
  assert.equal(w.nodes.find(n=>n.type.endsWith('.webhook')).parameters.authentication,auth);
  for(const n of w.nodes)for(const m of JSON.stringify(n.parameters).matchAll(/\$\('([^']+)'\)/g))assert.ok(names.has(m[1]),m[1]);
  assert.ok(w.nodes.some(n=>n.name==='Hash CPF cadastro'));
 }
});


test('login e sessão únicos aceitam ADMIN, mensalista e diarista sem acesso à pelada alheia',()=>{
 for(const [role,category] of [['ADMIN','Mensalista'],['','Mensalista'],['','Diarista']]) {
  const {s,now,token,owner,h}=authenticatedFixture();owner[8]=role;owner[7]=category;
  const foreign=[...s.valueRanges[3].values[1]];foreign[0]='PELADA_OUTRA';foreign[12]='OUTRO_OWNER';s.valueRanges[3].values.push(foreign);
  const login=engine.plan(engine.prepare('login',{body:{cpf:body.organizador.cpf,senha:body.organizador.senha}},config),s,h,now);
  assert.equal(login.status,200);
  const session=id=>engine.planSession(engine.prepareSession({headers:{authorization:'Bearer '+token},query:{pelada_id:id}},config),s,h,now);
  const result=session('');assert.equal(result.status,200);assert.equal(result.response.peladas.length,1);
  assert.equal(result.response.permissoes.criar_pelada,false);assert.equal(result.response.permissoes.administrar,role==='ADMIN');
  assert.equal(session('PELADA_OUTRA').status,403);assert.equal(session('inexistente').status,403);
  if(!role)assert.equal(result.response.total_jogadores,undefined);
  owner[9]='inativo';assert.equal(session('').status,401);
 }
});
test('cadastro pessoal só altera dados do titular e rejeita permissões, CPF, finanças e identidade forjada',()=>{
 const {s,now,token,owner,h}=authenticatedFixture();
 const payload={apelido:'Novo apelido',telefone:'21912345678',email:'novo@example.invalid'};
 const prep=body=>engine.prepareProfile({headers:{authorization:'Bearer '+token},body},config);
 const before=[...owner];const result=engine.planProfile(prep(payload),s,h,now);assert.equal(result.status,200);
 apply(s,result.requests);assert.equal(owner[3],payload.apelido);assert.equal(owner[5],payload.telefone);assert.equal(owner[6],payload.email);
 for(const i of [0,1,2,4,7,8,9,10,11,12,13,15,16,17])assert.equal(owner[i],before[i]);
 assert.equal(result.response.meu_cadastro.cpf,owner[4]);
 for(const extra of [{nome:'Outro Nome'},{cpf:'11144477735'},{papel_administrativo:'OWNER'},{participante_id:'OUTRO'},{pelada_id:'OUTRA'},{asaas_customer_id:'cus_outro'},{categoria:'ADMIN'},{mensalidade:1},{senha:'nova senha'}]) {
  const p=prep({...payload,...extra});assert.equal(p.canRun,false);assert.deepEqual(engine.planProfile(p,s,h,now).requests,[]);
 }
 const expired=structuredClone(s);expired.valueRanges[0].values[1][17]=new Date(0).toISOString();
 assert.equal(engine.planProfile(prep(payload),expired,h,now).status,401);
 const badToken=engine.planProfile(prep(payload),s,{...h,tokenHash:hash('outro')},now);assert.equal(badToken.status,401);
});
test('cliente Asaas vinculado permite apelido mas bloqueia mudança de contato sem tocar na integração',()=>{
 const {s,now,token,owner,h}=authenticatedFixture();owner[10]='cus_EXISTENTE';
 const p=body=>engine.prepareProfile({headers:{authorization:'Bearer '+token},body},config);
 const payload={apelido:'Novo apelido',telefone:owner[5],email:owner[6]};
 const result=engine.planProfile(p(payload),s,h,now);assert.equal(result.status,200);assert.equal(result.response.meu_cadastro.contato_editavel,false);assert.ok(result.requests.filter(r=>r.updateCells?.start.sheetId===1).every(r=>[3,14].includes(r.updateCells.start.columnIndex)));
 for(const changed of [{...payload,email:'outro@example.invalid'},{...payload,telefone:'21911112222'}]) {
  const denied=engine.planProfile(p(changed),s,h,now);assert.equal(denied.status,409);assert.deepEqual(denied.requests,[]);
 }
});
test('perfil desconhecido, pelada inativa e sessão expirada não recebem painel',()=>{
 for(const mutate of [o=>o[8]='SUPERADMIN',o=>{o[8]='';o[7]='Outra';}]) {
  const {s,now,token,owner,h}=authenticatedFixture();mutate(owner);
  assert.equal(engine.planSession(engine.prepareSession({headers:{authorization:'Bearer '+token}},config),s,h,now).status,403);
 }
 const {s,now,token,owner,h}=authenticatedFixture();owner[8]='ADMIN';s.valueRanges[3].values[1][13]='inativo';
 const p=engine.prepareSession({headers:{authorization:'Bearer '+token}},config);
 assert.equal(engine.planSession(p,s,h,now).status,403);
 owner[17]=new Date(0).toISOString();assert.equal(engine.planSession(p,s,h,now).status,401);
});
