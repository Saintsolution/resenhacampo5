> Primeiro fluxo conjunto: siga [README_PRIMEIRO_ACESSO.md](README_PRIMEIRO_ACESSO.md), com os arquivos 13, 10, 11 e 12. O 09 foi substituído neste fluxo pelo 13.

> Cadastro pelo aplicativo: use agora o pacote 09–12 e as instruções em [README_OWNER_APP.md](README_OWNER_APP.md). Os sete arquivos estruturais abaixo permanecem preservados.

# Resenha Campo 5 — autenticação estrutural para testes controlados

Atualizado em 23/10/2026. Referência: **n8n 2.17.5**, uma única pelada. Nada foi instalado, ativado, enviado por e-mail ou alterado no servidor, Sheets ou frontend.

## Estado desta entrega

Foram preparados sete workflows importáveis separados por operação. Estão **inativos e bloqueados**. A lógica é executável somente em ensaio fictício explicitamente configurado. Não existem caminhos para liberar autenticação pública apenas trocando um booleano: o único modo aceito é TESTE_FICTICIO, o ID da planilha operacional é rejeitado e as identidades devem ter marcadores de teste.

Isso não é uma entrega de login público homologado. São os novos fluxos estruturais solicitados, com as dependências pendentes expostas, para revisão e testes controlados. Não conectar o React nesta etapa nem dar esses endpoints aos jogadores.

## 1. Arquivos para importar

| Arquivo | Método e path proposto | Operação |
| --- | --- | --- |
| 01_primeiro_acesso_ESTRUTURAL.json | POST rc5-auth-ficticia-v1/primeiro-acesso | Emite token inicial de 30 minutos somente para identidade fictícia sem senha |
| 02_criar_senha_ESTRUTURAL.json | POST rc5-auth-ficticia-v1/criar-senha | Consome token CRIAR_SENHA e define senha fictícia |
| 03_login_ESTRUTURAL.json | POST rc5-auth-ficticia-v1/login | Compara hash de referência e cria sessão fictícia de 8 horas |
| 04_consultar_sessao_ESTRUTURAL.json | GET rc5-auth-ficticia-v1/sessao | Consulta hash/expiração, status do jogador e papel administrativo |
| 05_logout_ESTRUTURAL.json | POST rc5-auth-ficticia-v1/logout | Limpa token_sessao_hash e token_expira; idempotente |
| 06_recuperar_senha_ESTRUTURAL.json | POST rc5-auth-ficticia-v1/recuperar-senha | Emite token REDEFINIR_SENHA de 15 minutos e invalida anteriores dessa finalidade |
| 07_redefinir_senha_ESTRUTURAL.json | POST rc5-auth-ficticia-v1/redefinir-senha | Consome token, troca senha fictícia e revoga sessão/tokens daquele jogador |

Cada arquivo possui 15 nós, sem subworkflows ou dependência de outro arquivo para executar seu grafo. A dependência entre operações é a mesma cópia privada de teste no Sheets. Todos precisam de configuração idêntica. Não usam dados fixados ou credenciais exportadas do original.

- `contratos/auth-ficticia.openapi.json`: contrato HTTP revisável; paths novos não foram publicados. Não são URLs já ativas.
- `fontes/auth-ficticia-core.js.txt`: lógica de validação/planejamento incorporada nos Code nodes.
- `fontes/gerar_auth_ficticia.py`: gerador local determinístico; apenas escreve arquivos JSON locais.
- `originais/resenhacampo5_43_nos_original.json`: cópia byte a byte do original, preservando os 43 nós. **Contém os mesmos dados fixados potencialmente sensíveis. Não importar nem publicar essa cópia sem revisão/sanitização aprovada.**
- `resenhacampo5.json`: original mantido intocado.

Não importar simultaneamente o original e os novos arquivos como se fossem substitutos equivalentes em produção. Os paths novos isolam o ensaio, sem sobrescrever os webhooks originais.

