# Primeiro acesso — JOGADORES + PELADAS

## Importar/configurar

Importar o **13_criar_conta_pelada_APP_MVP.json atualizado** e atualizar **10_login_APP_MVP.json, 11_sessao_APP_MVP.json e 12_logout_APP_MVP.json**. Não deixar versões antigas ativas com os mesmos paths. O 09 antigo/manual não participa desta jornada. O original de 43 nós e os sete estruturais permanecem preservados.

Nos quatro workflows:
1. Selecionar a credencial Google Sheets existente nos nós HTTP de leitura e gravação. No 13, também em **Ler marcador do cadastro**.
2. Em **Configuração e validação**, preencher `origem` com a origem exata do navegador (sem barra final), e repetir em `allowedOrigins` do Webhook. HTTPS no Netlify; desenvolvimento local admite somente http://localhost:PORTA ou http://127.0.0.1:PORTA. Não usar wildcard.
3. IDs já preenchidos: planilha oficial; JOGADORES=800101, PELADAS=717198779, TOKENS_ACESSO=2023862256 e LIMITES_AUTH=1685501295. Não configurar um pelada_id fixo: o cadastro gera ambos os IDs e login/sessão seguem os vínculos gravados.
4. No Webhook do 13, selecionar Header Auth com header `X-RC5-Ativacao` e valor secreto do responsável. O código será digitado no formulário. Nunca colocar esse valor em VITE_*, JSON, Git ou chat. Usar a credencial existente; nenhuma credencial remota foi alterada.

O responsável importa/configura/publica os quatro workflows no ambiente de desenvolvimento autorizado; nada foi publicado automaticamente nesta entrega. Para teste integrado, os endpoints precisam estar acessíveis simultaneamente (login chama sessão imediatamente). Se optar por Test URLs, armar os listeners e usar /webhook-test/ no lugar de /webhook/.

No frontend, `.env.local` (desenvolvimento) ou variáveis de build do Netlify:
```
VITE_N8N_BOOTSTRAP_URL=https://n8n.saintsolution.com.br/webhook/rc5-app-v1/criar-conta-pelada
VITE_N8N_APP_BASE_URL=https://n8n.saintsolution.com.br/webhook/rc5-app-v1
```
Reiniciar Vite após configurar, ou refazer build do Netlify pelo responsável. Não apontar para uma versão antiga do workflow 13 que ainda grava CONFIG. Conferir preflight OPTIONS e headers Content-Type, Authorization, X-RC5-Ativacao e Idempotency-Key. Não remover autenticação para corrigir CORS.

## Teste real pelo navegador — executar juntos após importação

1. Abrir a página inicial → **Criar minha pelada**. Preencher os dados da identidade Ricardo com contato temporário autorizado; definir senha/confirmar e escolher participação (Somente organização, Mensalista ou Diarista). O papel OWNER é decidido no backend, separado da categoria.
2. Avançar, revisar os dados da pelada, preencher código de ativação e clicar **Criar conta e pelada**. Nenhum registro é gravado ao passar da primeira para a segunda tela.
3. Esperar HTTP 201 `PELADA_CRIADA` e redirecionamento para login. Conferir:
   - uma linha em JOGADORES, participante_id gerado, papel OWNER, situação ativo, categoria escolhida, senha_hash preenchido e senha original ausente;
   - uma linha em PELADAS, pelada_id gerado, owner_id igual ao participante_id do OWNER;
   - JOGADORES.pelada_id igual a PELADAS.pelada_id;
   - local com cidade incorporada e valores iguais aos revisados no formulário;
   - CONFIG sem alteração.
4. Entrar com CPF **e senha**. Login: 200 com token; sessão: 200 com os dados de PELADAS, sem CPF/hash. Painel deve mostrar nome/local salvos, próxima data/horário, valores e total de jogadores ativos (apenas Mensalista/Diarista). OWNER sem categoria não conta como jogador nem precisa pagar para administrar.
5. Sair: sessão revogada. Senha incorreta: 401. Novo cadastro inicial: 409. Código incorreto: 401 antes das leituras. Não enviar chaves, senhas, CPF ou tokens ao relatar os resultados.

