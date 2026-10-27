"""Prepara um único Code node local. Sem acesso ao n8n, Sheets ou Asaas."""
from pathlib import Path
import json,os,copy
root=Path(__file__).resolve().parents[1]
p=root/'workflows/para importar/RESENHA_CAMPO_5.json'
w=json.loads(p.read_text());before=copy.deepcopy(w)
node=next(n for n in w['nodes'] if n['name']=='Valida e Prepara Dados Sessão')
code=node['parameters']['jsCode']
# Reexecução é idempotente; não duplica funções nem modifica outros nós.
marker='\n// Complementa a sessão já autorizada;'
if marker in code:
 start=code.index(marker);end=code.rfind('\nreturn [{json:')
 code=code[:start]+code[end:]
code=code.replace('json:planSessionWithPlayers(', 'json:planSession(')
pos=code.rfind('\nreturn [{json:')
assert pos>0
code=code[:pos]+'\n'+(root/'scripts/admin-player-list.js.txt').read_text()+code[pos:]
code=code.replace('json:planSession(', 'json:planSessionWithPlayers(')
node['parameters']['jsCode']=code
for old in before['nodes']:
 if old['id']!=node['id']:assert old==next(n for n in w['nodes'] if n['id']==old['id'])
assert before['connections']==w['connections']
p.write_text(json.dumps(w,ensure_ascii=False,indent=2)+'\n');os.chmod(p,0o600)
out=p.parent/'ATUALIZAR_SOMENTE_SESSAO.code.txt';out.write_text(code+'\n');os.chmod(out,0o600)
print('Preparado: substituir apenas o código de Valida e Prepara Dados Sessão. Nenhum outro nó alterado.')
