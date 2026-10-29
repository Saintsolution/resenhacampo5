# Resenha Campo5 — desenvolvimento e homologação

> Registro histórico. Estado consolidado e correções posteriores: [HANDOFF](HANDOFF.md). Esta cópia foi anonimizada para documentação; não contém os dados individuais do ensaio.
Encerramento de 27/10/2026, horário de Brasília. Retomada prevista: 28/10/2026, após o retorno do participante de homologação. Registro de estado e decisões; não executa publicação, limpeza ou operação financeira.

## Projeto e limites

Este repositório é o MVP **Resenha Campo5**, para homologar a operação da pelada no Campo 5 do Aterro do Flamengo. Stack atual: React + n8n + Google Sheets + Asaas. **Sem Supabase nesta fase.** A proposta anterior com Supabase e eventual réplica em outro domínio pertencem a outro contexto; nomes históricos dos exports não mudam a identidade deste MVP.

As únicas fontes oficiais de workflow são os exports trazidos do n8n pelo usuário. Não reconstruir a implantação a partir dos antigos pacotes Etapa A, testes estruturais ou workflows isolados. Não acessar nem modificar o n8n por iniciativa própria: a atualização em produção está sendo feita manualmente pelo usuário. Não limpar planilhas, gerar cobranças, enviar mensagens ou alterar Asaas para retomar esta sessão.

## Onde paramos no teste real

- O usuário assumiu o papel de OWNER para testar, usando convite exclusivo vinculado ao próprio WhatsApp. Ele gerou o link no n8n e concluiu o cadastro separado da conta e a criação da primeira pelada.
- Na última conferência da planilha havia uma pelada, ResenhaCampo5, um cadastro de OWNER e nenhum mensalista/diarista cadastrado. OWNER sem categoria de jogador não entra na quantidade de jogadores. Essa é a última leitura confirmada, não uma garantia do estado na próxima sessão.
- Foi identificado um convite aberto para **participante de homologação**, do tipo **ADMIN**, categoria de jogador **Mensalista**. O usuário está aguardando participante de homologação concluir o cadastro pelo link. Não presumir que ele já se cadastrou, pagou ou recebeu boleto.
- O usuário informou que substituiu o código do nó **Valida e Prepara Dados Sessão** para habilitar a lista administrativa. A publicação final desse ajuste e o resultado com um jogador real ainda precisam ser confirmados; não tratar uma lista vazia como falha quando ninguém concluiu o cadastro.
- Depois da homologação, o usuário pretende limpar os dados de teste e iniciar a operação definitiva com novo responsável como OWNER. Isso está planejado, **não foi executado**. O papel de ADMIN mensalista no teste não concede automaticamente papel de OWNER.

## Implementado e publicado no frontend

Site: https://resenhacampo5.netlify.app/ . Repositório: Saintsolution/resenhacampo5, branch main, deploy automático GitHub → Netlify. Último commit publicado e conferido no site: **3f76bb3**.

- Login único por CPF e senha, reconhecendo OWNER, ADMIN, mensalista e diarista.
- Cadastro separado de OWNER pelo convite exclusivo: salva a conta primeiro, sem gerar cobrança nem criar pelada. Após login, o OWNER pode criar sua primeira pelada e outras posteriormente.
- Seleção de pelada pelo OWNER, com autorização no backend. ADMIN/jogador usam o vínculo existente à pelada.
- Olhinho para mostrar/ocultar senha no login e nos cadastros de OWNER e jogador.
- Painel OWNER/ADMIN com lista e quantidade de jogadores, botão **Atualizar jogadores** e nome clicável que expande os dados de cadastro. Jogador comum não recebe a lista pessoal dos demais.
- Meu cadastro: consulta e edição dos dados permitidos do próprio titular. Nome e CPF não editáveis. Quando há vínculo Asaas, telefone/e-mail estão somente para consulta nesta versão; apelido continua editável.

O menu público atual tem entrada/login e a seção de próximas peladas. **A consulta pública de peladas e seus inscritos ainda não está conectada.** Também não foi criado ainda o acesso público “Primeiro acesso” para digitar um código: o cadastro funciona pelo link do convite. Não confundir essas propostas com funções concluídas.

## Convites e inscrição

