# JogoLindo — cadastro separado do OWNER

**Arquivo único para importar: `RESENHA_CAMPO_5.json`, nesta pasta. 217 nós.**

Fonte exclusiva: export `workflows/resenha n8n restaurado/JogoLindo — Cadastro, Login, Peladas e Convites.json`. O original está intacto; seu hash está em `FONTE.sha256`. Não usar os pacotes antigos de Etapa A para esta atualização.

## Atualização manual do n8n

1. Exporte um backup do workflow atual. No mesmo workflow, esvazie somente o canvas e importe `RESENHA_CAMPO_5.json` uma única vez. Não importar sobre nós existentes.
2. Confira os 217 nós. As credenciais Sheets continuam `Google Sheets account 5`; os webhooks protegidos de ensaio/retorno Asaas mantêm `jogolindo webhook`.
3. O cadastro mudou para `POST /webhook/rc5-app-v1/cadastrar-organizador`: usa o token exclusivo do convite OWNER, não a chave compartilhada. Não manter um workflow antigo publicado nessa mesma rota.
4. Publique. Não é necessário apagar abas, cabeçalhos ou registros existentes da planilha.

## Primeiro convite de OWNER — apenas pelo operador do n8n

1. Abra **Configura Destinatário Convite OWNER**. Preencha `apelido` e `whatsapp` do Ricardo, com DDD. A validade inicial é de 24 horas.
2. Execute somente o ramo iniciado em **Gerar Convite OWNER Manual**. Esse ramo grava o hash do convite em TOKENS_ACESSO; não cria conta, pelada nem cobrança.
3. A saída de **Entrega Link Convite OWNER** contém `whatsapp_url`. Abra esse endereço para enviar a mensagem pelo WhatsApp. Nenhuma mensagem é enviada automaticamente.
4. Ricardo abre o link e cadastra nome, apelido, CPF, o WhatsApp convidado, e-mail e senha. O servidor valida o token, destinatário e validade; salva somente o OWNER e consome o convite no mesmo lote.
5. Após a confirmação, ele faz login, vê **Criar minha pelada**, configura e salva a primeira pelada. A conta não é criada novamente.
6. OWNER gera convite de jogador com apelido, WhatsApp e tipo. OWNER pode convidar ADMIN; ADMIN e mensalista apto podem convidar jogadores. Diarista não emite convites.
7. O convidado conclui seu cadastro pelo link. O fluxo de inscrição e primeira cobrança Asaas foi preservado integralmente. Essa etapa emite boleto real; abrir o boleto não confirma pagamento.

Sem Gmail. Não foram emitidos convites, mensagens, boletos ou assinaturas durante a preparação local.

## Repetição de testes

Não limpar planilhas no meio do teste. Os marcadores de uso único ficam nos intervalos nomeados e não desaparecem ao apagar linhas. O novo cadastro utiliza um marcador CPF com namespace `jl_owner_cpf_v2_`, preservando marcadores antigos. Uma conta existente deve fazer login; se alguém apagar seus registros após a homologação, a limpeza dos respectivos marcadores exige conferência específica.

## Segurança e compatibilidade

Convite OWNER: token aleatório de 64 caracteres gerado pelo Crypto nativo; só o hash fica no Sheets. Expira e só pode ser usado uma vez. Repetição da mesma operação confirmada não duplica a conta. Claims são gravados atomicamente com a conta e o consumo do convite. A conta nasce sem pelada; sua primeira pelada é vinculada na criação autenticada.

Somente os ramos de cadastro/criação de pelada e a restrição de convite ADMIN foram ajustados. Todos os nós e conexões de inscrição/boleto e retorno Asaas foram comparados com o export oficial e preservados. Nenhuma nova coluna ou aba.

O JSON contém configurações privadas herdadas. Não enviar ao GitHub nem ao Netlify. O site é publicado pelo Git; a atualização do n8n é manual.

## Lista de jogadores no painel (atualização pontual)

Para quem já publicou esta versão, não reimportar o workflow inteiro. Substituir somente o código de **Valida e Prepara Dados Sessão** pelo conteúdo de `ATUALIZAR_SOMENTE_SESSAO.code.txt`, salvar e publicar. A lista é exclusiva de OWNER/ADMIN na pelada autorizada. No app, clicar em Atualizar jogadores. Detalhes em `docs/DASHBOARD_POR_PELADA.md`.
