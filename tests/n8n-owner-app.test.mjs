import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash, randomBytes } from 'node:crypto';
const dir='workflows/n8n/';
const core=fs.readFileSync(dir+'fontes/auth-owner-mvp-core.js.txt','utf8');
const {prepare,plan,PLAYER_FIELDS,TOKEN_FIELDS,RATE_FIELDS}=new Function(core+'\nreturn {prepare,plan,PLAYER_FIELDS,TOKEN_FIELDS,RATE_FIELDS};')();
const config={spreadsheet_id:'test',gid_jogadores:1,gid_tokens:2,gid_limites:3,pelada_id:'RESENHA_CAMPO_5',origem:'https://example.invalid'};
const hash=v=>createHash('sha256').update(v).digest('hex');
// Identidades artificiais somente para teste local; não serão enviadas a serviços.
const body={nome:'Organizador Exemplo',cpf:'52998224725',email:'owner@example.invalid',telefone:'21900000000',senha:'Exemplo-apenas-2026',confirmacao_senha:'Exemplo-apenas-2026'};
function snapshot(players=[],rates=[]) {return {valueRanges:[{range:'JOGADORES!A:R',values:[PLAYER_FIELDS,...players]},{range:'TOKENS_ACESSO!A:F',values:[TOKEN_FIELDS]},{range:'LIMITES_AUTH!A:E',values:[RATE_FIELDS,...rates]}]};}
const now=Date.now();
function execute(action,b=body,players=[],token=''){
 const p=prepare(action,{body:b,headers:{authorization:token?'Bearer '+token:undefined}},config);
 const candidate=randomBytes(32).toString('hex');
 return plan(p,snapshot(players),{passwordHash:hash(p.password||''),candidate,candidateHash:hash(candidate),tokenHash:hash(p.token||'')},now);
}
function appendedPlayer(result){const r=result.requests.find(r=>r.appendCells?.sheetId===1);return r.appendCells.rows[0].values.map(v=>v.userEnteredValue.stringValue??'');}
test('JSONs: grafo, sintaxe, nenhuma credencial real ou pinData',()=>{
 for(const filename of ['09_cadastrar_owner_APP_MVP.json','10_login_APP_MVP.json','11_sessao_APP_MVP.json','12_logout_APP_MVP.json']){
  const w=JSON.parse(fs.readFileSync(dir+filename)); assert.equal(w.active,false); assert.deepEqual(w.pinData,{});
  const names=new Set(w.nodes.map(n=>n.name));assert.equal(names.size,w.nodes.length);
  for(const n of w.nodes){if(n.parameters.jsCode)new Function(n.parameters.jsCode);for(const c of Object.values(n.credentials||{}))assert.match(c.id,/^CONFIGURAR_/);}
  for(const c of Object.values(w.connections))for(const branch of c.main)for(const e of branch)assert.ok(names.has(e.node));
  const hook=w.nodes.find(n=>n.type.endsWith('.webhook'));
  assert.equal(hook.parameters.authentication,filename.startsWith('09')?'headerAuth':'none');
 }
});
test('cadastro → login → sessão → logout, sem cobrança nem senha original persistida',()=>{
 const registered=execute('cadastro_owner');assert.equal(registered.status,201);
 const lock=registered.requests.find(r=>r.addNamedRange);assert.equal(lock.addNamedRange.namedRange.namedRangeId,'rc5_owner_bootstrap_v1');
 const row=appendedPlayer(registered);assert.equal(row[7],'');assert.equal(row[8],'OWNER');assert.equal(row[15],hash(body.senha));
 assert.ok(!JSON.stringify(registered.requests).includes(body.senha));
 const login=execute('login',body,[row]);assert.equal(login.status,200);assert.match(login.response.token_sessao,/^[a-f0-9]{64}$/);
 for(const r of login.requests)if(r.updateCells?.start.sheetId===1)row[r.updateCells.start.columnIndex]=r.updateCells.rows[0].values[0].userEnteredValue.stringValue;
 const session=execute('sessao',{},[row],login.response.token_sessao);assert.equal(session.status,200);assert.equal(session.response.papel_administrativo,'OWNER');assert.equal(session.response.nome,body.nome);assert.ok(!session.response.cpf);
 const logout=execute('logout',{},[row],login.response.token_sessao);assert.equal(logout.status,200);
 for(const r of logout.requests)if(r.updateCells?.start.sheetId===1)row[r.updateCells.start.columnIndex]=r.updateCells.rows[0].values[0].userEnteredValue.stringValue;
 assert.equal(execute('sessao',{},[row],login.response.token_sessao).status,401);
});
test('segundo OWNER, dados inválidos e senha incorreta são rejeitados',()=>{
 const row=appendedPlayer(execute('cadastro_owner'));
 assert.equal(execute('cadastro_owner',body,[row]).status,409);
 assert.equal(execute('login',{...body,senha:'incorreta'},[row]).status,401);
 assert.equal(prepare('cadastro_owner',{body:{...body,confirmacao_senha:'divergente'}},config).status,400);
 assert.equal(prepare('cadastro_owner',{body:{...body,cpf:'11111111111'}},config).status,400);
});