A data usa America/Sao_Paulo. No dia da partida, mantém o jogo até o horário final, depois passa para a semana seguinte. A sessão dura 8h e fica somente em memória; reload exige novo login.

## Persistência e repetição

PELADAS usa exatamente:
`pelada_id | nome | local | dia_semana | hora_inicio | hora_fim | mensalidade | diaria_sem_colete | diaria_com_colete | colete_avulso | vencimento_dia | convite_horas | owner_id | situacao`

`dia_semana` é numérico (0=Domingo, 6=Sábado), horários HH:mm, situação ativo. O frontend mantém os mesmos campos/layout; o backend mapeia horario_inicio→hora_inicio, horario_fim→hora_fim, vencimento_mensal→vencimento_dia e validade_convite_horas→convite_horas. Cidade é incorporada em local. Nenhuma coluna, aba ou planilha nova; nenhuma leitura/escrita em CONFIG.

O 13 planeja JOGADORES, PELADAS e os limites do ensaio e envia **um único spreadsheets.batchUpdate**. Falha de validação de qualquer subpedido invalida o lote completo. Não há uma gravação de OWNER antes da pelada. Sem retries automáticos da escrita.

O lote inclui um intervalo nomeado com ID fixo `rc5_owner_bootstrap_v1`; a API rejeita ID existente. O nome do intervalo guarda a chave Idempotency-Key (não é segredo). Não acrescenta colunas nem guarda dados de pelada em CONFIG. Repetição da mesma chave com os mesmos dados/senha retorna 200 `PELADA_CRIADA` e os mesmos IDs, sem escrita extra; outra chave ou dados divergentes retornam 409. Conferir concorrência real no servidor antes de declarar esse cenário homologado. Escritores manuais/antigos devem ficar parados durante o bootstrap.

Em timeout, a confirmação pode se perder após o lote ser aplicado. Não repetir com outra chave: conferir as duas linhas e o marcador. Se OWNER/pelada já existirem sem vínculo consistente (por dados antigos/edições), o fluxo para com 503 e não tenta promover, recriar ou corrigir automaticamente.

Para zerar o ensaio autorizado, desativar o 13, remover apenas registros de teste de JOGADORES/PELADAS e seus tokens/limites e retirar o intervalo nomeado `RC5_OWNER_...`; preservar cabeçalhos/fórmulas/CONFIG. Só reabrir o cadastro depois da conferência. Nada é apagado automaticamente.

## Estado da validação

Testes locais exercitam lote conjunto, IDs e vínculos, categoria independente, CPF/valores, repetição/duplicação, login por ID gerado, sessão lendo PELADAS e cálculo de data. TypeScript/lint/build verificam o código local. **Isso não substitui a execução real no n8n e no navegador.** O teste integrado exige os workflows atualizados importados/configurados, URLs acessíveis e dados/código digitados pelo responsável. Não foi afirmado sucesso remoto sem esse teste.

Mantido por solicitação o Crypto nativo SHA256 legado para senha, sem texto puro. SHA256 simples segue sem salt/custo adequados e não representa autenticação pública robusta homologada. Tokens são aleatórios pelo Crypto e só seus hashes vão ao Sheets. Retenção de execuções desabilitada nos JSONs; ainda há dados transitórios no editor e políticas globais/proxy. Não fixar/exportar execuções contendo dados pessoais ou segredos. Limites reutilizados no Sheets não têm proteção distribuída por IP comprovada.

Não há convites, cobranças, e-mails, deploy ou alterações no servidor nesta entrega.

Referências: [lotes atômicos](https://developers.google.com/workspace/sheets/api/guides/batch), [ID de intervalo duplicado é rejeitado](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/request#addnamedrangerequest).