## 2. Crypto nativo e diagnóstico anterior

A disponibilidade de Generate, Hash, Hmac e Sign no Crypto nativo foi confirmada pelo responsável na instalação 2.17.5. Os novos JSONs utilizam **Crypto v2 nativo**:

- Generate: hexadecimal de 64 caracteres, para tokens candidatos.
- Hash: SHA256, encoding hex explicitado, para tokens e, exclusivamente no ensaio fictício, compatibilidade de senha.
- Nenhum Code node contém `require('crypto')`, imports criptográficos, RNG artesanal ou bibliotecas externas.

O diagnóstico `00_diagnostico_criptografico_n8n_2.17.5.json` permanece preservado como teste de imports no Code. Seu resultado negativo não prova indisponibilidade do Crypto nativo. Ele não precisa ser importado para usar esta entrega.

As versões Code 2, IF 2.3, Crypto 2, Webhook 2.1 e Respond to Webhook 1.5 reaproveitam as do export original. HTTP Request 4.2 existe no código oficial da tag 2.17.5. A API Sheets via HTTP com credencial gerenciada é usada porque a escrita conjunta de senha, sessão e consumo de token precisa de um único batchUpdate; o node Sheets de update isolado não fornece esse agrupamento.

Importação, tratamento de erro de nodes e retorno de credencial OAuth2 no ambiente real ainda precisam de ensaio; nenhuma afirmação de execução no servidor é feita pelos testes locais.

## 3. Limitação de senha — separada da criptografia de tokens

SHA-256 simples não tem salt individual nem custo adequado à defesa de senhas. **Não é aprovado para autenticação pública.** A igualdade usada no teste não é apresentada como comparação de senha resistente a ataques de timing.

A fórmula de referência é a do original: texto exato de senha → Crypto Hash SHA256 → hex. A senha não é trimada ou normalizada; não há migração, rehash ou escrita sobre registros reais. Os arquivos aceitam somente fixtures. A compatibilidade é validada contra registros fictícios com o formato legado.

A solução definitiva para senha permanece pendente: algoritmo/biblioteca seguros e compatíveis, política de migração dos registros existentes, gestão de sessão para navegador, revisão de abuso e testes de homologação. Não inserir SHA-256 em produção alegando que Crypto está disponível. Não usar flags desta entrega como aprovação dessa limitação.

Hash SHA-256 de token aleatório e hash SHA-256 de senha são assuntos distintos: os tokens candidatos são gerados pelo Crypto nativo, mas isso não torna a senha segura.

## 4. Correções estruturais realizadas

- `cpf` é o campo canônico; `cpf_assoc` é aceito como alias legado de entrada. Se ambos vierem divergentes, HTTP 400. Nenhuma gravação de sessão depende do campo inexistente cpf_assoc.
- Validação de dígitos do CPF reaproveita a regra existente. Login exige senha presente.
- Seleção de um único participante na pelada configurada; ambiguidade/duplicação resulta em 503, sem alteração de identidade.
- Só `situacao=ativo` permite login, sessão ou troca de senha. Papel administrativo é lido do registro, nunca do body.
- Primeiro acesso verifica data parseável, expiração estritamente futura e utilizado_em vazio. Token ainda válido não é reemitido; expirados podem ser substituídos. Não confundir os 30 minutos de primeiro acesso com 72h de futuros convites.
- Criação e redefinição exigem finalidades distintas; token de uma não serve na outra. Criação não sobrescreve senha existente.
- O lote final altera senha, revoga sessão e consome tokens juntos. Nenhuma resposta de sucesso antecede a confirmação do lote.
- Login sobrescreve o token de sessão anterior; consulta verifica expiração/status. Logout limpa ambos os campos. Há uma sessão ativa por participante neste modelo, não sessões independentes por dispositivo.
- Recuperação retorna mensagem genérica igual para cadastro encontrado/não encontrado. Não envia automaticamente instruções pelo endpoint de login.
- Respostas possuem sucesso/codigo/mensagem/modo; erro de grafia e atribuição duplicada do original não foram carregados.
- Erros HTTP 400/401/403/429/503 padronizados, sem refletir stack, corpo Google, CPF ou senha. Um resultado de gravação incerto pede interrupção e conferência, sem retry automático.
- Contadores persistentes de ensaio limitam 30 solicitações/15min por ação e 5 tentativas de login/15min por participante. Não são proteção pública por IP. Sem coordenação entre escritores esses contadores não têm garantia de exclusão.

