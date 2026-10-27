"""Gera cópias locais de convites reutilizando os nodes já entregues. Não publica."""
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
base=json.loads((root/'11_sessao_APP_MVP.json').read_text())
core=(root/'fontes/auth-owner-mvp-core.js.txt').read_text()+'\n'+(root/'fontes/pelada-bootstrap-core.js.txt').read_text()+'\n'+(root/'fontes/convites-core.js.txt').read_text()
config={'spreadsheet_id':'1dRBMU7BH9PLzWjgAjj4VWnLUqpSVIWC6iKQj9URczMo','gid_jogadores':800101,'gid_tokens':2023862256,'gid_limites':1685501295,'gid_peladas':717198779,'gid_convites':800102,'origem':'https://resenhacampo5.netlify.app','frontend_url':'https://resenhacampo5.netlify.app'}
for number,action,method,path in [(14,'criar','POST','convites'),(15,'listar','GET','convites')]:
 w=json.loads(json.dumps(base));w['name']='RC5 — '+action+' convite';w['active']=False;w['pinData']={}
 w['nodes']=[n for n in w['nodes'] if n['name']!='Hash senha legado']
 w['connections'].pop('Hash senha legado',None)
 w['connections']['Configuração e dados válidos?']['main'][0]=[{'node':'Hash token recebido','type':'main','index':0}]
 for n in w['nodes']:
  p=n['parameters']
  if n['type'].endswith('.webhook'):
   p.update({'httpMethod':method,'path':'rc5-app-v1/'+path,'authentication':'none'});p['options']['allowedOrigins']=config['origem'];n.pop('credentials',None)
  if n['name']=='Configuração e validação':p['jsCode']=core+'\nconst config='+json.dumps(config)+';\nreturn [{json:prepareInvite('+json.dumps(action)+',$input.first().json,config)}];';n['notes']='Sessão e permissões validadas no backend. Sem Header Auth de ativação.'
  if n['name']=='Ler registros no Sheets':p['url']="={{ 'https://sheets.googleapis.com/v4/spreadsheets/' + $('Configuração e validação').first().json.config.spreadsheet_id + '/values:batchGet?ranges=JOGADORES!A:R&ranges=TOKENS_ACESSO!A:F&ranges=LIMITES_AUTH!A:E&ranges=PELADAS!A:N&ranges=CONVITES!A:O&ranges=MENSALIDADES!A:K&valueRenderOption=UNFORMATTED_VALUE' }}"
  if n['name']=='Planejar operação':p['jsCode']=core+"\nreturn [{json:planInvite($('Configuração e validação').first().json,$input.first().json,$('Hash token candidato').first().json,Date.now())}];"
  if n['name']=='Hash token recebido':p['value']="={{ $('Configuração e validação').first().json.token }}"
 w['settings'].update({'saveDataErrorExecution':'none','saveDataSuccessExecution':'none','saveManualExecutions':False,'saveExecutionProgress':False})
 (root/(str(number)+'_'+action+'_convite_APP_MVP.json')).write_text(json.dumps(w,ensure_ascii=False,indent=2)+'\n')
