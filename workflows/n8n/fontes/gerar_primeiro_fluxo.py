"""Reaproveita os JSONs locais. Não acessa serviços nem ativa workflows."""
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
core=(root/'fontes/auth-owner-mvp-core.js.txt').read_text()
core=core.replace("!/^https:\\/\\//.test(config.origem)","(!/^https:\\/\\//.test(config.origem) && !/^http:\\/\\/(localhost|127\\.0\\.0\\.1)(:\\d+)?$/.test(config.origem))")
core=core.replace('!config.pelada_id || ','').replace("const scope = players.rows.filter(row => row.values.pelada_id === config.pelada_id);",'const scope = players.rows;')
addon=(root/'fontes/pelada-bootstrap-core.js.txt').read_text()
config={'spreadsheet_id':'1dRBMU7BH9PLzWjgAjj4VWnLUqpSVIWC6iKQj9URczMo','gid_jogadores':800101,'gid_tokens':2023862256,'gid_limites':1685501295,'gid_peladas':717198779,'origem':'CONFIGURAR_ORIGEM_FRONTEND'}
for filename,action in [('13_criar_conta_pelada_APP_MVP.json','bootstrap'),('11_sessao_APP_MVP.json','sessao')]:
 w=json.loads((root/('09_cadastrar_owner_APP_MVP.json' if action=='bootstrap' else filename)).read_text())
 w['name']='RC5 — '+('criar conta e pelada' if action=='bootstrap' else 'sessão com pelada')+' — MVP legado'
 for n in w['nodes']:
  p=n['parameters']
  if n['type'].endswith('.webhook') and action=='bootstrap':p['path']='rc5-app-v1/criar-conta-pelada'
  if n['name']=='Configuração e validação':p['jsCode']=core+'\n'+addon+'\nconst config='+json.dumps(config)+';\nreturn [{json:'+('prepareBootstrap($input.first().json,config)' if action=='bootstrap' else "prepare('sessao',$input.first().json,config)")+'}];'
  if n['name']=='Ler registros no Sheets':p['url']="={{ 'https://sheets.googleapis.com/v4/spreadsheets/' + $('Configuração e validação').first().json.config.spreadsheet_id + '/values:batchGet?ranges=JOGADORES!A:R&ranges=TOKENS_ACESSO!A:F&ranges=LIMITES_AUTH!A:E&ranges=PELADAS!A:N&valueRenderOption=UNFORMATTED_VALUE' }}"
  if n['name']=='Planejar operação':
   snapshot="{...$('Ler registros no Sheets').first().json,namedRanges:$input.first().json.namedRanges??[]}" if action=='bootstrap' else '$input.first().json'
   p['jsCode']=core+'\n'+addon+'\nreturn [{json:'+('planBootstrap' if action=='bootstrap' else 'planSession')+"($('Configuração e validação').first().json,"+snapshot+",$('Hash token candidato').first().json,Date.now())}];"
  if n['name']=='Conferir confirmação do lote':p['jsCode']=p['jsCode'].replace('estado da cópia','estado da planilha')
 if action=='bootstrap':
  import copy
  meta=copy.deepcopy(next(n for n in w['nodes'] if n['name']=='Ler registros no Sheets'))
  meta['name']='Ler marcador do cadastro';meta['id']='rc5-bootstrap-marker-read';meta['position']=[2520,700]
  meta['parameters']['url']="={{ 'https://sheets.googleapis.com/v4/spreadsheets/' + $('Configuração e validação').first().json.config.spreadsheet_id + '?fields=namedRanges(namedRangeId,name)' }}"
  w['nodes'].append(meta)
  w['connections']['Ler registros no Sheets']['main'][0]=[{'node':meta['name'],'type':'main','index':0}]
  w['connections'][meta['name']]={'main':[[{'node':'Planejar operação','type':'main','index':0}],[{'node':'Falha técnica sanitizada','type':'main','index':0}]]}
 (root/filename).write_text(json.dumps(w,ensure_ascii=False,indent=2)+'\n')
# Reutiliza grafos de login/logout, com configuração e motor atualizados de forma determinística.
for filename,action in [('10_login_APP_MVP.json','login'),('12_logout_APP_MVP.json','logout')]:
 path=root/filename
 w=json.loads(path.read_text())
 for n in w['nodes']:
  if n['name']=='Configuração e validação':
   n['parameters']['jsCode']=core+'\nconst config='+json.dumps(config)+';\nreturn [{json:prepare('+json.dumps(action)+',$input.first().json,config)}];'
  if n['name']=='Planejar operação':
   n['parameters']['jsCode']=core+"\nreturn [{json:plan($('Configuração e validação').first().json,$input.first().json,$('Hash token candidato').first().json,Date.now())}];"
 path.write_text(json.dumps(w,ensure_ascii=False,indent=2)+'\n')
