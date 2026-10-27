"""Fonte exclusiva: export oficial do usuário. Só prepara arquivos locais."""
from pathlib import Path
import json,copy,hashlib,uuid,os,re
root=Path(__file__).resolve().parents[1]
source=root/'workflows/resenha n8n restaurado/JogoLindo — Cadastro, Login, Peladas e Convites.json'
raw=source.read_bytes();w=json.loads(raw);original=copy.deepcopy(w)
addon=(root/'scripts/owner-registration-core.js.txt').read_text()
node=lambda name:next(n for n in w['nodes'] if n['name']==name)
modified=set()
for name in ['Normaliza Dados Cadastro OWNER e Pelada','Valida e Prepara Dados Cadastro OWNER e Pelada','Normaliza Dados Criar Outra Pelada','Valida e Prepara Dados Criar Outra Pelada']:
 n=node(name);code=n['parameters']['jsCode']
 if name.startswith('Normaliza'):
  pos=code.rfind('\nconst config=');code=code[:pos]+'\n'+addon+code[pos:]
  if 'Cadastro OWNER' in name:code=code.replace('prepareBootstrap($input.first().json,config)','prepareOwnerRegistration($input.first().json,config)')
 else:
  pos=code.rfind('\nreturn [{json:');code=code[:pos]+'\n'+addon+code[pos:]
  code=code.replace('json:planBootstrap(', 'json:planOwnerRegistration(' if 'Cadastro OWNER' in name else 'json:planFirstOrNextPelada(')
 n['parameters']['jsCode']=code;modified.add(name)
hook=node('Recebe Cadastro OWNER e Pelada');hook['parameters']['path']='rc5-app-v1/cadastrar-organizador';hook['parameters']['authentication']='none';hook.pop('credentials',None);modified.add(hook['name'])
for n in w['nodes']:
 code=n['parameters'].get('jsCode','')
 old="input.tipo==='ADMIN'&&!admin"
 if old in code:
  n['parameters']['jsCode']=code.replace(old,"input.tipo==='ADMIN'&&role!=='OWNER'").replace('Somente organizadores e administradores podem emitir esse convite.','Somente o OWNER pode convidar administradores.')
  modified.add(n['name'])
# Gerador manual de convite: não tem endpoint público, e não envia e-mail automaticamente.
code=node('Normaliza Dados Cadastro OWNER e Pelada')['parameters']['jsCode']
base=code[:code.rfind('\nconst config=')]
config=json.loads(re.search(r'\nconst config=(\{[^\n]+\});',code)[1])
y=max(n['position'][1] for n in w['nodes'])+700
new=[]
def add(name,type,parameters,version=2,template=None):
 n=copy.deepcopy(node(template)) if template else {'type':type,'typeVersion':version}
 n['name']=name;n['id']=str(uuid.uuid5(uuid.NAMESPACE_URL,'jogolindo-owner-separado/'+name));n['parameters']=parameters;n['position']=[len(new)*300,y];n.pop('onError',None);n.pop('disabled',None);new.append(n);return n
