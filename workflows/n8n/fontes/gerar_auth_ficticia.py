"""Gera arquivos locais. Não acessa rede, n8n, planilhas ou credenciais."""
from pathlib import Path
import json
import uuid

ROOT = Path(__file__).resolve().parents[1]
CORE = (ROOT / 'fontes/auth-ficticia-core.js.txt').read_text()
ACTIONS = [
    ('01_primeiro_acesso','primeiro_acesso','POST','primeiro-acesso'),
    ('02_criar_senha','criar_senha','POST','criar-senha'),
    ('03_login','login','POST','login'),
    ('04_consultar_sessao','sessao','GET','sessao'),
    ('05_logout','logout','POST','logout'),
    ('06_recuperar_senha','recuperar_senha','POST','recuperar-senha'),
    ('07_redefinir_senha','redefinir_senha','POST','redefinir-senha'),
]
CONFIG = {
    'modo':'BLOQUEADO',
    'revisao_limite_sha256_ficticio':False,
    'controle_escritor_unico_revisado':False,
    'privacidade_e_logs_revisados':False,
    'origem_e_credencial_hml_revisadas':False,
    'spreadsheet_id':'CONFIGURAR_ID_PLANILHA_COPIA_FICTICIA',
    'gid_jogadores':'CONFIGURAR_GID_JOGADORES_COPIA',
    'gid_tokens':'CONFIGURAR_GID_TOKENS_COPIA',
    'gid_limites':'CONFIGURAR_GID_LIMITES_COPIA',
    'pelada_id':'CONFIGURAR_PELADA_ID_TESTE',
    'origem':'CONFIGURAR_ORIGEM_FRONTEND_HML',
}
GOOGLE = {'googleSheetsOAuth2Api':{'id':'CONFIGURAR_CREDENCIAL_GOOGLE_HML','name':'CONFIGURAR_CREDENCIAL_GOOGLE_HML'}}
HEADER = {'httpHeaderAuth':{'id':'CONFIGURAR_CREDENCIAL_WEBHOOK_HML','name':'CONFIGURAR_CREDENCIAL_WEBHOOK_HML'}}