## 5. O que não está implementado ou aprovado

**Envio de e-mail está deliberadamente desativado.** Os fluxos de primeiro acesso/recuperação montam um plano interno de mensagem, mas retornam `email_enviado:false`. Não existe Gmail/HTTP de entrega, nem credencial de e-mail, nem token retornado nessas respostas. E-mails de fixture usam `.invalid`. O transporte deve ser aprovado na próxima revisão; não dizer ao usuário real que uma mensagem foi enviada.

As rotas de ensaio usam Header Auth gerenciado para restringir quem testa. Essa chave é do testador/integração, **não pode ir para o bundle React**. Não são endpoints públicos para usar diretamente no site.

Sessão de ensaio usa Bearer no header Authorization, preservando o modelo de token opaco. Somente login fictício bem-sucedido retorna `token_sessao` em JSON, para o cliente de teste autorizado. Consulta/logout/erros não retornam esse valor. Não usar query string, URL, logs ou localStorage. Cookie HttpOnly/CSRF e topologia de domínio para o site continuam pendentes; não foram fingidos como prontos.

Controles de IP, envio de e-mail, senha segura e exclusão entre execuções continuam bloqueadores de homologação real. Não avançar para convites/cadastro/financeiro nesta entrega.

## 6. Configuração: nada é aplicado automaticamente

Em cada arquivo, o Code node **Configuração e validação** contém placeholders e bloqueios. Sem substituição aprovada, responde 503 antes de Crypto ou Sheets. Header Auth sem credencial pode responder 401 antes mesmo desse nó.

| Configuração | Como preencher no futuro ensaio autorizado |
| --- | --- |
| modo | Apenas TESTE_FICTICIO é aceito; valor entregue BLOQUEADO |
| revisao_limite_sha256_ficticio | true somente após registrar revisão da limitação para dados fictícios; não autoriza produção |
| controle_escritor_unico_revisado | true somente após validar serialização de TODOS os escritores do ensaio |
| privacidade_e_logs_revisados | true após verificar isolamento de dados e logs |
| origem_e_credencial_hml_revisadas | true após conferir origem e credencial Header Auth |
| spreadsheet_id | CONFIGURAR_ID_PLANILHA_COPIA_FICTICIA; nunca o ID operacional |
| gid_jogadores/gid_tokens/gid_limites | IDs numéricos distintos das abas da cópia; não são Spreadsheet IDs |
| pelada_id | ID fictício começando com TESTE_ |
| origem | Origem HTTPS aprovada para ensaio; preencher também allowedOrigins no Webhook |

Credenciais gerenciadas a selecionar no editor:

1. `CONFIGURAR_CREDENCIAL_GOOGLE_HML`: Google Sheets OAuth2, com acesso à cópia fictícia; usada por HTTP Request como Predefined Credential Type `googleSheetsOAuth2Api`.
2. `CONFIGURAR_CREDENCIAL_WEBHOOK_HML`: Header Auth, com nome do header `X-RC5-HML-Key` e segredo definido somente na credencial n8n.

Os IDs são placeholders, não IDs reais fabricados. Sem credenciais preenchidas, nenhuma chamada autenticada ao Google é possível. Não enviar chaves no chat/JSON. Nenhuma nova credencial foi criada por esta entrega.

## 7. Estrutura necessária SOMENTE na cópia de teste

