# Resenha Futebol Campo 5 — Auditoria inicial n8n, Sheets e frontend

Data: 22/10/2026. Escopo exclusivo: Resenha Campo 5.

## 1. Escopo, método e limites

Auditoria estática de todos os JSONs encontrados em `workflows/n8n/`, leitura de metadados/cabeçalhos e de CONFIG/DASHBOARD no Google Sheets, e inspeção do frontend. Não foram consultadas linhas cadastrais ou financeiras dos jogadores na planilha. Os valores de dados fixados dos webhooks não foram reproduzidos.

Somente este relatório foi criado. Nenhum JSON original, frontend, planilha, workflow remoto, configuração do servidor ou cobrança foi alterado. Nenhum webhook foi invocado, e-mail enviado, workflow importado/ativado ou deploy executado.

O estado descrito é o do arquivo exportado e do código local. Não comprova o estado atual do servidor, a validade das credenciais, as permissões de compartilhamento ou sucesso de execução. Não há MCP n8n; ele não é necessário para esta análise. Arquivos históricos de outra arquitetura não são considerados funcionalidades operacionais do Resenha Campo 5.

## 2. Workflow existente e preservação

Único JSON encontrado: `workflows/n8n/resenhacampo5.json`.

- Nome exportado: `resenhacampo5`.
- Exportado com `active: false`; isso não comprova se existe outra versão ativa no servidor.
- 43 nós: dois webhooks, três Code nodes, sete Google Sheets, sete Crypto, nove IF, oito Set, seis Respond to Webhook e um Gmail.
- Settings exportadas: `executionOrder: v1` e `binaryMode: separate`.
- Há referências a credenciais gerenciadas `googleSheetsOAuth2Api` e `gmailOAuth2`. Seus nomes/IDs de conta não são reproduzidos e precisarão ser selecionados/verificados no ambiente de importação.
- Há dados fixados (`pinData`) em dois webhooks; não presumir que são fictícios.
- SHA-256 do ARQUIVO ORIGINAL para comprovar preservação: `8e9b52d0b37faac97f91ed88affcd1a80cd1a77fa358ae8c88e2f8279a315633`. Este valor é checksum do arquivo, não hash de usuário.

### Versões declaradas dos nós

| Tipo n8n-nodes-base | typeVersion | Quantidade |
| --- | --- | --- |
| webhook | 2.1 | 2 |
| code | 2 | 3 |
| googleSheets | 4.7 | 7 |
| crypto | 2 | 7 |
| if | 2.3 | 9 |
| set | 3.4 | 8 |
| respondToWebhook | 1.5 | 6 |
| gmail | 2.2 | 1 |

`typeVersion`, `versionId` e `executionOrder` NÃO informam a versão do servidor n8n. A versão instalada e a compatibilidade de todos os tipos continuam pendentes. Não atualizar o servidor para acomodar o arquivo sem autorização.

### Webhooks e caminhos existentes no export

| Nó | Método | Path | Resposta | Origem configurada |
| --- | --- | --- | --- | --- |
| Resenha Login | POST | `resenhacampo5-login` | responseNode | `http://localhost:5173` |
| Recebe Criar Senha Jogador | POST | `criar-senha` | responseNode | `*` |

Não foram obtidas/copied URLs de teste ou produção a partir dos dados fixados. Os paths acima não garantem que as URLs estejam ativas. O prefixo, o ambiente e o domínio externo devem ser confirmados antes da conexão.

### Ramos já construídos

1. **Login por CPF:** normalização, validação dos dígitos verificadores, busca de jogador, teste de existência de senha, comparação de hash, geração de token, tentativa de gravação da sessão e resposta.
2. **Primeiro acesso:** jogador sem senha → consulta de token inicial → decisão de reutilizar aviso ou gerar token → gravação de hash no Sheets → composição de link → envio Gmail → resposta.
3. **Criação de senha:** recebe token/senha → valida formato → gera hash do token → consulta no Sheets → verifica finalidade, expiração e utilização → gera hash da senha → atualiza jogador → marca token utilizado → responde.
4. **Redefinição parcial:** o validador de token aceita a finalidade `REDEFINIR_SENHA`, mas não há emissor de recuperação, endpoint próprio ou revogação de sessões. Não classificar recuperação como completa.
5. **Sessão parcial:** geração/hash/gravação existem, mas não há endpoint que consulte e valide uma sessão nem logout.

## 3. Estrutura real do Google Sheets

