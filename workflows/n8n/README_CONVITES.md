# Convites — emissão, lista e abertura do link

## Importar

Importar como novos workflows, sem alterar 10–13 que já funcionam:

| Arquivo | Webhook |
| --- | --- |
| 14_criar_convite_APP_MVP.json | POST `/webhook/rc5-app-v1/convites` |
| 15_listar_convite_APP_MVP.json | GET `/webhook/rc5-app-v1/convites` |
| 16_validar_convite_APP_MVP.json | POST `/webhook/rc5-app-v1/validar-convite` |

Origem/CORS e frontend já preenchidos como `https://resenhacampo5.netlify.app`. Planilha e gids também preenchidos conforme a leitura. Selecionar a credencial Google existente nos dois HTTP Request de cada workflow. Nenhum usa o código de ativação do OWNER. As requisições 14/15 usam a sessão Bearer do login. O 16 recebe somente o token do convite no body; não exige que o convidado já tenha uma conta.

Arquivos inativos: importação/configuração/publicação são feitas pelo responsável. Não há publicação automática ou chamadas aos webhooks nesta entrega. Para testar no Netlify será necessário publicar também a alteração do React.

## O que será gravado

A primeira emissão pelo 14 acrescenta, no final da aba CONVITES, **apelido_destino | tipo_convite | jogo_id** (M:O). Essas colunas são necessárias porque a estrutura atual não distingue ADMIN de mensalista nem guarda apelido/jogo do convite. Os 12 cabeçalhos existentes são preservados. Se o final da aba tiver outra estrutura, a operação é rejeitada. Nenhuma planilha/aba nova; nenhuma alteração em JOGADORES/PELADAS/financeiro.

O lote único inclui cabeçalhos adicionais quando necessários, linha do convite, hash do token em TOKENS_ACESSO, contador de emissão em LIMITES_AUTH e um marcador de idempotência em intervalo nomeado. Autor e pelada vêm da sessão; não são confiados ao navegador. A finalidade em TOKENS_ACESSO é CONVITE_ADMIN, CONVITE_MENSALISTA ou CONVITE_DIARISTA.

O tipo ADMIN continua com categoria de destino Mensalista; o convite não promove nem cria um administrador por si só. A inscrição/atribuição de papel terá validação própria na próxima etapa.

## Teste curto

1. Fazer login como o OWNER já cadastrado e clicar **Convidar jogador**.
2. Informar apelido e WhatsApp brasileiro com DDD, selecionar Mensalista e gerar. Esperar 201 CONVITE_CRIADO; conferir uma linha CONVITES com o convidador correto, categoria e vencimento.
3. Clicar **Enviar pelo WhatsApp**. O WhatsApp abre a mensagem para o número informado; o convidador decide enviá-la. Nenhum envio é automático. Link e mensagem contêm o token destinado ao convidado: compartilhar somente com ele.
4. Abrir o link recebido. O token está no fragmento `/#/convite?token=...`, não na query HTTP. A página limpa o fragmento e consulta o 16. Deve mostrar apelido, pelada, autor, categoria e validade.
5. Atualizar a lista no painel: autor e situação devem aparecer; link/token não aparecem na listagem e o token original não é salvo em texto puro.
6. Diarista exige uma data no dia habitual da pelada, com jogo ainda não encerrado. O prazo é o menor entre a validade configurada e o fim do jogo. `jogo_id=JOGO_<pelada_id>_<YYYY-MM-DD>`; não cria um jogo no scout nesta etapa.
7. Sessão expirada/revogada/inativa deve dar 401. Diarista sem papel administrativo não emite. Link expirado/utilizado/inválido é rejeitado. Confirmação de e-mail não é simulada.

A autorização do OWNER independe de participação/pagamento, conforme o acesso já testado. ADMIN ativo pode convidar os três tipos. Mensalista sem papel administrativo só pode emitir Mensalista/Diarista se estiver ativo e apto na competência atual em MENSALIDADES, com pagamento confirmado; PENDING não serve. O acesso de jogador e a delegação de ADMIN ainda não são liberados no frontend desta etapa.

## Limites e recuperação

- Esta entrega emite e valida convites. **Cadastro pelo convite, confirmação de e-mail, consumo de uso único na inscrição e cobrança ainda não foram implementados.** A tela do convidado informa isso, sem afirmar inscrição ou pagamento. A consulta do 16 não consome o convite.
- O token original só é entregue depois da gravação confirmada. Fica na memória da tela enquanto aberta e não em localStorage/sessionStorage. Recarregar ou perder a resposta impede recuperar esse link a partir do hash. Repetir a mesma Idempotency-Key não duplica a emissão; retorna o registro sem revelar outro token. Reemissão/cancelamento serão feitos em etapa específica; não inserir segredos no Sheets para recuperar links.
- Outra chave com convite aberto para mesmo número/tipo/jogo é rejeitada. Essa checagem de destino depende de leitura anterior e não é exclusão distribuída para chaves diferentes. O marcador por chave impede repetição da mesma emissão; homologar concorrência no servidor. Falha/timeout pede conferência, sem retry cego.
- Limite de 20 emissões por participante em 15 minutos usa LIMITES_AUTH. Não é proteção distribuída por IP; contadores concorrentes têm a limitação do Sheets. O endpoint público de validação verifica token aleatório de 256 bits, mas não tem rate limit por IP nesta entrega.
- Não fixar nem exportar execuções com tokens/dados pessoais. Retenção desligada nos JSONs, sem console.log; configurações globais/proxy ainda precisam respeitar os dados transitórios.
- Nenhum Asaas, e-mail ou envio WhatsApp real é executado por esta implementação local. Não publicar sem importar os novos workflows; os paths são propostos pelos JSONs, não endpoints ativos verificados.

## Validação local

`node --test tests/invites.test.mjs`: emissão, autoria, cabeçalhos, hashes, validade, idempotência, listagem, permissões, sessão inválida, diária/jogo e consulta de convite. Dados artificiais somente locais; não substitui teste integrado no n8n.