Nenhuma alteração foi feita ou autorizada em produção. Para um ensaio futuro, preparar após aprovação uma cópia **sem linhas reais**, privada e com três abas:

- JOGADORES: os 18 cabeçalhos reais inventariados na auditoria, incluindo participante_id, pelada_id, cpf, senha_hash, token_sessao_hash e token_expira. Sem renomeá-los.
- TOKENS_ACESSO: token_hash | tipo_usuario | id_usuario | finalidade | expira_em | utilizado_em.
- LIMITES_AUTH (nova aba proposta): chave | acao | janela_inicio | contador | bloqueado_ate.

Nenhuma coluna nova é exigida nas duas abas existentes. A sessão continua nos campos existentes de JOGADORES. `utilizado_em` também marca tokens substituídos/invalidados; não é um histórico detalhado de motivos de revogação.

Todas as identidades na cópia precisam ter participante_id/pelada_id iniciados por TESTE_ e email terminando em `.invalid`. Tokens devem apontar para IDs TESTE_. Os arquivos rejeitam o ID da planilha operacional e linhas sem esses marcadores. Esses controles reduzem enganos, mas não comprovam que um CPF digitado seja fictício: é responsabilidade do ensaio nunca copiar dados reais. Utilizar apenas fixtures artificiais.

O leitor valida cabeçalhos e processa até 5000 linhas por aba; exceder resulta em 503. Não é um backend de escala nem uma proposta multipeladas.

## 8. Consumo único, sessões e concorrência no Sheets

As gravações são agrupadas em `spreadsheets.batchUpdate` com updateCells/appendCells. O Google documenta validação e aplicação atômica do pedido. O lote evita a janela de duas gravações separadas entre alterar senha e marcar token, **mas não é compare-and-swap** e não impede duas execuções de lerem o mesmo token antes dos respectivos lotes.

Por isso, não declarar consumo único garantido sem um único escritor comprovado. A flag é registro de revisão, não mecanismo de lock. Se dois workflows/instâncias, edições manuais ou subworkflows puderem gravar simultaneamente, a dependência continua sem solução e os testes de escrita não devem ser liberados.

Proposta para discutir antes da homologação: uma entrada escritora única serializada, abrangendo todas as ações e alterações manuais; análise da topologia regular/queue e coordenação de falhas. Não alterar o limite global do servidor ou adicionar Redis/banco nesta entrega. Uma flag, mutex em memória, lock em célula ou o uso de batchUpdate não resolvem isso por si sós.

Os testes locais demonstram consumo/revogação **serializados** e explicitam que o mesmo snapshot pode aceitar duas solicitações concorrentes. Não há alegação de teste de concorrência no servidor. A autenticação pública permanece bloqueada mesmo que esse problema seja resolvido, por causa da senha.