- Para jogador, informar apenas apelido, WhatsApp e tipo do convite. O convite define pelada e papel/categoria; o convidado não escolhe suas permissões no cadastro.
- Token aleatório, associado ao WhatsApp convidado, com validade e uso único. O hash é armazenado; o telefone não é usado para gerar um token previsível. Isso valida posse do link e correspondência do telefone informado, sem implementar OTP/SMS.
- A saída inclui `link_convite` para cadastro e `whatsapp_url` para abrir a mensagem no WhatsApp. **Não existe envio automático de WhatsApp ou Gmail nesta entrega.**
- No site, o convidado informa nome completo, apelido, CPF, WhatsApp, e-mail, senha e confirmação. Esses dados alimentam o cadastro e o fluxo existente de cliente/cobrança Asaas.
- OWNER convida ADMIN mensalista. ADMIN e mensalista apto podem convidar jogadores. Diarista não emite convites. Somente OWNER pode emitir convite ADMIN.
- Convite OWNER é separado, gerado por operador no ramo **Gerar Convite OWNER Manual**. Destinatário configurado em **Configura Destinatário Convite OWNER**; link entregue em **Entrega Link Convite OWNER**. Esse ramo fica separado no canvas e foi posicionado longe dos outros na entrega inicial; o usuário já o localizou. Não mandar procurar um webhook vermelho: o início é um gatilho manual.

## Financeiro: existente versus homologado

O fluxo de inscrição preserva busca de cliente por CPF no Asaas, reutilização ou criação do cliente, emissão da primeira cobrança e gravação dos vínculos. Os nós e conexões de boleto e retorno Asaas foram comparados com o export oficial e preservados nas alterações desta sessão.

O jogador é registrado como cadastro `ativo`, mas sua inscrição retorna `AGUARDANDO_PAGAMENTO` e ele não fica financeiramente apto apenas por se cadastrar. O retorno **Recebe Retorno Asaas**, `POST /webhook/resenha-status-asaas`, trata PAYMENT_CONFIRMED, PAYMENT_RECEIVED e PAYMENT_OVERDUE, atualizando cobranças e aptidão em MENSALIDADES/DIARIAS. Confirmação e recebimento têm efeitos distintos no CAIXA.

**Ainda não homologado neste teste:** cadastro de participante de homologação, boleto correspondente, pagamento real e processamento real do retorno. Não afirmar que a configuração remota do webhook Asaas está correta sem conferir a execução correspondente. Assinatura recorrente automática e próxima cobrança também não estão homologadas; não considerar o ciclo financeiro completo aprovado antes dessas verificações. Nenhuma nova operação financeira foi executada pelo assistente nesta preparação.

## Aba DASHBOARD: reorganização concluída na planilha real

Planilha existente, aba DASHBOARD, gid **800109**. Mantidas as 13 abas. Alteração restrita à DASHBOARD; outras abas não foram editadas para essa reorganização.

Agora existe uma linha por pelada e 13 colunas: pelada_id, pelada, cadastros, mensalistas, diaristas, cobrancas_pendentes, cobrancas_vencidas, mensalidades_recebidas, diarias_recebidas, entradas_caixa, saidas_caixa, taxas, saldo_liquido. Fórmulas geram automaticamente linhas de novas peladas e agregam os dados de origem. Cadastro de OWNER está incluído em `cadastros`, não necessariamente nas categorias de jogador.

Saldo = entradas do CAIXA − saídas − taxas; não somar cobranças novamente. Cobranças usam participante_id → JOGADORES.pelada_id. CAIXA usa payment_id → COBRANCAS → JOGADORES; na ausência desse vínculo, usa jogo_id no padrão JOGO_<pelada_id>_<data>. Movimentos sem vínculo identificável não são atribuídos a nenhuma pelada. Esse vínculo é necessário para despesas e ajustes futuros.

Cabeçalhos/identificação congelados, filtro e formatos numéricos aplicados. Fórmulas verificadas sem erros; área temporária de teste removida. Backup privado anterior: `backups/DASHBOARD_antes_2026-10-27.local`.

## Arquivos certos para continuar

| Finalidade | Arquivo |
| --- | --- |
| Export oficial recebido, original preservado | `workflows/resenha n8n restaurado/JogoLindo — Cadastro, Login, Peladas e Convites.json` |
| Entrega completa derivada desse export, 217 nós | `workflows/para importar/RESENHA_CAMPO_5.json` |
| Atualização pontual da lista administrativa | `workflows/para importar/ATUALIZAR_SOMENTE_SESSAO.code.txt` |
| Instruções operacionais | `workflows/para importar/LEIA_PRIMEIRO.md` |
| Relatório desta sessão | `docs/RELATORIO_DESENVOLVIMENTO_HOMOLOGACAO_2026-10-27.md` |

O antigo arquivo `JogoLindo.json` foi renomeado: uma aba antiga aberta no editor não é outra entrega oficial. JSONs privados e backups não vão para o GitHub/Netlify. Referências de credenciais são privadas e devem ser conferidas pelo responsável no n8n; não recriar ou trocar por suposição.