for filename,action,method,path in ACTIONS:
    nodes = []
    links = {}
    def node(name,kind,version,parameters,**extra):
        obj = {'parameters':parameters,'id':str(uuid.uuid5(uuid.NAMESPACE_URL,'rc5/auth-fixture/'+action+'/'+name)), 'name':name,'type':'n8n-nodes-base.'+kind,'typeVersion':version,'position':[240+(len(nodes)%5)*280,200+(len(nodes)//5)*220],**extra}
        nodes.append(obj)
        return name
    def edge(src,dest,index=0):
        branches = links.setdefault(src,{'main':[]})['main']
        while len(branches)<=index:branches.append([])
        branches[index].append({'node':dest,'type':'main','index':0})
    def code(name,text,**extra):return node(name,'code',2,{'mode':'runOnceForAllItems','language':'javaScript','jsCode':text},**extra)
    def condition(name,expression):return node(name,'if',2.3,{'conditions':{'options':{'caseSensitive':True,'leftValue':'','typeValidation':'strict','version':3},'conditions':[{'id':name,'leftValue':expression,'rightValue':'','operator':{'type':'boolean','operation':'true','singleValue':True}}],'combinator':'and'},'options':{}})
    node('Webhook de ensaio','webhook',2.1,{'httpMethod':method,'path':'rc5-auth-ficticia-v1/'+path,'authentication':'headerAuth','responseMode':'responseNode','options':{'allowedOrigins':'CONFIGURAR_ORIGEM_FRONTEND_HML'}},credentials=HEADER)
    code('Configuração e validação',CORE+'\nconst config = '+json.dumps(CONFIG,ensure_ascii=False)+';\nreturn [{json:prepare('+json.dumps(action)+',$input.first().json,config)}];',notesInFlow=True,notes='BLOQUEADO. SHA-256 de senha NÃO aprovado. Somente cópia com identidades TESTE_ e e-mails .invalid. Concurrency e criptografia pública continuam pendentes.')
    condition('Ensaio explicitamente autorizado?','={{ $json.canRun === true }}')
    crypto_options = [('Hash senha SOMENTE FIXTURE',{'action':'hash','type':'SHA256','encoding':'hex','value':"={{ $('Configuração e validação').first().json.password || 'SEM_SENHA_NESTA_ACAO' }}",'dataPropertyName':'passwordHash'}),('Hash token recebido',{'action':'hash','type':'SHA256','encoding':'hex','value':"={{ $('Configuração e validação').first().json.token || 'SEM_TOKEN_NESTA_ACAO' }}",'dataPropertyName':'tokenHash'}),('Token candidato aleatório',{'action':'generate','encodingType':'hex','stringLength':64,'dataPropertyName':'candidate'}),('Hash token candidato',{'action':'hash','type':'SHA256','encoding':'hex','value':'={{ $json.candidate }}','dataPropertyName':'candidateHash'})]
    for name,params in crypto_options:node(name,'crypto',2,params,onError='continueErrorOutput')
    node('Ler snapshot privado de teste','httpRequest',4.2,{'method':'GET','url':"={{ 'https://sheets.googleapis.com/v4/spreadsheets/' + $('Configuração e validação').first().json.config.spreadsheet_id + '/values:batchGet?ranges=JOGADORES!A:R&ranges=TOKENS_ACESSO!A:F&ranges=LIMITES_AUTH!A:E&valueRenderOption=UNFORMATTED_VALUE' }}",'authentication':'predefinedCredentialType','nodeCredentialType':'googleSheetsOAuth2Api','options':{'timeout':15000,'response':{'response':{'responseFormat':'json'}}}},credentials=GOOGLE,onError='continueErrorOutput')
    code('Planejar operação',CORE+"\nconst prepared = $('Configuração e validação').first().json;\nconst hashes = $('Hash token candidato').first().json;\nreturn [{json:plan(prepared,$input.first().json,hashes,Date.now())}];",notesInFlow=True,notes='Google batchUpdate é usado porque o node Sheets não agrupa senha e consumo de token em um único pedido. Atomicidade do lote NÃO substitui exclusão entre execuções.')
    condition('Há gravações planejadas?','={{ $json.requests.length > 0 }}')
    node('Aplicar lote no Sheets de teste','httpRequest',4.2,{'method':'POST','url':"={{ 'https://sheets.googleapis.com/v4/spreadsheets/' + $('Configuração e validação').first().json.config.spreadsheet_id + ':batchUpdate' }}",'authentication':'predefinedCredentialType','nodeCredentialType':'googleSheetsOAuth2Api','sendBody':True,'specifyBody':'json','jsonBody':"={{ { requests: $('Planejar operação').first().json.requests, includeSpreadsheetInResponse: false } }}",'options':{'timeout':15000,'response':{'response':{'responseFormat':'json'}}}},credentials=GOOGLE,onError='continueErrorOutput')
    code('Conferir confirmação do lote',"const expected = $('Planejar operação').first().json;\nconst response = $input.first().json;\nconst id = $('Configuração e validação').first().json.config.spreadsheet_id;\nif (response.spreadsheetId !== id || !Array.isArray(response.replies) || response.replies.length !== expected.requests.length) return [{json:{status:503,response:{sucesso:false,codigo:'RESULTADO_INDETERMINADO',mensagem:'Interrompa os testes e confira o estado da cópia.',modo:'TESTE_FICTICIO'}}}];\nreturn [{json:expected}];")
    code('Resposta mínima e entrega pendente',"const plan = $input.first().json;\n// Não envia e-mail. O transporte será aprovado/configurado em outra etapa.\nconst body = {...plan.response};\nif (['primeiro_acesso','recuperar_senha'].includes("+json.dumps(action)+")) body.email_enviado = false;\nreturn [{json:{status:plan.status,response:body}}];")
    code('Falha técnica sanitizada',"return [{json:{status:503,response:{sucesso:false,codigo:'DEPENDENCIA_INDISPONIVEL',mensagem:'Não foi possível concluir o ensaio. Não repita gravações sem conferir o estado.',modo:'TESTE_FICTICIO'}}}];")
    node('Responder sem dados internos','respondToWebhook',1.5,{'respondWith':'json','responseBody':'={{ $json.response }}','options':{'responseCode':'={{ $json.status }}','responseHeaders':{'entries':[{'name':'Cache-Control','value':'no-store'},{'name':'Pragma','value':'no-cache'},{'name':'Retry-After','value':"={{ $json.status === 429 ? '900' : '0' }}"}]}}})
    chain=['Webhook de ensaio','Configuração e validação','Ensaio explicitamente autorizado?','Hash senha SOMENTE FIXTURE','Hash token recebido','Token candidato aleatório','Hash token candidato','Ler snapshot privado de teste','Planejar operação','Há gravações planejadas?','Aplicar lote no Sheets de teste','Conferir confirmação do lote','Resposta mínima e entrega pendente','Responder sem dados internos']
    for src,dest in zip(chain,chain[1:]):edge(src,dest)
    edge('Ensaio explicitamente autorizado?','Responder sem dados internos',1)
    edge('Há gravações planejadas?','Resposta mínima e entrega pendente',1)
    for name,_ in crypto_options:edge(name,'Falha técnica sanitizada',1)
    for name in ['Ler snapshot privado de teste','Aplicar lote no Sheets de teste']:edge(name,'Falha técnica sanitizada',1)
    edge('Falha técnica sanitizada','Responder sem dados internos')
    flow={'name':'Resenha Campo 5 — '+action+' — BLOQUEADO / dados fictícios','nodes':nodes,'connections':links,'pinData':{},'active':False,'settings':{'executionOrder':'v1','timezone':'America/Sao_Paulo','saveDataErrorExecution':'none','saveDataSuccessExecution':'none','saveManualExecutions':False,'saveExecutionProgress':False,'executionTimeout':60},'tags':[]}
    (ROOT/(filename+'_ESTRUTURAL.json')).write_text(json.dumps(flow,ensure_ascii=False,indent=2)+'\n')
print('Gerados 7 JSONs estruturais, inativos e bloqueados. Nenhuma chamada remota.')
