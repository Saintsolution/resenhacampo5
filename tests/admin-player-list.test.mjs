import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
const file='workflows/para importar/RESENHA_CAMPO_5.json';
const exists=fs.existsSync(file);
const sha=value=>createHash('sha256').update(value).digest('hex');
function fixture(role='OWNER') {
 const w=JSON.parse(fs.readFileSync(file,'utf8'));
 const source=w.nodes.find(n=>n.name==='Valida e Prepara Dados Sessão').parameters.jsCode;
 const e=new Function(source.slice(0,source.lastIndexOf('\nreturn [{json:'))+';return {prepareSession,planSessionWithPlayers,PLAYER_FIELDS,TOKEN_FIELDS,RATE_FIELDS,PELADA_FIELDS};')();
 const now=Date.now(),token='a'.repeat(64),config={gid_jogadores:1,gid_tokens:2,gid_limites:3,gid_peladas:4,origem:'https://example.invalid'};
 const table=(name,fields,rows=[])=>({range:name+'!A:Z',values:[fields,...rows.map(r=>fields.map(k=>r[k]??''))]});
 const rows=[{participante_id:'ACTOR',pelada_id:'PELADA_A',nome:'Responsável',cpf:'11144477735',categoria:role==='OWNER'?'':'Mensalista',papel_administrativo:role,situacao:'ativo',token_sessao_hash:sha(token),token_expira:new Date(now+60000).toISOString()},
 {participante_id:'A1',pelada_id:'PELADA_A',nome:'Jogador da A',apelido:'A',cpf:'52998224725',telefone:'21912345678',email:'a@example.invalid',categoria:'Mensalista',situacao:'ativo',senha_hash:'SEGREDO_SENHA',token_sessao_hash:'SEGREDO_TOKEN',asaas_customer_id:'SEGREDO_CLIENTE'},
 {participante_id:'A2',pelada_id:'PELADA_A',nome:'Diarista da A',cpf:'12345678909',categoria:'Diarista',situacao:'inativo'},
 {participante_id:'B1',pelada_id:'PELADA_B',nome:'Pessoa de outra pelada',cpf:'CPF_ALHEIO_999',email:'outro@example.invalid',categoria:'Mensalista',situacao:'ativo'}];
 const s={valueRanges:[table('JOGADORES',e.PLAYER_FIELDS,rows),table('TOKENS_ACESSO',e.TOKEN_FIELDS),table('LIMITES_AUTH',e.RATE_FIELDS),table('PELADAS',e.PELADA_FIELDS,[{pelada_id:'PELADA_A',nome:'Pelada A',local:'Campo A',dia_semana:6,hora_inicio:'09:00',hora_fim:'10:00',mensalidade:30,diaria_sem_colete:15,diaria_com_colete:20,colete_avulso:5,vencimento_dia:10,convite_horas:48,owner_id:role==='OWNER'?'ACTOR':'OUTRO_OWNER',situacao:'ativo'},{pelada_id:'PELADA_B',nome:'Pelada B',owner_id:'OUTRO_OWNER',situacao:'ativo'}])]};
 const call=id=>e.planSessionWithPlayers(e.prepareSession({headers:{authorization:'Bearer '+token},query:{pelada_id:id}},config),s,{tokenHash:sha(token)},now);
 return {call,s};
}
test('OWNER e ADMIN recebem apenas jogadores da pelada e campos pessoais autorizados, com contagem separada',{skip:!exists},()=>{
 for(const role of ['OWNER','ADMIN']) {
  const {call}=fixture(role);const result=call('PELADA_A');assert.equal(result.status,200);
  const players=result.response.jogadores;assert.ok(players.some(p=>p.participante_id==='A1'));assert.ok(players.some(p=>p.participante_id==='A2'));assert.ok(!players.some(p=>p.participante_id==='B1'));
  assert.equal(result.response.total_jogadores_cadastrados,role==='OWNER'?2:3);assert.equal(result.response.total_jogadores_ativos,role==='OWNER'?1:2);
  const text=JSON.stringify(players);for(const secret of ['SEGREDO_SENHA','SEGREDO_TOKEN','SEGREDO_CLIENTE','CPF_ALHEIO'])assert.ok(!text.includes(secret));
  assert.equal(call('PELADA_B').status,403);
 }
});
test('jogador comum e sessão expirada não recebem a lista pessoal dos demais',{skip:!exists},()=>{
 const {call,s}=fixture('');assert.equal(call('PELADA_A').status,200);assert.equal(call('PELADA_A').response.jogadores,undefined);
 s.valueRanges[0].values[1][17]=new Date(0).toISOString();const denied=call('PELADA_A');assert.equal(denied.status,401);assert.equal(denied.response.jogadores,undefined);
});