add('Gerar Convite OWNER Manual','n8n-nodes-base.manualTrigger',{},1)
add('Configura Destinatário Convite OWNER','n8n-nodes-base.code',{'jsCode':'const config='+json.dumps(config)+"; const digits=v=>String(v??'').replace(/\\D/g,'');"+'''
const destino={apelido:'PREENCHER_APELIDO',whatsapp:'PREENCHER_WHATSAPP',validade_horas:24};
let whatsapp=digits(destino.whatsapp);if(whatsapp.length===10||whatsapp.length===11)whatsapp='55'+whatsapp;
if(!destino.apelido.trim()||destino.apelido==='PREENCHER_APELIDO'||destino.apelido.length>40||!/^55\\d{10,11}$/.test(whatsapp)||!Number.isInteger(destino.validade_horas)||destino.validade_horas<1||destino.validade_horas>72)throw new Error('Preencha apelido, WhatsApp e validade do convite OWNER antes de executar.');
return [{json:{config,apelido:destino.apelido.trim(),whatsapp,expira_em:new Date(Date.now()+destino.validade_horas*3600000).toISOString()}}];
'''})
add('Gera Token Convite OWNER','n8n-nodes-base.crypto',{'action':'generate','dataPropertyName':'candidate','encodingType':'hex','stringLength':64},template='Gera Token Cadastro OWNER e Pelada')
add('Hash Token Convite OWNER','n8n-nodes-base.crypto',{'action':'hash','type':'SHA256','encoding':'hex','value':'={{ $json.candidate }}','dataPropertyName':'candidateHash'},template='Hash Token Gerado Cadastro OWNER e Pelada')
add('Prepara Gravação Convite OWNER','n8n-nodes-base.code',{'jsCode':'''const p=$('Configura Destinatário Convite OWNER').first().json,h=$input.first().json;
if(!/^[a-f0-9]{64}$/i.test(h.candidateHash))throw new Error('Hash nativo inválido.');
const cell=v=>({userEnteredValue:{stringValue:String(v)}});
const values=[h.candidateHash,'OWNER',p.whatsapp,'CADASTRAR_OWNER',p.expira_em,''];
return [{json:{requests:[{addNamedRange:{namedRange:{namedRangeId:'rc5_owner_token_'+h.candidateHash,name:'RC5_OWNER_TOKEN_'+h.candidateHash,range:{sheetId:p.config.gid_tokens,startRowIndex:0,endRowIndex:1,startColumnIndex:0,endColumnIndex:1}}}},{appendCells:{sheetId:p.config.gid_tokens,rows:[{values:values.map(cell)}],fields:'userEnteredValue'}}]}}];'''})
http=copy.deepcopy(node('Salva Dados Cadastro OWNER e Pelada')['parameters'])
http['url']="={{ 'https://sheets.googleapis.com/v4/spreadsheets/' + $('Configura Destinatário Convite OWNER').first().json.config.spreadsheet_id + ':batchUpdate' }}"
http['jsonBody']="={{ {requests:$('Prepara Gravação Convite OWNER').first().json.requests,includeSpreadsheetInResponse:false} }}"
add('Salva Convite OWNER','n8n-nodes-base.httpRequest',http,template='Salva Dados Cadastro OWNER e Pelada')
add('Entrega Link Convite OWNER','n8n-nodes-base.code',{'jsCode':'''const p=$('Configura Destinatário Convite OWNER').first().json,r=$input.first().json;
if(r.spreadsheetId!==p.config.spreadsheet_id||!Array.isArray(r.replies)||r.replies.length!==2)throw new Error('Gravação do convite não confirmada. Não envie o link.');
const token=$('Gera Token Convite OWNER').first().json.candidate;
const link=p.config.origem+'/#/cadastrar-owner?convite='+token;
const texto='Olá, '+p.apelido+'! Você recebeu um convite exclusivo de organizador do JogoLindo. Cadastre sua conta para criar suas peladas: '+link;
return [{json:{apelido:p.apelido,whatsapp:p.whatsapp,expira_em:p.expira_em,link_convite:link,whatsapp_url:'https://wa.me/'+p.whatsapp+'?text='+encodeURIComponent(texto),orientacao:'Link de uso único. Abra whatsapp_url para enviar a mensagem. Nenhuma mensagem foi enviada automaticamente.'}}];'''})
w['nodes']+=new
for a,b in zip(new,new[1:]):w['connections'][a['name']]={'main':[[{'node':b['name'],'type':'main','index':0}]]}
# Ajusta apenas a nomenclatura do ramo que agora cadastra somente a conta.
mapping={n['name']:n['name'].replace('Cadastro OWNER e Pelada','Cadastro OWNER') for n in w['nodes'] if 'Cadastro OWNER e Pelada' in n['name']}
def rename(v):
 if isinstance(v,str):return re.sub(r"\$\('([^']+)'\)",lambda m:"$('"+mapping.get(m[1],m[1])+"')",v)
 if isinstance(v,list):return [rename(x) for x in v]
 if isinstance(v,dict):return {k:rename(x) for k,x in v.items()}
 return v
for n in w['nodes']:n['name']=mapping.get(n['name'],n['name']);n['parameters']=rename(n['parameters'])
w['connections']={mapping.get(k,k):{t:[[{**e,'node':mapping.get(e['node'],e['node'])} for e in b] for b in branches] for t,branches in outs.items()} for k,outs in w['connections'].items()}
w['name']='JogoLindo — OWNER separado, Peladas e Convites';w['active']=False;w['pinData']={}
for key in ['id','versionId','activeVersionId','activeVersion','createdAt','updatedAt','meta','shared','triggerCount','versionCounter']:w.pop(key,None)
# Preserva todo ramo não relacionado à mudança, inclusive os nós de boleto/Asaas.
for old in original['nodes']:
 if old['name'] not in modified:
  current=copy.deepcopy(next(n for n in w['nodes'] if n['id']==old['id']))
  reverse={v:k for k,v in mapping.items()}
  current['name']=reverse.get(current['name'],current['name'])
  def back(v):
   if isinstance(v,str):return re.sub(r"\$\('([^']+)'\)",lambda m:"$('"+reverse.get(m[1],m[1])+"')",v)
   if isinstance(v,list):return [back(x) for x in v]
   if isinstance(v,dict):return {k:back(x) for k,x in v.items()}
   return v
  current['parameters']=back(current['parameters']);assert current==old,old['name']
assert hashlib.sha256(source.read_bytes()).hexdigest()==hashlib.sha256(raw).hexdigest()
folder=root/'workflows/para importar';folder.mkdir(exist_ok=True)
out=folder/'JogoLindo.json';out.write_text(json.dumps(w,ensure_ascii=False,indent=2)+'\n');os.chmod(out,0o600)
(folder/'FONTE.sha256').write_text(hashlib.sha256(raw).hexdigest()+'  '+str(source.relative_to(root))+'\n')
print(json.dumps({'arquivo':str(out.relative_to(root)),'nos':len(w['nodes']),'alterados':sorted(modified),'fonte_preservada':True,'publicado':False},ensure_ascii=False))
