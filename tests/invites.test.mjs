import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash,randomBytes} from 'node:crypto';
const root='workflows/n8n/';
const source=['auth-owner-mvp-core.js.txt','pelada-bootstrap-core.js.txt','convites-core.js.txt'].map(f=>fs.readFileSync(root+'fontes/'+f,'utf8')).join('\n');
const {prepareInvite,planInvite,PLAYER_FIELDS,TOKEN_FIELDS,RATE_FIELDS,PELADA_FIELDS,INVITE_BASE,INVITE_EXTRA,MONTH_FIELDS}=new Function(source+';return {prepareInvite,planInvite,PLAYER_FIELDS,TOKEN_FIELDS,RATE_FIELDS,PELADA_FIELDS,INVITE_BASE,INVITE_EXTRA,MONTH_FIELDS};')();
const now=Date.parse('2026-10-23T15:00:00Z');const session='a'.repeat(64);const hash=x=>createHash('sha256').update(x).digest('hex');
const config={gid_jogadores:1,gid_tokens:2,gid_limites:3,gid_peladas:4,gid_convites:5,origem:'https://example.invalid',frontend_url:'https://example.invalid'};
const baseInput={apelido:'Bacurau Exemplo',whatsapp:'21900000000',tipo:'MENSALISTA'};
const key='12345678-1234-1234-1234-123456789abc';
function table(name,fields,rows=[]){return {range:name+'!A:Z',values:[[...fields],...rows.map(r=>fields.map(f=>r[f]??''))]};}
function snapshot(){return {valueRanges:[table('JOGADORES',PLAYER_FIELDS,[{participante_id:'OWNER_TEST',pelada_id:'PELADA_TEST',nome:'Organizador Exemplo',apelido:'Organizador',papel_administrativo:'OWNER',situacao:'ativo',token_sessao_hash:hash(session),token_expira:new Date(now+3600000).toISOString()}]),table('TOKENS_ACESSO',TOKEN_FIELDS),table('LIMITES_AUTH',RATE_FIELDS),table('PELADAS',PELADA_FIELDS,[{pelada_id:'PELADA_TEST',nome:'Pelada Exemplo',local:'Campo Exemplo',owner_id:'OWNER_TEST',situacao:'ativo',dia_semana:6,hora_inicio:'09:00',hora_fim:'10:00',convite_horas:72}]),table('CONVITES',INVITE_BASE),table('MENSALIDADES',MONTH_FIELDS)]};}
function request(action='criar',body=baseInput,id=key){return prepareInvite(action,{headers:{authorization:'Bearer '+session,'idempotency-key':id,origin:config.origem},body},config);}
const candidate=randomBytes(32).toString('hex');const hashes={tokenHash:hash(session),candidate,candidateHash:hash(candidate)};
function apply(s,requests){for(const r of requests){if(r.appendCells){const tab=s.valueRanges[r.appendCells.sheetId-1];for(const row of r.appendCells.rows)tab.values.push(row.values.map(c=>c.userEnteredValue?.stringValue??c.userEnteredValue?.numberValue??''));}if(r.updateCells){const x=r.updateCells;const tab=s.valueRanges[x.start.sheetId-1];for(let i=0;i<x.rows.length;i++){const row=tab.values[x.start.rowIndex+i]??=[];x.rows[i].values.forEach((c,j)=>row[x.start.columnIndex+j]=c.userEnteredValue?.stringValue??c.userEnteredValue?.numberValue??'');}}}}
test('emissão registra autor da sessão, campos adicionais e somente hash do token no mesmo lote',()=>{
 const s=snapshot();const result=planInvite(request('criar',{...baseInput,convidador_nome:'Nome forjado'}),s,hashes,now);
 assert.equal(result.status,201);assert.equal(result.response.convite.convidador_nome,'Organizador Exemplo');assert.equal(result.response.convite.whatsapp,'5521900000000');
 assert.equal(Date.parse(result.response.convite.expira_em)-now,72*3600000);
 assert.ok(result.requests.some(r=>r.addNamedRange));assert.ok(!JSON.stringify(result.requests).includes(candidate));
 apply(s,result.requests);assert.deepEqual(s.valueRanges[4].values[0],[...INVITE_BASE,...INVITE_EXTRA]);assert.equal(s.valueRanges[1].values[1][0],hash(candidate));
 const link=new URL(result.response.link_convite);assert.equal(link.origin,config.frontend_url);assert.ok(link.hash.includes(candidate));assert.equal(link.search,'');
 const whatsapp=new URL(result.response.whatsapp_url);assert.equal(whatsapp.hostname,'wa.me');assert.ok(whatsapp.searchParams.get('text').includes(result.response.link_convite));
});
test('repetição não emite outro token; listagem não retorna links secretos',()=>{
 const s=snapshot();const first=planInvite(request(),s,hashes,now);apply(s,first.requests);
 const again=planInvite(request(),s,{...hashes,candidate:'b'.repeat(64)},now);assert.equal(again.status,200);assert.deepEqual(again.requests,[]);assert.equal(again.response.link_disponivel,false);
 const listed=planInvite(request('listar',{}),s,hashes,now);assert.equal(listed.response.convites.length,1);assert.ok(!JSON.stringify(listed).includes(candidate));
 assert.equal(planInvite(request('criar',baseInput,'aaaaaaaa-1234-1234-1234-123456789abc'),s,hashes,now).status,409);
});
test('sessão revogada, inativa, expirada e diarista não podem emitir',()=>{
 for(const mutate of [s=>s.valueRanges[0].values[1][16]='',s=>s.valueRanges[0].values[1][9]='inativo',s=>s.valueRanges[0].values[1][17]=new Date(now-1).toISOString()]){const s=snapshot();mutate(s);assert.equal(planInvite(request(),s,hashes,now).status,401);}
 const s=snapshot();s.valueRanges[0].values[1][8]='';s.valueRanges[0].values[1][7]='Diarista';assert.equal(planInvite(request(),s,hashes,now).status,403);
});
test('administrador pode convidar; mensalista exige aptidão e não emite ADMIN',()=>{
 const s=snapshot();s.valueRanges[0].values[1][8]='ADMIN';assert.equal(planInvite(request('criar',{...baseInput,tipo:'ADMIN'}),s,hashes,now).status,201);
 s.valueRanges[0].values[1][8]='';s.valueRanges[0].values[1][7]='Mensalista';assert.equal(planInvite(request(),s,hashes,now).status,403);
 s.valueRanges[5]=table('MENSALIDADES',MONTH_FIELDS,[{participante_id:'OWNER_TEST',competencia:'2026-10',status_asaas:'CONFIRMED',apto_financeiro:true}]);
 assert.equal(planInvite(request(),s,hashes,now).status,201);assert.equal(planInvite(request('criar',{...baseInput,tipo:'ADMIN'}),s,hashes,now).status,403);
 s.valueRanges[5].values[1][7]='PENDING';assert.equal(planInvite(request(),s,hashes,now).status,403);
});
test('convite diário exige jogo não encerrado e limita validade ao término',()=>{
 const s=snapshot();const result=planInvite(request('criar',{...baseInput,tipo:'DIARISTA',data_jogo:'2026-10-24'}),s,hashes,now);assert.equal(result.status,201);assert.equal(result.response.convite.data_jogo,'2026-10-24');assert.equal(result.response.convite.expira_em,'2026-10-24T13:00:00.000Z');
 for(const date of ['2026-10-23','2026-10-17','2026-02-31'])assert.equal(planInvite(request('criar',{...baseInput,tipo:'DIARISTA',data_jogo:date}),s,hashes,now).status,400);
});
test('link válido é consultado sem consumo; expirado/utilizado/token errado rejeitados',()=>{
 const s=snapshot();apply(s,planInvite(request(),s,hashes,now).requests);
 const p=prepareInvite('validar',{body:{token:candidate}},config);
 const valid=planInvite(p,s,{tokenHash:hash(candidate)},now);assert.equal(valid.status,200);assert.equal(valid.response.convite.apelido,baseInput.apelido);assert.deepEqual(valid.requests,[]);assert.equal(valid.response.cadastro_disponivel,false);assert.ok(!JSON.stringify(valid.response).includes('21900000000'));
 assert.equal(planInvite(p,s,{tokenHash:hash('errado')},now).status,400);
 assert.equal(planInvite(p,s,{tokenHash:hash(candidate)},now+73*3600000).status,400);
 s.valueRanges[4].values[1][9]=new Date(now).toISOString();assert.equal(planInvite(p,s,{tokenHash:hash(candidate)},now).status,400);
});
test('grafos importáveis sem pins, credenciais reais ou references para nodes removidos',()=>{
 for(const file of ['14_criar_convite_APP_MVP.json','15_listar_convite_APP_MVP.json','16_validar_convite_APP_MVP.json']){const w=JSON.parse(fs.readFileSync(root+file));assert.equal(w.active,false);assert.deepEqual(w.pinData,{});const names=new Set(w.nodes.map(n=>n.name));for(const n of w.nodes){if(n.parameters.jsCode)new Function(n.parameters.jsCode);for(const c of Object.values(n.credentials??{}))assert.match(c.id,/^CONFIGURAR_/);}for(const c of Object.values(w.connections))for(const list of c.main)for(const e of list)assert.ok(names.has(e.node));assert.ok(!names.has('Hash senha legado'));}
});
