from pathlib import Path
import json
root=Path('workflows/n8n')
core=(root/'fontes/auth-ficticia-core.js.txt').read_text()
a=core.index('  const blocked =',core.index('function prepare'))
b=core.index('  const headers =',a)
core=core[:a]+'''  const blocked = reply(503,'CONFIGURACAO_PENDENTE','Confira a configuração dos webhooks no n8n.');
  if (!config.pelada_id || !/^https:\\/\\//.test(config.origem) || config.origem.includes('CONFIGURAR_') || [config.gid_jogadores,config.gid_tokens,config.gid_limites].some(id=>!Number.isInteger(id)||id<0)) return {...blocked,canRun:false};
'''+core[b:]
core=core.replace("if (!prepared.canRun || config.modo !== 'TESTE_FICTICIO')",'if (!prepared.canRun)')
a=core.index('    // Proteção adicional:')
b=core.index('    const scope =',a)
core=core[:a]+core[b:]
core=core.replace("['login','primeiro_acesso','recuperar_senha']","['cadastro_owner','login','primeiro_acesso','recuperar_senha']")
core=core.replace("['login','criar_senha','redefinir_senha']","['cadastro_owner','login','criar_senha','redefinir_senha']")
needle="  const bearer ="
pos=core.index(needle)
core=core[:pos]+'''  let profile = null;
  if(action==='cadastro_owner') {
    if(typeof body.senha!=='string' || body.senha!==body.confirmacao_senha || typeof body.nome!=='string' || body.nome.trim().split(/\\s+/).length<2 || body.nome.length>150 || typeof body.email!=='string' || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(body.email) || body.email.length>254 || typeof body.telefone!=='string' || !/^\\d{10,13}$/.test(digits(body.telefone))) return {...reply(400,'DADOS_INVALIDOS','Confira nome completo, CPF, e-mail, telefone e confirmação da senha.'),canRun:false};
    profile={nome:body.nome.trim(),email:body.email.trim().toLowerCase(),telefone:digits(body.telefone)};
  }
'''+core[pos:]
core=core.replace('password, token };','password, token, profile };')
pos=core.index("    if (action === 'login')")
core=core[:pos]+'''    if(action==='cadastro_owner') {
      if(players.rows.some(row=>String(row.values.papel_administrativo).trim().toUpperCase()==='OWNER')) return finish(reply(409,'OWNER_JA_EXISTE','O organizador já foi cadastrado. Faça login.'));
      if(player) return finish(reply(409,'CADASTRO_EXISTENTE','Já existe um cadastro para esses dados.'));
      if(!shaFormat(hashes.passwordHash)||!shaFormat(hashes.candidate)) throw new Error('native_crypto');
      // Mesmo ID de named range em todas as tentativas: inclusão no mesmo lote do OWNER.
      requests.push({addNamedRange:{namedRange:{namedRangeId:'rc5_owner_bootstrap_v1',name:'RC5_OWNER_CADASTRADO',range:{sheetId:config.gid_jogadores,startRowIndex:0,endRowIndex:1,startColumnIndex:0,endColumnIndex:1}}}});
      append(players,{...prepared.profile,participante_id:'OWNER_'+hashes.candidate,pelada_id:config.pelada_id,cpf:prepared.cpf,apelido:prepared.profile.nome.split(/\\s+/)[0],categoria:'',papel_administrativo:'OWNER',situacao:'ativo',criado_em:now,atualizado_em:now,senha_hash:hashes.passwordHash});
      return finish(reply(201,'OWNER_CADASTRADO','Organizador cadastrado. Entre com seu CPF e senha.',{proxima_acao:'login'}));
    }
'''+core[pos:]
core=core.replace("modo: 'TESTE_FICTICIO'","modo: 'MVP_LEGADO'").replace('TESTE_GLOBAL:','MVP_GLOBAL:').replace('TESTE_LOGIN:','MVP_LOGIN:')
core=core.replace("'LOGIN_FICTICIO_AUTORIZADO','Acesso apenas ao ensaio fictício.'","'LOGIN_AUTORIZADO','Acesso autorizado.'").replace("'SESSAO_FICTICIA_VALIDA','Sessão válida no ensaio.'","'SESSAO_VALIDA','Sessão válida.'")
# Do not expose cadastro or CPF; only safe session fields.
core=core.replace('categoria:row.values.categoria,papel_administrativo:','nome:row.values.nome,categoria:row.values.categoria,papel_administrativo:')
core=core.replace('// Resenha Campo 5: motor ESTRUTURAL de teste. Não é autenticação pública.','// Resenha Campo 5: compatibilidade SHA256 legada solicitada. Limitação de senha documentada.')
(root/'fontes/auth-owner-mvp-core.js.txt').write_text(core)
# Reuse node graphs, native Crypto and HTTP from the delivered files, without altering originals.
config={'spreadsheet_id':'1dRBMU7BH9PLzWjgAjj4VWnLUqpSVIWC6iKQj9URczMo','gid_jogadores':800101,'gid_tokens':2023862256,'gid_limites':'CONFIGURAR_GID_LIMITES_AUTH','pelada_id':'RESENHA_CAMPO_5','origem':'CONFIGURAR_ORIGEM_NETLIFY'}
actions=[('09_cadastrar_owner_APP_MVP.json','cadastro_owner','POST','cadastrar-organizador','03_login_ESTRUTURAL.json'),('10_login_APP_MVP.json','login','POST','login','03_login_ESTRUTURAL.json'),('11_sessao_APP_MVP.json','sessao','GET','sessao','04_consultar_sessao_ESTRUTURAL.json'),('12_logout_APP_MVP.json','logout','POST','logout','05_logout_ESTRUTURAL.json')]
for filename,action,method,path,base in actions:
 w=json.loads((root/base).read_text())
 w['name']='RC5 — '+action+' — MVP legado'; w['active']=False
 for n in w['nodes']:
  if n['type'].endswith('.webhook'):
   n['parameters'].update({'httpMethod':method,'path':'rc5-app-v1/'+path,'authentication':'headerAuth' if action=='cadastro_owner' else 'none'})
   n['parameters']['options']['allowedOrigins']='CONFIGURAR_ORIGEM_NETLIFY'
   if action=='cadastro_owner':n['credentials']={'httpHeaderAuth':{'id':'CONFIGURAR_CREDENCIAL_ATIVACAO_OWNER','name':'CONFIGURAR_CREDENCIAL_ATIVACAO_OWNER'}}
   else:n.pop('credentials',None)
  if n['name']=='Configuração e validação':
   n['parameters']['jsCode']=core+'\nconst config = '+json.dumps(config)+';\nreturn [{json:prepare('+json.dumps(action)+',$input.first().json,config)}];'
   n['notes']='Preencher origem e gid LIMITES_AUTH. Senha SHA256 legada, sem salt/custo. Não confundir com hash adequado.'
  if n['name']=='Planejar operação':
   n['parameters']['jsCode']=core+"\nreturn [{json:plan($('Configuração e validação').first().json,$input.first().json,$('Hash token candidato').first().json,Date.now())}];"
  if n['name']=='Resposta mínima e entrega pendente':n['parameters']['jsCode']='const p=$input.first().json; return [{json:{status:p.status,response:p.response}}];'
  if n.get('credentials',{}).get('googleSheetsOAuth2Api'):n['credentials']={'googleSheetsOAuth2Api':{'id':'CONFIGURAR_CREDENCIAL_GOOGLE_EXISTENTE','name':'CONFIGURAR_CREDENCIAL_GOOGLE_EXISTENTE'}}
  if 'jsCode' in n['parameters']:n['parameters']['jsCode']=n['parameters']['jsCode'].replace("modo:'TESTE_FICTICIO'","modo:'MVP_LEGADO'")
 (root/filename).write_text(json.dumps(w,ensure_ascii=False,indent=2)+'\n')
# Nomes visíveis coerentes com o pacote MVP; referências são atualizadas juntas.
renames={'Webhook de ensaio':'Webhook do aplicativo','Ensaio explicitamente autorizado?':'Configuração e dados válidos?','Hash senha SOMENTE FIXTURE':'Hash senha legado','Ler snapshot privado de teste':'Ler registros no Sheets','Aplicar lote no Sheets de teste':'Gravar no Sheets','Resposta mínima e entrega pendente':'Preparar resposta mínima'}
for filename,*_ in actions:
 p=root/filename
 text=p.read_text()
 for before,after in renames.items():text=text.replace(before,after)
 p.write_text(text)