Referências:
- [Atomicidade do batchUpdate](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/batchUpdate).
- [Concorrência n8n](https://docs.n8n.io/hosting/scaling/concurrency-control/): limites de produção não cobrem automaticamente execuções manuais/subworkflows.
- [HTTP Request na tag 2.17.5](https://github.com/n8n-io/n8n/blob/n8n%402.17.5/packages/nodes-base/nodes/HttpRequest/HttpRequest.node.ts).

## 9. Importação e roteiro de teste controlado

1. Revise os arquivos e a OpenAPI; importe como novos rascunhos, nunca por cima do original. Não publicar/ativar nesta etapa. Não configure a planilha operacional.
2. O teste local `node --test tests/n8n-auth-structural.test.mjs` é executável agora, sem qualquer serviço remoto. Valida grafos, expressões, bloqueios e regras com snapshots fictícios.
3. Antes de um ensaio n8n com gravação, aprovar isolamento, cópia vazia de dados reais, credenciais restritas, mecanismo de escritor único, logs e modo fictício. Até isso ocorrer, manter flags false e modo BLOQUEADO.
4. Depois dessa aprovação, teste primeiro o 503 de bloqueio com uma credencial de ensaio válida. Não substituir placeholders por dados reais para fazê-lo passar.
5. Verifique os quatro nós Crypto com valores artificiais: hash de senha de fixture, hash de token recebido, Generate hex 64 e hash do candidato. A inexistência de require não dispensa validar o resultado do native node no runtime real.
6. Em cópia fictícia e execução coordenada: tente cpf e cpf_assoc, divergência, senha incorreta, conta inativa e duplicação de jogador; exigir 400/401/503 apropriados.
7. Criação: prepare token fictício conhecido, com hash calculado pelo Crypto nativo, finalidade CRIAR_SENHA, data futura e utilizado_em vazio. Exigir troca de senha/consumo no mesmo lote; segunda utilização deve retornar 400. Não colar token no relatório.
8. Login: a senha exata deve gerar sessão de 8h; senha errada não. Inspecione somente a resposta mínima, sem CPF/hash. Guarde Bearer somente em memória do cliente de teste.
9. Sessão/logout: token válido funciona; logout revoga; consulta posterior retorna 401; logout repetido/sem Bearer continua idempotente para quem tem a chave do ensaio.
10. Recuperação: solicitação genérica sempre 202. Transporte não envia e-mail; resposta deixa isso explícito. Para redefinir, use token fictício conhecido preparado na cópia; a finalidade deve ser REDEFINIR_SENHA. Senha alterada deve revogar sessão e todos os tokens ainda abertos desse jogador.
11. Token expirado/utilizado/finalidade trocada: sempre rejeitar. Primeiro acesso com token válido não reemite; com expirado pode emitir substituto.
12. Após cinco logins por participante em 15min, verificar 429; após janela, verificar desbloqueio. São limites de ensaio, não política pública final.
13. Simular erro Google e retorno de lote incerto apenas em testes isolados; exigir 503 sem dados internos. Não repetir batchUpdate às cegas: append pode ter sido aplicado antes de timeout. Interromper e reconciliar a cópia, incluindo tokens/contadores.
14. Um teste de escrita concorrente só pode ser aprovado após definir o mecanismo de serialização; não confundir testes manuais sequenciais com essa prova.

## 10. Logs, dados e rollback

Settings dos novos workflows desabilitam gravação de execuções de sucesso/erro, manuais e progresso. Não há pinData nem console.log. Ainda assim, dados transitórios existem no editor durante o ensaio; políticas globais e logs do proxy exigem revisão. Não retornar $json bruto em respostas.

Nenhum arquivo foi enviado ao GitHub e nenhum workflow foi publicado. O original e sua cópia contêm dados fixados potencialmente sensíveis: nunca incluí-los em push sem sanitização aprovada. A auditoria e o frontend foram preservados.

Rollback local: não importar os novos arquivos ou remover somente os novos rascunhos. Se um ensaio futuro alterar uma cópia, descarte/restaure somente essa cópia autorizada. Não restaurar automaticamente senhas antigas nem reativar sessões/tokens já revogados. Nenhum rollback em produção é necessário por esta entrega.

## 11. Dependências para autenticação real

1. Resolver e aprovar algoritmo seguro de senha e migração dos hashes atuais.
2. Definir armazenamento privado de autenticação e compartilhamento, sem mudar planilhas sem autorização.
3. Comprovar escritor único/consumo único e tratamento de resultado indeterminado.
4. Definir sessão de navegador, cookies HttpOnly/Secure, CSRF e domínio/origem; o Bearer fictício não é autorização para localStorage.
5. Aprovar transporte de e-mail, verificação de destinatário e testes de entrega.
6. Implementar rate limit resistente à concorrência e proteção de entrada no proxy/infraestrutura existente, sem alterações não autorizadas.
7. Homologar credenciais, nodes e isolamento no n8n 2.17.5.

Somente depois dessa revisão pode existir um novo pacote candidato a autenticação pública. Cadastro, convites, administração e cobranças não foram incluídos aqui.