Para atualizar a consulta administrativa: substituir **apenas o JavaScript de Valida e Prepara Dados Sessão**, salvar/publicar e clicar em Atualizar jogadores no app. Não apagar o nó, suas conexões ou seu fluxo. Não reimportar o consolidado para essa mudança pontual. Importação sobre canvas preenchido acrescenta cópias: isso já causou duplicação e retrabalho nesta sessão.

## Decisões novas para a próxima etapa

1. **Página inicial:** listar peladas registradas. Clicar na linha/nome da pelada abre dia da semana, data da próxima partida, horário e relação de jogadores inscritos.
2. **Ordem da lista:** mensalistas primeiro, depois diaristas. ADMIN mensalista aparece no grupo de mensalistas. Não implementar fila ou times para entregar essa lista inicial.
3. **Painéis de todos:** apresentar a pelada, calendário/horário e lista de participantes conforme a permissão do usuário. A lista pública ou de jogador comum deve usar apenas os dados necessários, como apelido/categoria; não liberar CPF, telefone, e-mail, hashes, tokens ou detalhes financeiros de terceiros.
4. **Meu cadastro:** jogador pode alterar apelido, telefone e e-mail; OWNER/ADMIN poderão editar esses campos dos participantes de suas peladas. Nome/CPF permanecem fora dessa edição e o backend deve rejeitar mudanças de permissões/finanças pelo formulário.
5. **Contato e Asaas:** para liberar telefone/e-mail de quem já tem cliente Asaas, sincronizar o cliente existente por asaas_customer_id, sem criar cliente novo nem substituir o nome pelo apelido. Tratar falha parcial e recuperação sem duplicação. A edição atualmente bloqueada nesses casos não deve ser anunciada como pronta.
6. **Desligamento:** OWNER/ADMIN poderão desligar jogador da pelada autorizada. Preservar histórico e vínculos financeiros; não transformar isso em exclusão indiscriminada da pessoa ou de outras peladas. Regras de cobrança/assinatura durante o desligamento precisam ser definidas antes da implementação financeira correspondente.

**Mais adiante, fora da entrega imediata:** presença no dia, ordem de chegada, prioridade/ordem de jogo, montagem de times e controle de entrada/saída da partida. Não antecipar esse escopo agora.

Novo OWNER permanece por convite exclusivo autorizado pela operação. Cadastro público pago de organizadores para uso futuro da plataforma é etapa posterior, separado da mensalidade dos jogadores. Não criar cobrança de plataforma nesta homologação.

## Como retomar amanhã

1. Ler este relatório antes de modificar código ou workflows. Confirmar o que participante de homologação concluiu de fato e se o nó de sessão foi publicado.
2. Conferir por leitura o vínculo do convidado, categoria/papel, consumo do convite e cobrança. Não repetir cadastro ou emitir outro boleto se houver resultado incerto.
3. Validar o painel com o primeiro jogador real e homologar cobrança/pagamento/retorno na ordem combinada. Qualquer nova ação financeira exige autorização para a etapa concreta.
4. Depois da homologação, planejar a limpeza dos registros de teste e a entrada definitiva de novo responsável como OWNER. Preservar abas, cabeçalhos, CONFIG e credenciais. Apagar linhas não limpa intervalos nomeados de idempotência nem cancela cobranças/assinaturas no Asaas. Não executar essa limpeza sem conferir escopo e pendências.
5. Pedir/usar export atualizado do n8n antes de mudanças posteriores, preservando configurações que o usuário editou no servidor, inclusive destinatário do convite OWNER e posições do canvas. Trabalhar pontualmente quando possível.
6. Implementar página inicial/listagem e permissões de cadastro/desligamento em etapas pequenas após estabilizar o teste. Não refazer autenticação ou ampliar para Supabase neste MVP.

## Validação e estado do repositório

- Última suíte completa local: **90 testes aprovados**, TypeScript, lint e build aprovados. Testes usam simulações locais; isso não equivale a homologação de pagamento real.
- Cópia pública limpa: 47 testes aprovados, 10 ignorados por dependerem de exports privados deliberadamente fora do Git.
- Commits de referência: baa9479 (acesso por perfil), b9641b4 (OWNER separado e WhatsApp), 3f76bb3 (lista administrativa). O frontend de 3f76bb3 foi conferido por leitura dos arquivos públicos do site.
- Há arquivos históricos/não versionados e alterações locais antigas ainda presentes, incluindo testes/pacotes anteriores. Não presumir árvore limpa, não executar `git add .`, não apagar em massa nem usar todos esses arquivos como fontes ativas. A organização solicitada dos históricos ainda não foi concluída.
- Nenhum teste foi repetido nem nova publicação/operação remota executada apenas para produzir este relatório. Trabalho pausado a pedido do usuário.
