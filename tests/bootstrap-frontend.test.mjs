import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const validPelada={nome:'Pelada de teste',local:'Campo de teste',cidade:'Cidade de teste',dia_semana:2,horario_inicio:'19:00',horario_fim:'20:00',mensalidade:50,diaria_sem_colete:10,diaria_com_colete:15,colete_avulso:5,vencimento_mensal:12,validade_convite_horas:48};
const source=fs.readFileSync('src/lib/n8n/bootstrap.ts','utf8');
async function load(env={}) {
 const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText.replaceAll('import.meta.env',JSON.stringify(env));
 return import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
}
test('valores iniciais e validação de horário e valores',async()=>{
 const {initialPelada:p,validatePelada}=await load();
 assert.equal(p.nome,'');assert.equal(p.local,'');assert.equal(p.cidade,'');assert.equal(p.dia_semana,-1);
 assert.equal(p.horario_inicio,'');assert.ok(Number.isNaN(p.mensalidade));assert.ok(Number.isNaN(p.vencimento_mensal));
 assert.ok(validatePelada(p));assert.equal(validatePelada(validPelada),null);
 assert.ok(validatePelada({...p,horario_fim:'08:00'}));
 assert.ok(validatePelada({...p,mensalidade:-1}));
 assert.ok(validatePelada({...p,mensalidade:30.123}));
});
test('sem URL não envia nem afirma cadastro concluído',async()=>{
 const {registerPelada,initialPelada}=await load();
 await assert.rejects(()=>registerPelada({organizador:{},pelada:initialPelada},'nao-enviar','id-local'),/Nenhum dado foi enviado/);
});
test('envia OWNER e pelada juntos, código em header e chave de repetição estável',async()=>{
 const {registerPelada}=await load({VITE_N8N_BOOTSTRAP_URL:'https://example.invalid/bootstrap'});
 const previous=globalThis.fetch; const calls=[];
 globalThis.fetch=async(url,options)=>{calls.push({url,options});return new Response(JSON.stringify({sucesso:true,codigo:'PELADA_CRIADA'}),{status:201,headers:{'Content-Type':'application/json'}});};
 try {
  const body={organizador:{nome:'Exemplo Local'},pelada:validPelada};
  await registerPelada(body,'codigo-apenas-local','mesma-operacao');
  assert.deepEqual(JSON.parse(calls[0].options.body),body);
  assert.equal(calls[0].options.headers['Idempotency-Key'],'mesma-operacao');
  assert.equal(calls[0].options.headers['X-RC5-Ativacao'],'codigo-apenas-local');
  assert.ok(!calls[0].options.body.includes('codigo-apenas-local'));assert.ok(!String(calls[0].url).includes('codigo-apenas-local'));
 } finally {globalThis.fetch=previous;}
});
