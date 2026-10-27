# Acesso único e Meu cadastro — 27/10/2026

Implementação local, sem acesso ao n8n e sem alteração de planilhas/Asaas.

## Comportamento

- “Criar minha pelada” abre nome, endereço, dia, horário, preços e regras sem pré-preenchimento da Resenha.
- A mesma tela de login aceita OWNER, ADMIN, mensalista e diarista. O backend decide os vínculos e permissões.
- OWNER lista/seleciona suas peladas e pode criar outra com a mesma conta. ADMIN administra somente sua pelada vinculada. Jogador consulta sua pelada e seu cadastro, sem controles administrativos.
- “Meu cadastro” permite consultar nome/CPF e editar apelido, telefone e e-mail. Backend rejeita campos extras, identidade de outro usuário, papel, categoria e dados financeiros.
- Com cliente Asaas já vinculado, somente apelido é editável. Telefone/e-mail ficam somente para consulta nesta etapa, pois a sincronização Asaas foi explicitamente excluída. Não há falsa confirmação de sincronização.
- Não foram criados novos recursos de jogo, financeiro ou recorrência; convites existentes foram preservados.

## Arquivos principais

Frontend: `src/components/OwnerAccess.tsx`, `AccessPanel.tsx`, `PersonalDetails.tsx`, `Landing.tsx`, `PeladaFields.tsx`, `src/lib/n8n/owner.ts`, `bootstrap.ts`.

Backend: `workflows/n8n/fontes/pelada-bootstrap-core.js.txt`, `gerar_primeiro_fluxo.py`, `atualizar_acesso_unico.py`, workflow 11 atualizado e novo 18. O gerador compartilha o motor também com 13/17, sem alteração do comportamento de bootstrap/criação.

Pacote completo atualizado: `workflows/etapa a pronta/RESENHA_ETAPA_A_PRONTO.json`. Dois nós existentes de código A11 alterados; 15 nós A18 adicionados; total 210. Todos os demais nós, inclusive integração financeira, foram comparados com o pacote anterior e preservados integralmente. Instruções manuais em `IMPORTAR.md`, na mesma pasta. Não importar sobre canvas preenchido.

## Dependências de publicação

- O usuário mantém a operação do n8n; é necessário publicar sessão 11 atualizada e novo endpoint 18. A proibição de acessar n8n foi respeitada.
- Publicação pelo repositório `Saintsolution/resenhacampo5`, branch `main`, via deploy automático do Netlify, conforme confirmado pelo usuário. A conta Netlify da CLI não possui esse projeto e não deve ser usada para publicar em outro site.
- JSON consolidado privado e seu backup permanecem locais, fora do commit. Sem chamadas financeiras, assinaturas, edição de credenciais ou registros remotos.

Validação: 78 testes locais aprovados, incluindo regressão de convites, isolamento por pelada, edição do titular, proteção financeira e renderização dos perfis. TypeScript, lint e build de produção aprovados. Dois testes de preservação do consolidado são condicionais à presença do export privado local, que não deve ser versionado.