Fonte lida: [planilha operacional](https://docs.google.com/spreadsheets/d/1dRBMU7BH9PLzWjgAjj4VWnLUqpSVIWC6iKQj9URczMo/edit).

Spreadsheet ID confirmado: `1dRBMU7BH9PLzWjgAjj4VWnLUqpSVIWC6iKQj9URczMo`.

Locale `pt_BR`, fuso `America/Sao_Paulo`; 11 abas, todas com 1000 linhas, 26 colunas e primeira linha congelada na leitura atual. Isso é capacidade de grade, não quantidade de registros preenchidos.

| Aba | sheetId/gid | Cabeçalhos exatos na ordem lida |
| --- | --- | --- |
| CONFIG | `361998709` | `Chave`, `Valor`, `Descrição` |
| JOGADORES | `800101` | `participante_id`, `pelada_id`, `nome`, `apelido`, `cpf`, `telefone`, `email`, `categoria`, `papel_administrativo`, `situacao`, `asaas_customer_id`, `convidado_por_id`, `convidado_por_nome`, `criado_em`, `atualizado_em`, `senha_hash`, `token_sessao_hash`, `token_expira` |
| TOKENS_ACESSO | `2023862256` | `token_hash`, `tipo_usuario`, `id_usuario`, `finalidade`, `expira_em`, `utilizado_em` |
| CONVITES | `800102` | `convite_id`, `pelada_id`, `convidador_id`, `convidador_nome`, `telefone_destino`, `categoria_destino`, `emitido_em`, `expira_em`, `situacao`, `utilizado_em`, `participante_id`, `email_confirmado_em` |
| COBRANCAS | `800103` | `payment_id`, `participante_id`, `jogo_id`, `tipo`, `competencia`, `vencimento`, `valor_bruto`, `status_asaas`, `data_pagamento`, `valor_recebido`, `taxa_asaas`, `valor_liquido`, `asaas_customer_id`, `subscription_id`, `invoice_url`, `atualizado_em` |
| MENSALIDADES | `800104` | `participante_id`, `apelido`, `competencia`, `vencimento`, `valor`, `payment_id`, `subscription_id`, `status_asaas`, `pago_em`, `apto_financeiro`, `atualizado_em` |
| DIARIAS | `800105` | `jogo_id`, `data_jogo`, `participante_id`, `apelido`, `convidador_id`, `convidador_nome`, `com_colete`, `valor`, `payment_id`, `status_asaas`, `pago_em`, `apto_financeiro` |
| CAIXA | `800106` | `movimento_id`, `data_movimento`, `jogo_id`, `payment_id`, `categoria`, `descricao`, `valor_entrada`, `valor_saida`, `taxa`, `valor_liquido`, `situacao`, `registrado_por` |
| EVENTOS_ASAAS | `800107` | `event_id`, `payment_id`, `tipo_evento`, `recebido_em`, `processado_em`, `resultado`, `tentativas`, `erro_resumido` |
| JOGOS_SCOUT | `800108` | `jogo_id`, `data_jogo`, `horario`, `participante_id`, `apelido`, `categoria`, `presenca`, `colete`, `funcao`, `valor_combinado`, `pagamento_conferido`, `ocorrencias`, `registrado_por`, `atualizado_em` |
| DASHBOARD | `800109` | `Indicador`, `Valor`, `Observação` |

`sheetId/gid` é o identificador numérico da aba; não confundir com o Spreadsheet ID nem com credencial OAuth2. A credencial n8n precisa de acesso à planilha; o ID do documento por si só não concede acesso.

### Cruzamento dos sete nós Google Sheets

| Nó | Aba | Operação | Colunas consultadas/gravadas | Resultado do cruzamento |
| --- | --- | --- | --- | --- |
| Busca Login Resenha | JOGADORES | leitura; operação não explicitada no export | filtro `cpf`; consome `row_number`, `senha_hash`, `participante_id`, `nome`, `email` | Cabeçalhos persistidos existem; filtro sem pelada/ambiente |
| Busca Token Jogador | TOKENS_ACESSO | leitura; operação não explicitada | `tipo_usuario`, `id_usuario`, `finalidade` | Colunas existem; sem seleção única determinística de token válido |
| Salva Sessão Jogador | JOGADORES | update | match `cpf`; grava `token_sessao_hash`, `token_expira` | Colunas existem, mas valor de match usa `cpf_assoc`, não produzido pelo normalizador |
| Salva Token jogador | TOKENS_ACESSO | append | `token_hash`, `tipo_usuario`, `id_usuario`, `finalidade`, `expira_em` | Colunas existem; uso inicial em branco é implícito; sem idempotência de emissão |
| Busca Token Criar Senha Jogador | TOKENS_ACESSO | leitura; operação não explicitada | `token_hash`, `tipo_usuario` | Colunas existem; filtro fixo JOGADOR limita caminho OWNER/ADMIN |
| Update Jogador Senha Hash | JOGADORES | update | match `participante_id`; grava `senha_hash` | Colunas existem; não verifica previamente conta/quantidade de linhas atualizadas |
| Marca Token Utilizado Jogador | TOKENS_ACESSO | update | match `token_hash`; grava `utilizado_em` | Colunas existem; gravação posterior à senha não é transação |

`row_number` aparece nos esquemas/condições como metadado do conector, não como cabeçalho ausente da planilha. Validar o retorno real do node 4.7 em homologação, inclusive quando não encontra linhas.

Somente JOGADORES e TOKENS_ACESSO são usados pelos workflows fornecidos. A existência das outras abas não comprova integração financeira, convites ou gestão de jogos.

### Inconsistências de modelo e configuração

- CONFIG ainda declara Supabase como origem e a planilha como espelho. São textos antigos; a arquitetura atual aprovada é React/Netlify + n8n + Sheets + Asaas. Não foram corrigidos nesta auditoria.
- A autenticação está modelada no export dentro de JOGADORES/TOKENS_ACESSO, na planilha operacional. Diverge da proposta anterior de armazenamento privado separado; requer decisão expressa antes de gerar fluxos definitivos.
- `cpf` é o cabeçalho real, não `cpf_mascarado`. Não se afirma como as linhas estão preenchidas, pois não foram lidas.
- Não há abas explícitas de ambientes, peladas, identidades globais, delegações/permissões de ADMIN ou sessões independentes. CONFIG descreve uma pelada fixa.
- A identidade de login no export usa `participante_id`, que representa vínculo à pelada. Ainda não há identidade única reutilizável entre vários vínculos.
- COBRANCAS, MENSALIDADES, DIARIAS, CAIXA, EVENTOS_ASAAS e JOGOS_SCOUT não têm `ambiente_id`; várias também não têm `pelada_id`. O isolamento dependeria de relacionamentos indiretos não implementados. É necessário aprovar o modelo e a estratégia de consultas, não simplesmente acrescentar colunas sem avaliação.
- O dashboard soma recebimentos por tipo e movimentos sem filtro de período/pelada/status explícito. Só funciona corretamente com disciplina de atualização ainda não implementada; estornos e taxas precisam de reconciliação. Não somar receitas de COBRANCAS novamente às entradas de CAIXA.
- Contadores de jogadores contam linhas, não necessariamente pessoas únicas ou vínculos ativos. Isso precisa ser definido para várias peladas.

## 4. Problemas concretos e riscos

Prioridade P0: bloqueia autenticação/segurança; P1: correção funcional antes da integração; P2: completar escopo operacional.

| ID | Prioridade | Evidência | Impacto / tratamento futuro |
| --- | --- | --- | --- |
| A01 | P0 | `Hash Senha Login Resenha` e `Cria Hash Senha Jogador` usam Crypto v2 hash, sem salt/custo; `type` não explicitado | Referência oficial atual do Crypto v2 usa SHA256 como padrão. Hash rápido não atende a senha; trocar por Argon2id/bcrypt após validar runner. Não afirmar algoritmo efetivo instalado sem versão. |
| A02 | P0 | `Salva Sessão Jogador` lê `Normaliza Login Resenha.json.cpf_assoc`; o normalizador retorna `cpf` | Match fica sem o identificador esperado; sessão pode não persistir e o caminho ainda tenta responder autorizado. |
| A03 | P0 | `Token Inicial Jogador Ainda Válido?` compara duas strings vazias | Não testa expiração/uso. Token existente, mesmo expirado, pode conduzir ao aviso de link já enviado e impedir reemissão. |
| A04 | P0 | Resposta autorizada inclui campo `token_sessao` e CPF; não há Set-Cookie | Diverge da proposta de sessão HttpOnly e minimização de dados. Definir contrato e retirar CPF completo da resposta. |
| A05 | P0 | Dados fixados nos dois webhooks contêm campos de identificação, senha e/ou token | Não publicar o original sem sanitização aprovada. Preservado intocado por exigência; não reproduzidos os valores. Não é possível presumir que sejam fictícios. |
| A06 | P0 | Sem rate limit, guarda de status de usuário ou autorização por ambiente/pelada no fluxo | Possível abuso/enumerar cadastros; inexistente controle real OWNER/ADMIN. CORS não substitui autenticação ou permissão. |
| A07 | P0 | Atualiza senha e depois marca token, sem serialização/recovery | Duas chamadas podem reutilizar token; falha parcial deixa senha alterada e token disponível. Nenhuma unicidade/transação comprovada no Sheets. |
| A08 | P1 | Primeiro acesso diferencia jogador existente sem senha e envia e-mail pelo endpoint de login | Revela estado da conta; falta limite/reenvio seguro. Não presume implementação completa de recuperação. |
| A09 | P1 | Leitura e update de login por CPF sem pelada/ambiente; referências `.first()` | Vários vínculos do mesmo CPF podem selecionar o primeiro jogador ou produzir múltiplos itens/atualizações. Definir identidade global e vínculo antes de ampliar escopo. |
| A10 | P1 | Link principal de criar senha contém domínio placeholder, nome antigo e token em query | Link não utilizável como entregue; token pode aparecer em logs/histórico. Rodapé contém URL Netlify candidata, mas não valida o domínio oficial. Confirmar URL e forma de transporte. |
| A11 | P1 | CORS login apenas localhost; criar senha com wildcard | Não corresponde à origem Netlify e não está preparado para sessão com credenciais; revisar por ambiente e proteção CSRF. |
| A12 | P1 | `Monta Login Jogador Negado` cria `autnticado` | Erro de nome, incompatível com `autenticado` usado nos outros ramos. |
| A13 | P1 | `Monta Sucesso Criar Senha Jogador` define `mensagem` duas vezes | Atribuição ambígua/sobrescrita; provavelmente faltou campo `codigo`. |
| A14 | P1 | `Responde Criar Senha Jogador` sempre 200, inclusive para erro | Frontend não consegue distinguir falha por status HTTP; padronizar erros e sucesso. |
| A15 | P1 | Busca de token não escolhe token válido/mais recente; uso de `.first()` e saída com vários itens | Emissões repetidas podem selecionar errado ou produzir respostas concorrentes. Definir cardinalidade e invalidação dos anteriores. |
| A16 | P1 | `Valida Token Criar Senha Jogador` aceita CRIAR_SENHA e REDEFINIR_SENHA; sem guarda de senha já existente | Mistura criação inicial e redefinição. Redefinição não revoga sessões; criação não assegura que não sobrescreve conta já configurada. |
| A17 | P1 | Validador admite OWNER/ADMIN, mas busca anterior filtra JOGADOR e grava apenas JOGADORES | Não é suporte real ao login administrativo. O tipo administrativo precisa vir do vínculo autorizado, não do token recebido. |
| A18 | P1 | Sem ramos de erro técnico/compensação; retries somente em parte das leituras/updates | Falhas Google/Gmail não recebem resposta de aplicação controlada. Token pode ficar salvo sem e-mail; gravação pode não afetar linha e ainda prosseguir. Verificar resultado de cada update. |
| A19 | P1 | Hash do token usa defaults; saída randômica hex de 64 caracteres | A estrutura tem geração segura na implementação oficial atual, mas fixar SHA256 e validar no runtime real. Probe do runner ainda pendente; não confundir Crypto node com require no Code node. |
| A20 | P1 | Sem revogação, histórico de sessões, inatividade ou validação de sessão | Campo único de token por jogador implica sobrescrita de sessão, não gestão completa; logout e recuperação precisam invalidar acesso. |
| A21 | P1 | Dados de senha/CPF/token transitam entre nodes; export não define retenção/redação | Auditar histórico, logs e erros no n8n/proxy antes de dados reais. Não concluir configuração global a partir da ausência no export. |
| A22 | P2 | Gmail interpola nome no HTML sem escape explícito | Evitar conteúdo HTML injetado no e-mail; aprovar sanitização, remetente e template exclusivo Resenha Campo 5. |
| A23 | P1 | Login não exige senha não vazia no normalizador | Para conta com senha, deveria validar presença e limites antes de hash. A falta de senha hoje também aciona emissão de primeiro acesso, comportamento a revisar. |

O token de primeiro acesso é emitido por **30 minutos**, coerente com o e-mail desse ramo. Ele não é um convite de inscrição; não confundir automaticamente com a regra de 72h dos convites. A regra deve ser aprovada por finalidade.

Referência técnica usada somente para interpretar o nó exportado: [código oficial Crypto v2](https://github.com/n8n-io/n8n/blob/master/packages/nodes-base/nodes/Crypto/v2/CryptoV2.node.ts). A versão atual de referência mantém hash simples e geração baseada em randomBytes; não comprova versão/capacidades do servidor.

## 5. Frontend examinado

- Entrada `src/main.tsx` renderiza App, sem AuthProvider ou roteador.
- App usa estado local para Visão geral, Jogadores, Financeiro, Jogos e Convites. Não há rotas implementadas `/entrar`, `/criar-senha` ou `/dashboard`, embora o workflow retorne/monte esses caminhos. O rewrite Netlify permite servir HTML, mas não implementa as telas por URL.
- `AuthScreen.tsx` existe, porém não é montado; recebe e-mail/senha e, no cadastro, nome/telefone. Invoca métodos do contexto desconectado, não webhooks.
- O login do workflow espera `{cpf, senha}`; o dado fixado de login usa o nome de campo `cpf_assoc`. O normalizador exige `cpf`. Não reproduzidos os valores.
- A criação de senha recebe `{token, senha}`. Campos adicionais dos dados fixados não são utilizados pelo normalizador.
- `AuthContext.tsx` retorna sessão/usuário nulos e erro de autenticação indisponível. Não há criação ou recuperação real de senha.
- Cliente `src/lib/n8n/http.ts` oferece transporte, mas não é instanciado ou chamado no App. Config contém somente base pública n8n. Nenhum payload é efetivamente enviado pelo frontend atual.
- O cliente HTTP omite cookies (`credentials: omit`) e não injeta CSRF. Precisa de alteração aprovada se o contrato optar por sessão HttpOnly.
- Métodos de cadastro antigos pedem senha mínima de seis caracteres; criação de senha no workflow exige oito e composição. Política e mensagens não estão alinhadas.
- Papéis exibidos e seleção de blocos não são autorização. BlockSelect preserva condições permissivas para organizador, mas não consulta backend nem é montado.
- Tipos preservados ainda misturam owner/admin em categoria financeira; não usar esses tipos como contrato definitivo.
- Financeiro do App é simulado. Não há SDK/chamada HTTP Asaas ou endpoint de eventos financeiros no frontend nem no JSON.
- Busca/filtros, convites demonstrativos, inclusão local de jogador e presença local já existem e podem ser reaproveitados. Ativo/Inativo ainda não foi aplicado; status atual usa pagamento simulado. Deve separar vínculo, finanças e aptidão.

## 6. Matriz de funcionalidades e workflows necessários

“Não localizado” significa somente ausente dos arquivos fornecidos, não prova ausência em outras partes do servidor. P0 = fundação bloqueante; P1 = operação principal; P2 = operação de campo/consolidação.

| Workflow | Já existe? | Situação atual | O que falta | Prioridade |
| --- | --- | --- | --- | --- |
| Criar senha / primeiro acesso | Sim, ramo do JSON | Normaliza, busca, valida token, grava senha, marca uso; envio Gmail construído | Criptografia de senha, condição vazia, contrato/origem/link, concorrência e erros | P0 |
| Recuperar/redefinir senha | Parcial | Validador aceita finalidade de redefinição | Emissão própria, resposta genérica, prazo, revogação e testes | P0 |
| Login | Sim, ramo do JSON | Consulta por CPF, compara hash e tenta salvar sessão | Match divergente, hash seguro, status/limites e contrato consistente | P0 |
| Consultar sessão | Não localizado | Apenas token/expiração gravados no login | Endpoint, expiração/revogação e identidade/permissões | P0 |
| Logout | Não localizado | Sem revogação | Endpoint idempotente e invalidação efetiva | P0 |
| Administração de ambientes/peladas | Não localizado | Tipos e seleção antiga sem backend | OWNER verificado, criação/listagem/configuração e isolamento | P1 |
| Delegação de ADMIN por pelada | Não localizado | Campo papel_administrativo no Sheets | Concessão/remoção, permissões delegáveis, auditoria e guardas | P1 |
| Convites individuais/em lote | Não localizado | Aba CONVITES e modal demonstrativo | Emissão/reenvio/validação, vínculo à pelada, 72h e envio controlado | P1 |
| Inscrição de jogadores/vínculos | Não localizado | Inclusão local e validação CPF reutilizável | Identidade global, deduplicação e vínculos independentes por pelada | P1 |
| Cliente e cobrança Asaas | Não localizado | Cabeçalhos e tipos somente | Consulta por CPF na conta correta, idempotência e cobrança de teste | P1 |
| Notificações Asaas | Não localizado | Aba de eventos somente | Webhook autenticado, deduplicação, confirmação/estorno/vencimento e reconciliação | P1 |
| Assinaturas | Não localizado | Campo subscription_id/tipo somente | Ativar após primeiro pagamento, evitar duplicação e acompanhar ciclo | P1 |
| Consulta participantes/financeiro | Parcial no visual | Tabelas/dados locais e fórmulas iniciais | Endpoints autorizados, filtros por pelada, minimização de dados | P1 |
| Aptidão | Não localizado | Booleanos financeiros nas abas e cálculo ilustrativo | Regra por jogo/pelada, restrições administrativas e estornos | P1 |
| Fila, presença e coletes | Parcial no visual | Presença alternável em memória | Persistência, ordenação, prioridades, coletes e fechamento | P2 |
| Dashboard/quadro da pelada | Parcial no visual/Sheets | Layout, banner e fórmulas iniciais | Dados reais, totais por pelada/OWNER, quadro público mínimo e autorização | P2 |

## 7. Dependências e ordem recomendada

1. Confirmar versão n8n/runners/criptografia, sanitização, domínio, topologia e modelo de identidade/armazenamento. Não criar novas planilhas/colunas sem aprovação.
2. Corrigir e separar os ramos já existentes de criação de senha e login, preservando original. Completar recuperação, sessão e logout. Alinhar contrato com frontend antes de conectar.
3. Validar OWNER do ambiente; implementar criação/configuração de peladas e delegação/revogação de ADMIN por pelada.
4. Implementar convites vinculados à pelada, individuais/lote; depois inscrição e associação à identidade global.
5. Implementar cliente/cobrança Asaas de homologação e receptor de eventos. O receptor deve estar testado antes de qualquer cobrança real.
6. Implementar assinatura após confirmação inicial, conciliação financeira e aptidão por jogo.
7. Implementar presença/fila/coletes, quadro da pelada e dashboard, reaproveitando componentes existentes.
8. Homologar papéis, isolamento entre ambientes/peladas, concorrência, tokens usados/expirados, revogações, falhas parciais e eventos repetidos antes da publicação.

Dependências principais:
- Login/criar senha → usuário e criptografia verificados → sessão/revogação → todas as operações protegidas.
- Ambiente/OWNER → peladas → delegações/vínculos → convites/cadastros.
- Conta Asaas correta + vínculo → cliente/cobrança → eventos idempotentes → assinatura/aptidão.
- Aptidão + jogo → fila/presença; movimentos conciliados → financeiro/dashboard.
- Todos os escritores de autenticação precisam de serialização/recovery coerente com Sheets e a topologia n8n. Não usar mutex em célula como prova de exclusão distribuída.

## 8. Informações necessárias antes de gerar os próximos JSONs

- Versão instalada do n8n, modo de execução, versão/imagem dos runners e disponibilidade real de Argon2id/bcrypt; resultado sanitizado do probe.
- Exportação dos outros workflows, se existirem. O diretório contém somente o JSON aqui auditado.
- Confirmar credenciais Google Sheets e Gmail existentes no n8n e seus escopos, sem enviar chaves/tokens. Identificadores de credencial serão placeholders na nova entrega.
- Definir login por CPF ou e-mail, identidade global, bootstrap seguro do OWNER e permissões delegadas por pelada.
- Decidir armazenamento privado separado ou outra separação autorizada para autenticação; verificar compartilhamento sem expor os registros. Não presumir que esta planilha seja privada.
- Confirmar URL frontend. O template cita uma URL Netlify no rodapé, mas o botão principal continua placeholder. Confirmar também URLs reais de homologação/produção dos webhooks e política de cookie/CORS/CSRF.
- Aprovar modelo de ambientes/peladas/vínculos e regras de unicidade; hoje faltam estruturas explícitas.
- Definir finalidade/prazo de cada token, reenvio, confirmação de e-mail e estratégia de revogação.
- Confirmar topologia e mecanismo de serialização de gravações para impedir repetição de token/duplicação.
- Para etapa financeira: conta Asaas correta por OWNER, sandbox, política do primeiro ciclo/recorrência e autenticação do webhook. Nenhuma chave deve ser fornecida neste relatório.
- Aprovar política de registro de execuções, proteção de dados fixados, retention e auditoria sanitizada.

## 9. Validação realizada e limitações

- JSON parseado com sucesso.
- Nomes e IDs de nó únicos; nenhum destino de conexão ausente; nenhuma referência de nó inexistente em expressões estáticas.
- Sintaxe de três Code nodes e 44 expressões completas compilada sem execução do código. Isso não prova item linking, contexto n8n, schemas de parâmetros, disponibilidade dos nodes, validade de credenciais ou resultado de operações.
- Todos os sete nós Sheets cruzados com os cabeçalhos reais; nenhum cabeçalho persistido referenciado falta nas duas abas usadas. O erro de cpf_assoc é no campo de origem, não ausência da coluna cpf.
- Registro de todas as conexões e de cada nó no anexo abaixo.
- Não executar build/testes do frontend foi uma escolha de escopo: frontend não foi modificado e esta auditoria não é teste funcional de backend.
- Após escrita deste relatório, conferir checksum do JSON original e arquivos frontend contra o manifesto inicial.

## 10. Próxima entrega, após autorização

Gerar JSONs separados por funcionalidade, inativos, com todos os nós/conexões/erros e placeholders explícitos para configurações ausentes; README de configuração e roteiro de homologação. Não substituir o original nem reaproveitar dados fixados pessoais. Não publicar ou executar alterações por esta auditoria.


## Anexo A — Inventário de todos os nós

| Nó | Tipo / versão | Inspeção |
| --- | --- | --- |
| Token Associado Existe? | if / 2.3 | Testa token_hash não vazio; não valida sozinho validade/uso. |
| Monta Link Inicial Já Enviado | set / 3.4 | Monta aviso; depende da condição de validade atualmente vazia. |
| Resenha Login | webhook / 2.1 | Webhook POST de login; origem limitada a localhost. |
| Normaliza Login Resenha | code / 2 | Code: normaliza CPF e valida dígitos; retorna cpf e senha_para_hash; não cpf_assoc. |
| IF Login Resenha Válido? | if / 2.3 | Desvia pelo booleano requisicao_valida. |
| Busca Login Resenha | googleSheets / 4.7 | Consulta JOGADORES por cpf, retry e alwaysOutputData. |
| IF Jogador Existe? | if / 2.3 | Testa row_number; retorno do conector precisa de homologação. |
| Jogador Tem Senha? | if / 2.3 | Testa senha_hash; ausência inicia envio de primeiro acesso. |
| Hash Senha Login Resenha | crypto / 2 | Hash simples de senha; referência .item exige item linking íntegro. |
| Responde Login Jogador Incompleto | respondToWebhook / 1.5 | Responde JSON HTTP 400 para dados inválidos. |
| Responde Login Jogador Inexistente | respondToWebhook / 1.5 | Responde JSON HTTP 401; expressão com quebra de linha deve ser homologada no motor n8n. |
| Busca Token Jogador | googleSheets / 4.7 | Consulta tokens por tipo, usuário e finalidade; sem seleção única por validade. |
| Senha Jogador Válida? | if / 2.3 | Compara igualdade de hashes; não usa verificador de senha com salt/custo. |
| Gera Token Sessão Jogador | crypto / 2 | Gera string hex configurada com 64 caracteres. |
| Monta Login Jogador Negado | set / 3.4 | Atribui autnticado, com erro de grafia. |
| Responde Login Jogador Negado | respondToWebhook / 1.5 | Retorna o objeto montado com HTTP 401. |
| Salva Sessão Jogador | googleSheets / 4.7 | Update por cpf alimentado com campo cpf_assoc divergente. |
| Hash Token Sessão Jogador | crypto / 2 | Hash do token de sessão; algoritmo não explícito. |
| Monta Login Jogador Autorizado | set / 3.4 | Expõe token de sessão em JSON e CPF; destino /dashboard não implementado. |
| Responde Login Jogador Autorizado | respondToWebhook / 1.5 | Resposta JSON, sem cookie HttpOnly. |
| Token Inicial Jogador Ainda Válido? | if / 2.3 | Condição vazia compara strings vazias; não verifica tempo nem utilizado_em. |
| Generate a random string Jogador | crypto / 2 | Gera token inicial hex configurado com 64 caracteres. |
| Cria Token Hash Inicial Jogador | crypto / 2 | Hash do token inicial; algoritmo não explícito. |
| Salva Token jogador | googleSheets / 4.7 | Append em TOKENS_ACESSO; validade de 30 minutos; sem chave de emissão idempotente. |
| Monta Link Criar Senha Jogador | set / 3.4 | Monta link com domínio placeholder e token em query. |
| Envio de Link para Senha Jogador | gmail / 2.2 | Gmail com credencial gerenciada referenciada; entrega não testada e HTML sem escape do nome. |
| Responde Criar Senha Jogador Enviado | respondToWebhook / 1.5 | Responde HTTP 200 informando primeiro acesso; distingue estado cadastral. |
| Recebe Criar Senha Jogador | webhook / 2.1 | Webhook POST com allowedOrigins wildcard. |
| Normaliza Criar Senha Jogador | code / 2 | Code: valida formato de token e composição de senha; não confere registro ou finalidade. |
| If Criar Senha Jogador Válido? | if / 2.3 | Desvia pelo booleano requisicao_valida. |
| Hash Token Jogador Recebido | crypto / 2 | Hash do token recebido; algoritmo não explícito. |
| Busca Token Criar Senha Jogador | googleSheets / 4.7 | Consulta por token_hash e tipo JOGADOR; finalidade é validada depois. |
| Monta Erro Criar Senha Jogador Inválida | set / 3.4 | Monta erro de requisição; resposta compartilhada continua HTTP 200. |
| Token Criar Senha Jogador Existe? | if / 2.3 | Testa metadado row_number. |
| Valida Token Criar Senha Jogador | code / 2 | Code: expiração, uso, ID, finalidade e tipo; aceita redefinição sem revogar sessões. |
| Monta Erro Jogador Token Inexistente | set / 3.4 | Monta erro de token não encontrado; encaminha resposta HTTP 200. |
| Token Jogador Pode Ser Usado? | if / 2.3 | Desvia por token_valido; sem consumo atômico. |
| Cria Hash Senha Jogador | crypto / 2 | Hash simples, sem algoritmo de armazenamento seguro de senha. |
| Update Jogador Senha Hash | googleSheets / 4.7 | Update por participante_id; sem checagem posterior do número de alterações. |
| Marca Token Utilizado Jogador | googleSheets / 4.7 | Update de utilizado_em pelo hash; ocorre depois da alteração de senha. |
| Monta Sucesso Criar Senha Jogador | set / 3.4 | Duas atribuições para mensagem; destino /entrar não implementado. |
| Responde Criar Senha Jogador | respondToWebhook / 1.5 | Compartilhada entre erros/sucessos e ramos de login; HTTP 200. |
| Monta Erro Token Jogador Expirado ou Utilizado | set / 3.4 | Monta erro; encaminha resposta compartilhada HTTP 200. |

## Anexo B — Todas as conexões exportadas

Em IF, saída 0 representa verdadeiro e saída 1 falso. As conexões estão presentes estruturalmente; isso não valida as condições ou os dados de cada ramo.

| Origem | Saída | Destino(s) |
| --- | --- | --- |
| Token Associado Existe? | main[0] | Token Inicial Jogador Ainda Válido? |
| Token Associado Existe? | main[1] | Generate a random string Jogador |
| Monta Link Inicial Já Enviado | main[0] | Responde Criar Senha Jogador |
| Resenha Login | main[0] | Normaliza Login Resenha |
| Normaliza Login Resenha | main[0] | IF Login Resenha Válido? |
| IF Login Resenha Válido? | main[0] | Busca Login Resenha |
| IF Login Resenha Válido? | main[1] | Responde Login Jogador Incompleto |
| Busca Login Resenha | main[0] | IF Jogador Existe? |
| IF Jogador Existe? | main[0] | Jogador Tem Senha? |
| IF Jogador Existe? | main[1] | Responde Login Jogador Inexistente |
| Jogador Tem Senha? | main[0] | Hash Senha Login Resenha |
| Jogador Tem Senha? | main[1] | Busca Token Jogador |
| Hash Senha Login Resenha | main[0] | Senha Jogador Válida? |
| Busca Token Jogador | main[0] | Token Associado Existe? |
| Senha Jogador Válida? | main[0] | Gera Token Sessão Jogador |
| Senha Jogador Válida? | main[1] | Monta Login Jogador Negado |
| Gera Token Sessão Jogador | main[0] | Hash Token Sessão Jogador |
| Monta Login Jogador Negado | main[0] | Responde Login Jogador Negado |
| Salva Sessão Jogador | main[0] | Monta Login Jogador Autorizado |
| Hash Token Sessão Jogador | main[0] | Salva Sessão Jogador |
| Monta Login Jogador Autorizado | main[0] | Responde Login Jogador Autorizado |
| Token Inicial Jogador Ainda Válido? | main[0] | Monta Link Inicial Já Enviado |
| Token Inicial Jogador Ainda Válido? | main[1] | Generate a random string Jogador |
| Generate a random string Jogador | main[0] | Cria Token Hash Inicial Jogador |
| Cria Token Hash Inicial Jogador | main[0] | Salva Token jogador |
| Salva Token jogador | main[0] | Monta Link Criar Senha Jogador |
| Monta Link Criar Senha Jogador | main[0] | Envio de Link para Senha Jogador |
| Envio de Link para Senha Jogador | main[0] | Responde Criar Senha Jogador Enviado |
| Recebe Criar Senha Jogador | main[0] | Normaliza Criar Senha Jogador |
| Normaliza Criar Senha Jogador | main[0] | If Criar Senha Jogador Válido? |
| If Criar Senha Jogador Válido? | main[0] | Hash Token Jogador Recebido |
| If Criar Senha Jogador Válido? | main[1] | Monta Erro Criar Senha Jogador Inválida |
| Hash Token Jogador Recebido | main[0] | Busca Token Criar Senha Jogador |
| Busca Token Criar Senha Jogador | main[0] | Token Criar Senha Jogador Existe? |
| Monta Erro Criar Senha Jogador Inválida | main[0] | Responde Criar Senha Jogador |
| Token Criar Senha Jogador Existe? | main[0] | Valida Token Criar Senha Jogador |
| Token Criar Senha Jogador Existe? | main[1] | Monta Erro Jogador Token Inexistente |
| Valida Token Criar Senha Jogador | main[0] | Token Jogador Pode Ser Usado? |
| Monta Erro Jogador Token Inexistente | main[0] | Responde Criar Senha Jogador |
| Token Jogador Pode Ser Usado? | main[0] | Cria Hash Senha Jogador |
| Token Jogador Pode Ser Usado? | main[1] | Monta Erro Token Jogador Expirado ou Utilizado |
| Cria Hash Senha Jogador | main[0] | Update Jogador Senha Hash |
| Update Jogador Senha Hash | main[0] | Marca Token Utilizado Jogador |
| Marca Token Utilizado Jogador | main[0] | Monta Sucesso Criar Senha Jogador |
| Monta Sucesso Criar Senha Jogador | main[0] | Responde Criar Senha Jogador |
| Monta Erro Token Jogador Expirado ou Utilizado | main[0] | Responde Criar Senha Jogador |

Checagem de alcance estático: 43/43 nós alcançáveis a partir dos dois webhooks. Não há nós órfãos no export. Os terminais são nós de resposta; não há rota de erro técnico dedicada.
