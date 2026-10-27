import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
const file='workflows/para importar/RESENHA_CAMPO_5.json';
const official='workflows/resenha n8n restaurado/JogoLindo — Cadastro, Login, Peladas e Convites.json';
const available=fs.existsSync(file)&&fs.existsSync(official);
const hash=x=>createHash('sha256').update(x).digest('hex');
function fixture(){
 const w=JSON.parse(fs.readFileSync(file,'utf8'));
 const code=w.nodes.find(n=>n.name==='Normaliza Dados Cadastro OWNER').parameters.jsCode;
 const engine=new Function(code.slice(0,code.lastIndexOf('\nconst config='))+';return {prepareOwnerRegistration,planOwnerRegistration,prepare,plan,prepareSession,planSession,prepareBootstrap,planFirstOrNextPelada,PLAYER_FIELDS,TOKEN_FIELDS,RATE_FIELDS,PELADA_FIELDS};')();
 const config={gid_jogadores:1,gid_tokens:2,gid_limites:3,gid_peladas:4,origem:'https://example.invalid'};
 const now=Date.parse('2026-10-27T18:00:00Z'),token='a'.repeat(64),key='12345678-1234-1234-1234-123456789abc';
 const organizador={nome:'Organizador Exemplo',apelido:'Teste',cpf:'52998224725',telefone:'21912345678',email:'organizador@example.invalid',categoria:'',senha:'Senha-Somente-Teste-2026',confirmacao_senha:'Senha-Somente-Teste-2026'};
 const snapshot={namedRanges:[],valueRanges:[{range:'JOGADORES!A:R',values:[engine.PLAYER_FIELDS]},{range:'TOKENS_ACESSO!A:F',values:[engine.TOKEN_FIELDS,[hash(token),'OWNER','5521912345678','CADASTRAR_OWNER',new Date(now+3600000).toISOString(),'']]},{range:'LIMITES_AUTH!A:E',values:[engine.RATE_FIELDS]},{range:'PELADAS!A:N',values:[engine.PELADA_FIELDS]}]};
 const hashes={tokenHash:hash(token),passwordHash:hash(organizador.senha),cpfHash:hash(organizador.cpf),candidate:'b'.repeat(64),candidateHash:hash('b'.repeat(64))};
 const prepare=(o=organizador,t=token,k=key)=>engine.prepareOwnerRegistration({headers:{origin:config.origem,'idempotency-key':k},body:{organizador:o,convite_owner:t}},config);
 return {w,engine,config,now,token,key,organizador,snapshot,hashes,prepare};
}
function apply(s,requests){
 const proposed=structuredClone(s);
 for(const r of requests){
  if(r.addNamedRange){const marker=r.addNamedRange.namedRange;assert.ok(!proposed.namedRanges.some(m=>m.namedRangeId===marker.namedRangeId));proposed.namedRanges.push(marker);}
  if(r.appendCells)for(const row of r.appendCells.rows)proposed.valueRanges[r.appendCells.sheetId-1].values.push(row.values.map(c=>Object.values(c.userEnteredValue)[0]));
  if(r.updateCells){const {start,rows}=r.updateCells;rows[0].values.forEach((c,i)=>proposed.valueRanges[start.sheetId-1].values[start.rowIndex][start.columnIndex+i]=Object.values(c.userEnteredValue)[0]);}
 }
 Object.assign(s,proposed);
}
test('cadastro separado salva OWNER, consome convite e permite login sem criar pelada; criação posterior não duplica OWNER',{skip:!available},()=>{
 const {engine:e,config,now,organizador,snapshot:s,hashes:h,prepare}=fixture();
 const p=prepare();assert.equal(p.canRun,true);
 const result=e.planOwnerRegistration(p,s,h,now);assert.equal(result.status,201);assert.equal(result.response.codigo,'OWNER_CADASTRADO');
 assert.ok(result.requests.every(r=>r.appendCells?.sheetId!==4));apply(s,result.requests);
 assert.equal(s.valueRanges[0].values.length,2);assert.equal(s.valueRanges[0].values[1][1],'');assert.equal(s.valueRanges[3].values.length,1);assert.ok(s.valueRanges[1].values[1][5]);
 const repeated=e.planOwnerRegistration(p,s,{...h,candidate:'c'.repeat(64)},now);assert.equal(repeated.status,200);assert.deepEqual(repeated.requests,[]);
 const login=e.plan(e.prepare('login',{body:{cpf:organizador.cpf,senha:organizador.senha}},config),s,h,now);assert.equal(login.status,200);apply(s,login.requests);
 const sessionPrepare=e.prepareSession({headers:{authorization:'Bearer '+h.candidate}},config);
 const access=e.planSession(sessionPrepare,s,{...h,tokenHash:h.candidateHash},now);assert.equal(access.status,200);assert.equal(access.response.pelada,null);assert.deepEqual(access.response.peladas,[]);
 const pelada={nome:'Pelada de teste',local:'Campo Teste',cidade:'Cidade Teste',dia_semana:2,horario_inicio:'19:00',horario_fim:'20:00',mensalidade:45,diaria_sem_colete:10,diaria_com_colete:15,colete_avulso:5,vencimento_mensal:12,validade_convite_horas:48};
 const cp=e.prepareBootstrap({headers:{authorization:'Bearer '+h.candidate,'idempotency-key':'aaaaaaaa-1234-1234-1234-123456789abc'},body:{pelada}},config,true);
 const created=e.planFirstOrNextPelada(cp,s,{...h,tokenHash:h.candidateHash,candidate:'d'.repeat(64)},now);assert.equal(created.status,201);apply(s,created.requests);
 assert.equal(s.valueRanges[0].values.length,2);assert.equal(s.valueRanges[0].values[1][1],created.response.pelada_id);assert.equal(s.valueRanges[3].values[1][12],login.response.participante_id);
 const selected=e.planSession(sessionPrepare,s,{...h,tokenHash:h.candidateHash},now);assert.equal(selected.status,200);assert.equal(selected.response.pelada.id,created.response.pelada_id);
 const retry=e.planFirstOrNextPelada(cp,s,{...h,tokenHash:h.candidateHash,candidate:'e'.repeat(64)},now);assert.equal(retry.status,200);assert.deepEqual(retry.requests,[]);
});
test('convite OWNER rejeita outro WhatsApp, token ausente/expirado/usado e alteração do cadastro na repetição',{skip:!available},()=>{
 const {engine:e,now,snapshot:s,hashes:h,prepare,organizador:o}=fixture();
 assert.equal(prepare(o,'').canRun,false);
 assert.equal(e.planOwnerRegistration(prepare({...o,telefone:'21999999999'}),s,h,now).status,401);
 assert.equal(e.planOwnerRegistration(prepare(),s,{...h,tokenHash:hash('outro')},now).status,401);
 const expired=structuredClone(s);expired.valueRanges[1].values[1][4]=new Date(now-1).toISOString();assert.equal(e.planOwnerRegistration(prepare(),expired,h,now).status,401);
 apply(s,e.planOwnerRegistration(prepare(),s,h,now).requests);
 assert.equal(e.planOwnerRegistration(prepare({...o,apelido:'Outro'}),s,h,now).status,409);
 assert.equal(e.planOwnerRegistration(prepare(o,'a'.repeat(64),'bbbbbbbb-1234-1234-1234-123456789abc'),s,h,now).status,409);
});
test('claims impedem cadastro concorrente duplicado no mesmo lote',{skip:!available},()=>{
 const {engine:e,now,snapshot:s,hashes:h,prepare}=fixture();const a=e.planOwnerRegistration(prepare(),structuredClone(s),h,now);const b=e.planOwnerRegistration(prepare(),structuredClone(s),{...h,candidate:'c'.repeat(64)},now);
 apply(s,a.requests);const before=structuredClone(s);assert.throws(()=>apply(s,b.requests));assert.deepEqual(s,before);
});
test('novo pacote preserva ramos de cobrança/retorno Asaas, credenciais e grafo; não contém Gmail',{skip:!available},()=>{
 const {w}=fixture(),old=JSON.parse(fs.readFileSync(official,'utf8'));const names=new Set(w.nodes.map(n=>n.name));
 assert.equal(w.nodes.length,217);assert.equal(names.size,217);assert.equal(new Set(w.nodes.map(n=>n.id)).size,217);assert.equal(w.active,false);assert.deepEqual(w.pinData,{});
 const routes=w.nodes.filter(n=>n.type.endsWith('.webhook')&&!n.disabled).map(n=>(n.parameters.httpMethod||'GET')+' '+n.parameters.path);assert.equal(routes.length,new Set(routes).size);assert.ok(routes.includes('POST rc5-app-v1/cadastrar-organizador'));assert.ok(!routes.includes('POST rc5-app-v1/criar-conta-pelada'));
 const todo=['Recebe Inscrição Jogador','Recebe Retorno Asaas'],seen=new Set();while(todo.length){const name=todo.pop();if(seen.has(name))continue;seen.add(name);for(const bs of Object.values(old.connections[name]||{}))for(const b of bs)todo.push(...b.map(e=>e.node));}
 for(const name of seen){assert.deepEqual(w.nodes.find(n=>n.name===name),old.nodes.find(n=>n.name===name));assert.deepEqual(w.connections[name],old.connections[name]);}
 assert.ok(!w.nodes.some(n=>n.type.includes('gmail')));
 for(const n of w.nodes){if(n.parameters.jsCode)new Function(n.parameters.jsCode);for(const m of JSON.stringify(n.parameters).matchAll(/\$\('([^']+)'\)/g))assert.ok(names.has(m[1]),m[1]);}
 for(const outs of Object.values(w.connections))for(const bs of Object.values(outs))for(const b of bs)for(const edge of b)assert.ok(names.has(edge.node));
});
test('gerador manual exige apelido e WhatsApp e entrega link WhatsApp somente após gravação confirmada',{skip:!available},()=>{
 const {w}=fixture();const code=w.nodes.find(n=>n.name==='Configura Destinatário Convite OWNER').parameters.jsCode;
 assert.throws(()=>new Function(code)(),/Preencha apelido/);
 const valid=code.replace("apelido:'PREENCHER_APELIDO'","apelido:'Ricardo Teste'").replace("whatsapp:'PREENCHER_WHATSAPP'","whatsapp:'21912345678'");const data=new Function(valid)()[0].json;assert.equal(data.whatsapp,'5521912345678');
 const delivery=w.nodes.find(n=>n.name==='Entrega Link Convite OWNER').parameters.jsCode;
 const run=response=>new Function('$','$input',delivery)(name=>({first:()=>({json:name==='Configura Destinatário Convite OWNER'?data:{candidate:'a'.repeat(64)}})}),{first:()=>({json:response})});
 assert.throws(()=>run({}),/não confirmada/);
 const r=run({spreadsheetId:data.config.spreadsheet_id,replies:[{},{}]})[0].json;assert.match(r.link_convite,/#\/cadastrar-owner\?convite=/);assert.match(r.whatsapp_url,/^https:\/\/wa.me\/5521912345678\?text=/);
});

test('convite ADMIN é exclusivo do OWNER; ADMIN e mensalista apto convidam jogadores sem escalar papel',{skip:!available},()=>{
 const {w,engine:e,now}=fixture();const code=w.nodes.find(n=>n.name==='Valida e Prepara Dados Criar Convite').parameters.jsCode;
 const core=code.slice(0,code.lastIndexOf('\nreturn [{json:'));
 const i=new Function(core+';return {prepareInvite,planInvite,INVITE_BASE,INVITE_EXTRA,MONTH_FIELDS};')();
 const token='f'.repeat(64),config={gid_jogadores:1,gid_tokens:2,gid_limites:3,gid_peladas:4,gid_convites:5,origem:'https://example.invalid',frontend_url:'https://example.invalid'};
 const table=(name,fields,rows=[])=>({range:name+'!A:Z',values:[fields,...rows.map(row=>fields.map(k=>row[k]??''))]});
 const month=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit'}).format(new Date(now));
 for(const [role,category,paid] of [['OWNER','',false],['ADMIN','Mensalista',false],['','Mensalista',true],['','Mensalista',false],['','Diarista',false]]) {
  const player={participante_id:'PESSOA',pelada_id:'PELADA',nome:'Pessoa Teste',apelido:'Teste',papel_administrativo:role,categoria:category,situacao:'ativo',token_sessao_hash:hash(token),token_expira:new Date(now+60000).toISOString()};
  const s={valueRanges:[table('JOGADORES',e.PLAYER_FIELDS,[player]),table('TOKENS_ACESSO',e.TOKEN_FIELDS),table('LIMITES_AUTH',e.RATE_FIELDS),table('PELADAS',e.PELADA_FIELDS,[{pelada_id:'PELADA',nome:'Teste',owner_id:role==='OWNER'?'PESSOA':'OUTRO_OWNER',situacao:'ativo',convite_horas:24}]),table('CONVITES',[...i.INVITE_BASE,...i.INVITE_EXTRA]),table('MENSALIDADES',i.MONTH_FIELDS,paid?[{participante_id:'PESSOA',competencia:month,status_asaas:'CONFIRMED',apto_financeiro:true}]:[])]};
  const prep=tipo=>i.prepareInvite('criar',{headers:{authorization:'Bearer '+token,'idempotency-key':'11111111-1234-1234-1234-123456789abc'},body:{apelido:'Convidado',whatsapp:'21998765432',tipo},query:{pelada_id:'PELADA'}},config);
  const h={tokenHash:hash(token),candidate:'c'.repeat(64),candidateHash:hash('c'.repeat(64))};
  assert.equal(i.planInvite(prep('ADMIN'),s,h,now).status,role==='OWNER'?201:403);
  assert.equal(i.planInvite(prep('MENSALISTA'),s,h,now).status,role==='OWNER'||role==='ADMIN'||paid?201:403);
 }
});
