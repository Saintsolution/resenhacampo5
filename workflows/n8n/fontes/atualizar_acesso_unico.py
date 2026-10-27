"""Atualiza SOMENTE o pacote local. Sem rede, importação ou publicação no n8n."""
from pathlib import Path
import copy
import json
import os
import uuid

root = Path(__file__).resolve().parents[1]
package = root.parent / 'etapa a pronta' / 'RESENHA_ETAPA_A_PRONTO.json'
w = json.loads(package.read_text())
before = copy.deepcopy(w)
backup = package.with_suffix('.antes_acesso_unico.bak')
if not backup.exists():
    backup.write_bytes(package.read_bytes())
    os.chmod(backup, 0o600)

def renamed(value, mapping):
    if isinstance(value, str):
        for old, new in mapping.items():
            value = value.replace("$('" + old + "')", "$('" + new + "')")
        return value
    if isinstance(value, list):
        return [renamed(v, mapping) for v in value]
    if isinstance(value, dict):
        return {k: renamed(v, mapping) for k, v in value.items()}
    return value

# O grafo/credenciais do 11 existente são mantidos; somente os dois Code nodes mudam.
session = json.loads((root / '11_sessao_APP_MVP.json').read_text())
mapping = {n['name']: 'A11 — ' + n['name'] for n in session['nodes']}
changed = {'A11 — Configuração e validação', 'A11 — Planejar operação'}
for node in session['nodes']:
    if mapping[node['name']] in changed:
        old = next(n for n in w['nodes'] if n['name'] == mapping[node['name']])
        old['parameters']['jsCode'] = renamed(node['parameters']['jsCode'], mapping)

# Ramo novo 18: nomes/IDs exclusivos. Reexecução local substitui, nunca acrescenta cópias.
w['nodes'] = [n for n in w['nodes'] if not n['name'].startswith('A18 — ')]
w['connections'] = {k: v for k, v in w['connections'].items() if not k.startswith('A18 — ')}
profile = json.loads((root / '18_meu_cadastro_APP_MVP.json').read_text())
mapping = {n['name']: 'A18 — ' + n['name'] for n in profile['nodes']}
google = copy.deepcopy(next(n['credentials'] for n in w['nodes'] if n['name'] == 'A11 — Ler registros no Sheets'))
base_y = max(n['position'][1] for n in w['nodes']) + 500
min_x = min(n['position'][0] for n in profile['nodes'])
min_y = min(n['position'][1] for n in profile['nodes'])
for node in profile['nodes']:
    node = renamed(node, mapping)
    node['name'] = mapping[node['name']]
    node['id'] = str(uuid.uuid5(uuid.NAMESPACE_URL, 'rc5-acesso-unico/' + node['name']))
    node['position'] = [node['position'][0] - min_x, node['position'][1] - min_y + base_y]
    if node['type'] == 'n8n-nodes-base.httpRequest':
        node['credentials'] = copy.deepcopy(google)
    if node['type'] == 'n8n-nodes-base.webhook':
        node['webhookId'] = str(uuid.uuid5(uuid.NAMESPACE_URL, 'rc5-acesso-unico/meu-cadastro'))
    w['nodes'].append(node)
for name, outputs in profile['connections'].items():
    w['connections'][mapping[name]] = {t: [[{**edge, 'node': mapping[edge['node']]} for edge in branch] for branch in branches] for t, branches in outputs.items()}
w['active'] = False
w['pinData'] = {}
assert len(w['nodes']) == 210
assert len({n['name'] for n in w['nodes']}) == 210
assert len({n['id'] for n in w['nodes']}) == 210
routes = [(n['parameters'].get('httpMethod', 'GET'), n['parameters']['path']) for n in w['nodes'] if n['type'] == 'n8n-nodes-base.webhook' and not n.get('disabled')]
assert len(routes) == len(set(routes)) == 11
# Preservação exata de cada nó original fora dos dois Code nodes de sessão.
for node in before['nodes']:
    if node['name'] not in changed and not node['name'].startswith('A18 — '):
        assert node == next(n for n in w['nodes'] if n['name'] == node['name']), node['name']
for name, outputs in before['connections'].items():
    if not name.startswith('A18 — '):
        assert outputs == w['connections'][name], name
package.write_text(json.dumps(w, ensure_ascii=False, indent=2) + '\n')
os.chmod(package, 0o600)
print(json.dumps({'arquivo': str(package), 'nos': 210, 'rotas_ativas_unicas': 11, 'nos_existentes_modificados': sorted(changed), 'demais_nos_preservados': True, 'publicado': False}, ensure_ascii=False))
