import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Renderiza os componentes reais; sem navegador, rede, fixtures financeiras ou planilha.
const cache = new Map();
function moduleUrl(file) {
 file=path.resolve(file);
 if(cache.has(file))return cache.get(file);
 const compiled=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText.replaceAll('import.meta.env','({})');
 const source=compiled.replace(/(from\s*|import\s*)(['"])([^'"]+)\2/g,(full,prefix,quote,spec)=>{
  let url;
  if(spec.startsWith('.')) {
   const target=path.resolve(path.dirname(file),spec);
   const resolved=['', '.ts','.tsx'].map(suffix=>target+suffix).find(p=>fs.existsSync(p));
   url=moduleUrl(resolved);
  } else url=import.meta.resolve(spec);
  return `${prefix}${quote}${url}${quote}`;
 });
 const url='data:text/javascript;base64,'+Buffer.from(source).toString('base64');cache.set(file,url);return url;
}
const {default:AccessPanel}=await import(moduleUrl('src/components/AccessPanel.tsx'));
const {default:PeladaFields}=await import(moduleUrl('src/components/PeladaFields.tsx'));
const {default:PersonalDetails}=await import(moduleUrl('src/components/PersonalDetails.tsx'));
const {initialPelada}=await import(moduleUrl('src/lib/n8n/bootstrap.ts'));
const club={id:'PELADA_A',nome:'Turma A',local:'Campo A',cidade:'',dia_semana:3,horario_inicio:'18:00',horario_fim:'19:00',mensalidade:60,diaria_sem_colete:10,diaria_com_colete:15,colete_avulso:5,vencimento_mensal:10,validade_convite_horas:48};
const profile={nome:'Pessoa Exemplo',cpf:'52998224725',apelido:'Exemplo',telefone:'21912345678',email:'exemplo@example.invalid',contato_editavel:true};
const props={token:'token-local',busy:false,message:'',error:'',onSelect(){},onCreate(){},onLogout(){},onProfileSaved(){}};
test('painel real separa OWNER, ADMIN e jogador e não mistura peladas na seleção',()=>{
 for(const [role,category] of [['OWNER',''],['ADMIN','Mensalista'],['','Mensalista'],['','Diarista']]) {
  const session={autenticado:true,participante_id:'PESSOA_A',nome:profile.nome,papel_administrativo:role,categoria:category,expira_em:'2099-01-01',pelada:club,peladas:[club],meu_cadastro:profile};
  const html=renderToStaticMarkup(React.createElement(AccessPanel,{...props,session}));
  assert.ok(html.includes('Meu cadastro'));assert.ok(html.includes('Turma A'));assert.ok(!html.includes('Turma B'));
  assert.equal(html.includes('Criar outra pelada'),role==='OWNER');
  assert.equal(html.includes('Convidar jogador'),role==='OWNER'||role==='ADMIN'||category==='Mensalista');
  assert.equal(html.includes('ÁREA DO JOGADOR'),role==='');
 }
});
test('formulário inicial real não preenche nome, local, horários, valores ou regras da Resenha',()=>{
 const html=renderToStaticMarkup(React.createElement(PeladaFields,{value:initialPelada,onField(){},disabled:false}));
 assert.ok(!/RESENHA|Flamengo|Rio de Janeiro|NaN|09:00|10:00/.test(html));
 assert.ok(html.includes('Selecione'));assert.equal((html.match(/value=""/g)||[]).length,12);
});
test('cadastro pessoal mantém identidade somente para consulta e bloqueia contato vinculado',()=>{
 const html=renderToStaticMarkup(React.createElement(PersonalDetails,{profile:{...profile,contato_editavel:false},token:'token-local',onSaved(){}}));
 assert.equal((html.match(/readonly=""/g)||[]).length,4);
 assert.ok(!html.includes('name="cpf"'));assert.ok(!html.includes('name="nome"'));
 assert.ok(!html.includes('name="papel_administrativo"'));assert.ok(!html.includes('name="asaas_customer_id"'));
});

test('OWNER sem pelada recebe painel com criação da primeira, sem ser tratado como cadastro inválido',()=>{
 const session={autenticado:true,participante_id:'OWNER_TESTE',nome:'Organizador Exemplo',papel_administrativo:'OWNER',expira_em:'2099-01-01',pelada:null,peladas:[]};
 const html=renderToStaticMarkup(React.createElement(AccessPanel,{...props,session}));assert.ok(html.includes('Criar minha pelada'));assert.ok(!html.includes('Não há pelada autorizada'));
});

const {default:OwnerAccess}=await import(moduleUrl('src/components/OwnerAccess.tsx'));
test('menu público tem login e não oferece criação pública de pelada ou OWNER; cadastro só pelo convite',()=>{
 const previous=globalThis.location;
 try {
  globalThis.location={hash:'#/'};let html=renderToStaticMarkup(React.createElement(OwnerAccess,{onDemo(){}}));assert.ok(html.includes('Entrar na minha pelada'));assert.ok(!html.includes('Criar minha pelada'));assert.ok(!html.includes('Salvar minha conta'));
  globalThis.location={hash:'#/entrar'};html=renderToStaticMarkup(React.createElement(OwnerAccess,{onDemo(){}}));assert.ok(html.includes('type="password"'));assert.ok(html.includes('Mostrar senha'));assert.ok(!html.includes('Salvar minha conta'));
  globalThis.location={hash:'#/cadastrar-owner'};html=renderToStaticMarkup(React.createElement(OwnerAccess,{onDemo(){}}));assert.ok(html.includes('convite exclusivo'));assert.ok(!html.includes('Salvar minha conta'));
  globalThis.location={hash:'#/cadastrar-owner?convite='+'a'.repeat(64)};html=renderToStaticMarkup(React.createElement(OwnerAccess,{onDemo(){}}));assert.ok(html.includes('Salvar minha conta'));assert.ok(!html.includes('Nome da pelada'));assert.ok(!html.includes('a'.repeat(64)));assert.ok(html.includes('Mostrar confirmação de senha'));
 }finally{globalThis.location=previous;}
});

test('lista administrativa mostra nomes clicáveis e quantidade; jogador não recebe essa interface',()=>{
 const players=[{participante_id:'P1',nome:'Participante da pelada',apelido:'Teste',cpf:'52998224725',telefone:'21912345678',email:'teste@example.invalid',categoria:'Mensalista',papel_administrativo:'',situacao:'ativo'}];
 for(const role of ['OWNER','ADMIN','']) {
  const session={autenticado:true,participante_id:'ACTOR',nome:'Pessoa',papel_administrativo:role,categoria:'Mensalista',expira_em:'2099-01-01',pelada:club,peladas:[club],jogadores:players};
  const html=renderToStaticMarkup(React.createElement(AccessPanel,{...props,session}));assert.equal(html.includes('Participante da pelada'),Boolean(role));
  if(role){assert.ok(html.includes('Jogadores da pelada · 1'));assert.ok(html.includes('aria-expanded="false"'));assert.ok(!html.includes('teste@example.invalid'));}
 }
});
