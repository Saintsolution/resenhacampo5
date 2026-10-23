# Cadastro pelo aplicativo → login → painel

Pacote MVP compatível com o mecanismo legado solicitado: Crypto nativo Hash SHA256 para senha; Generate hex 64 e SHA256 para tokens. **Senha SHA256 simples não é hash adequado para publicação aberta** (sem salt/custo). Esta entrega não a transforma em autenticação pública homologada. Não instala pacotes, muda servidor, publica ou cobra.

## Importar e configurar

Importar como novos workflows, sem substituir o original ou os sete estruturais:

- `09_cadastrar_owner_APP_MVP.json`: POST `rc5-app-v1/cadastrar-organizador`.
- `10_login_APP_MVP.json`: POST `rc5-app-v1/login`.
- `11_sessao_APP_MVP.json`: GET `rc5-app-v1/sessao`.
- `12_logout_APP_MVP.json`: POST `rc5-app-v1/logout`.

Nos quatro workflows:
1. Selecionar a credencial Google Sheets existente nos dois HTTP Request.
2. No nó **Configuração e validação**, preencher `origem` com a URL exata do Netlify, sem barra final, e `gid_limites` com o número `gid` da aba LIMITES_AUTH. Os IDs JOGADORES=800101 e TOKENS_ACESSO=2023862256 vêm da auditoria: conferir se continuam iguais. ID da planilha existente já preenchido.
3. Preencher também `allowedOrigins` do Webhook com essa origem. O navegador usa JSON, Authorization e X-RC5-Ativacao: conferir que OPTIONS/preflight permite os headers; não desativar autenticação para corrigir CORS.
4. O identificador proposto para a única pelada é `RESENHA_CAMPO_5`. Se já usam outro identificador, substituir `pelada_id` nos quatro, antes do teste.

Somente no cadastro, selecionar uma credencial **Header Auth** com nome do header `X-RC5-Ativacao` e valor secreto escolhido pelo responsável. Esse segredo fica na credencial n8n e é digitado pelo usuário no formulário; nunca em VITE_*, código, export ou Git. Login/sessão/logout não usam essa credencial.

As três abas já existentes devem ter seus cabeçalhos preservados:
- JOGADORES: 18 colunas inventariadas, incluindo senha_hash/token_sessao_hash/token_expira.
- TOKENS_ACESSO: token_hash | tipo_usuario | id_usuario | finalidade | expira_em | utilizado_em.
- LIMITES_AUTH: chave | acao | janela_inicio | contador | bloqueado_ate.

No Netlify, configurar a variável pública:
`VITE_N8N_APP_BASE_URL=https://n8n.saintsolution.com.br/webhook/rc5-app-v1`

Esse é um path novo proposto pelos arquivos, não afirmação de URL ativa. Os workflows precisam ser publicados pelo responsável para esse endereço responder. Para teste com Listen for Test Event, usar base `/webhook-test/rc5-app-v1`; é necessário armar cada workflow na sequência, e o login chama sessão imediatamente. Preferir publicar os quatro somente no ambiente de desenvolvimento autorizado. Deploy do frontend é feito pelo responsável, não automaticamente nesta entrega.

## Teste curto

1. Abrir o site atualizado e clicar **Cadastrar organizador**. Preencher nome completo, CPF, e-mail, telefone, senha, confirmação e código. Nenhum dado pessoal é predefinido.
2. Receber HTTP 201 `OWNER_CADASTRADO`; conferir uma linha JOGADORES com OWNER, ativo, categoria vazia, senha_hash preenchido e senha original ausente. OWNER não depende de pagamento.
3. Entrar com CPF/senha. O frontend exige login 200 e sessão 200 com OWNER antes de abrir o painel. Esse painel mostra o nome retornado do backend; módulos operacionais continuam próximos passos, sem misturar dados fictícios.
4. Tentar novo cadastro com código correto: HTTP 409, sem segundo OWNER. Código errado: 401 antes de qualquer Google/Crypto. Senha errada: 401.
5. Sair: revoga sessão no Sheets. Reutilizar token revogado: 401. Sessão dura 8h e fica somente em memória do navegador; reload exige novo login.

## Unicidade e limpeza do ensaio

Além da leitura de OWNER, o lote de cadastro adiciona um intervalo nomeado com ID fixo `rc5_owner_bootstrap_v1`/nome `RC5_OWNER_CADASTRADO` no mesmo batchUpdate que insere a linha. Não cria aba ou coluna. O Google documenta erro para ID de intervalo já existente e aplicação atômica do lote; a proposta usa essa restrição para impedir duas inserções pelo mesmo bootstrap. Validar também duas tentativas simultâneas no n8n antes de afirmar garantia de concorrência no servidor. Escritores antigos/manuais não usam esse mecanismo: não os executar durante o cadastro.

Após o primeiro cadastro, desativar o workflow 09. Para refazer o teste depois, o responsável deve limpar somente registros de teste, sessões e limites correspondentes e remover **também o intervalo nomeado** RC5_OWNER_CADASTRADO em Dados → Intervalos nomeados, depois reativar 09. Não basta apagar a linha. Não mudar o ID do marcador para contornar um cadastro existente.

Se a gravação falhar ou houver timeout, não repetir às cegas: conferir linha e marcador; a resposta pode ter se perdido após gravação. O fluxo retorna 503 sanitizado. Não há retry automático da escrita.

## Limites conhecidos

SHA256 de senha continua legado e inadequado para acesso público. Limites reutilizados (5 logins/participante e 30 por ação em 15min) são contadores no Sheets, não proteção distribuída por IP; concorrência pode afetá-los. Logins concorrentes podem sobrescrever sessão (uma por pessoa); esta entrega não resolve consumo único de recuperação de senha e não publica os outros módulos. Bearer só em memória, sem cookie HttpOnly nesta versão. Não registrar dados fixados e não exportar execuções com senha/código/token. Settings desabilitam retenção, mas dados transitórios e logs globais/proxy precisam ser respeitados.

Validação local: TypeScript/lint/build e `node --test tests/n8n-owner-app.test.mjs` (grafo, cadastro, duplicação, login, sessão, logout, CPF e confirmação). Testes usam somente dados artificiais locais e não chamam servidor/Google. Execução real do n8n e integração navegador→n8n ainda dependem da configuração acima.

Referências: [AddNamedRangeRequest](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/request#addnamedrangerequest), [atomicidade do batchUpdate](https://developers.google.com/workspace/sheets/api/guides/batch).
