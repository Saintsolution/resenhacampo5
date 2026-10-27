import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

async function loadClient() {
 const source=fs.readFileSync('src/lib/n8n/owner.ts','utf8').replace("import { n8nBaseUrl } from './config';", "const n8nBaseUrl='https://example.invalid';");
 const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText.replaceAll('import.meta.env',JSON.stringify({}));
 return import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
}
test('cliente transmite seleção por requisição sem mudar sessão global e mantém criação autenticada idempotente',async()=>{
 const {ownerRequest}=await loadClient();const original=globalThis.fetch;const calls=[];
 globalThis.fetch=async(url,options)=>{calls.push({url:new URL(url),options});return new Response(JSON.stringify({sucesso:true,codigo:'PELADA_CRIADA',pelada_id:'PELADA_2'}),{headers:{'Content-Type':'application/json'}});};
 try {
  await ownerRequest('sessao',{token:'session',peladaId:'PELADA_2'});
  await ownerRequest('convites',{token:'session',peladaId:'PELADA_2',method:'GET'});
  await ownerRequest('peladas',{token:'session',body:{pelada:{nome:'Segunda'}},requestId:'stable-key'});
  assert.equal(calls[0].options.method,'GET');assert.equal(calls[0].url.searchParams.get('pelada_id'),'PELADA_2');
  assert.equal(calls[1].url.searchParams.get('pelada_id'),'PELADA_2');
  assert.equal(calls[2].options.method,'POST');assert.equal(calls[2].options.headers.Authorization,'Bearer session');
  assert.equal(calls[2].options.headers['Idempotency-Key'],'stable-key');assert.equal(calls[2].options.headers['X-RC5-Ativacao'],undefined);
  assert.equal(calls[2].url.pathname,'/webhook/rc5-app-v1/peladas');assert.ok(!calls.some(c=>c.url.href.includes('session')));
 }finally{globalThis.fetch=original;}
});

test('cadastro OWNER envia somente a conta e o convite, sem criar pelada nem chave compartilhada',async()=>{
 const {registerOwner}=await loadClient();const previous=globalThis.fetch;const calls=[];
 globalThis.fetch=async(url,options)=>{calls.push({url:new URL(url),options});return new Response(JSON.stringify({sucesso:true,codigo:'OWNER_CADASTRADO',participante_id:'OWNER_TESTE'}),{headers:{'Content-Type':'application/json'}});};
 try{
  const o={nome:'Pessoa Teste',apelido:'Teste',cpf:'52998224725',telefone:'21912345678',email:'teste@example.invalid',senha:'SomenteTeste2026',confirmacao_senha:'SomenteTeste2026'};
  await registerOwner(o,'a'.repeat(64),'operacao-estavel');assert.equal(calls.length,1);assert.equal(calls[0].url.pathname,'/webhook/rc5-app-v1/cadastrar-organizador');assert.equal(calls[0].options.headers['Idempotency-Key'],'operacao-estavel');assert.equal(calls[0].options.headers['X-RC5-Ativacao'],undefined);
  const body=JSON.parse(calls[0].options.body);assert.deepEqual(body.organizador,o);assert.equal(body.convite_owner,'a'.repeat(64));assert.equal(body.pelada,undefined);assert.ok(!calls[0].url.href.includes('a'.repeat(64)));
 }finally{globalThis.fetch=previous;}
});
