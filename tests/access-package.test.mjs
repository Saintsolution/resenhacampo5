import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const file='workflows/etapa a pronta/RESENHA_ETAPA_A_PRONTO.json';
// O export privado não é versionado. A suíte pública continua validando 11/18 isolados.
const privatePackageMissing=!fs.existsSync(file)||!fs.existsSync(file.replace('.json','.antes_acesso_unico.bak'));
test('consolidado preserva integração financeira e todos os ramos anteriores fora da sessão',{skip:privatePackageMissing},()=>{
 const before=JSON.parse(fs.readFileSync(file.replace('.json','.antes_acesso_unico.bak'),'utf8'));
 const after=JSON.parse(fs.readFileSync(file,'utf8'));
 const changed=new Set(['A11 — Configuração e validação','A11 — Planejar operação']);
 assert.equal(before.nodes.length,195);assert.equal(after.nodes.length,210);
 for(const old of before.nodes)if(!changed.has(old.name))assert.deepEqual(after.nodes.find(n=>n.name===old.name),old,old.name);
 for(const [name,outputs] of Object.entries(before.connections))assert.deepEqual(after.connections[name],outputs,name);
 assert.equal(after.active,false);assert.deepEqual(after.pinData,{});
});
test('pacote de acesso tem rotas únicas, Bearer no novo endpoint, referências existentes e sintaxe válida',{skip:privatePackageMissing},()=>{
 const w=JSON.parse(fs.readFileSync(file,'utf8'));const names=new Set(w.nodes.map(n=>n.name));
 assert.equal(names.size,w.nodes.length);assert.equal(new Set(w.nodes.map(n=>n.id)).size,w.nodes.length);
 const hooks=w.nodes.filter(n=>n.type.endsWith('.webhook')&&!n.disabled);
 const routes=hooks.map(n=>(n.parameters.httpMethod||'GET')+' '+n.parameters.path);
 assert.equal(new Set(routes).size,11);assert.equal(routes.length,11);
 assert.ok(routes.includes('POST rc5-app-v1/meu-cadastro'));
 const profile=w.nodes.find(n=>n.name==='A18 — Configuração e validação');assert.ok(profile.parameters.jsCode.includes('prepareProfile($input.first().json,config)'));
 for(const n of w.nodes) {
  if(n.parameters.jsCode)new Function(n.parameters.jsCode);
  for(const m of JSON.stringify(n.parameters).matchAll(/\$\('([^']+)'\)/g))assert.ok(names.has(m[1]),n.name);
 }
 for(const [name,outputs] of Object.entries(w.connections)) {
  assert.ok(names.has(name));for(const branches of Object.values(outputs))for(const branch of branches)for(const e of branch)assert.ok(names.has(e.node));
 }
});
