# Dashboard por pelada e consulta de jogadores — 27/10/2026

## Planilha

A aba DASHBOARD da planilha existente foi reorganizada em A:M: uma linha por pelada, gerada a partir de PELADAS. Indicadores: pelada_id, pelada, cadastros, mensalistas, diaristas, cobranças pendentes/vencidas, mensalidades/diárias recebidas, entradas/saídas/taxas do caixa e saldo líquido.

Cadastros inclui OWNER/ADMIN; mensalistas/diaristas são as categorias de jogadores. Cadastro ativo e aptidão financeira são conceitos distintos. O saldo deriva de CAIXA: entradas menos saídas e taxas, sem somar novamente COBRANCAS. Cobranças vinculam-se pela relação participante_id → JOGADORES.pelada_id. Caixa usa payment_id → COBRANCAS → JOGADORES; na ausência desse vínculo, usa jogo_id no padrão JOGO_<pelada_id>_<data>. Movimentos sem vínculo identificável não são atribuídos automaticamente.

As outras 12 abas e seus dados não foram alterados. O conteúdo/formatação anterior está no backup privado `backups/DASHBOARD_antes_2026-10-27.local`. Pilotos e dados sintéticos usados para validar as fórmulas foram removidos da área temporária P:V; nenhuma movimentação financeira real foi criada.

## Painel do OWNER/ADMIN

Lista de jogadores da pelada selecionada, quantidade total e quantidade de ativos, com botão Atualizar jogadores. Nome clicável expande nome, apelido, CPF, telefone, e-mail, categoria, permissão e situação do cadastro. Não implementa edição dos dados de terceiros nesta entrega. Não exibe senhas/tokens e não declara aptidão financeira a partir de cadastro ativo.

Backend: complemento de `planSession` retorna somente jogadores da pelada já autorizada e apenas para OWNER/ADMIN. OWNER sem categoria de jogador não entra na contagem. Jogador comum não recebe a lista pessoal dos demais.

## Atualização manual mínima do n8n

Não reimportar o workflow inteiro para esta mudança. Copiar todo o conteúdo do arquivo privado `workflows/para importar/ATUALIZAR_SOMENTE_SESSAO.code.txt` e substituir apenas o JavaScript do nó **Valida e Prepara Dados Sessão**. Salvar e publicar. Preserva os nomes dos nós, conexões, credenciais, o destinatário do convite OWNER já configurado e os ramos de cobrança. No app, clicar em Atualizar jogadores ou entrar novamente.

O gerador `scripts/preparar-lista-jogadores.py` atualiza somente esse nó no pacote local derivado do export oficial; não acessa serviços. O gerador principal de OWNER aplica esse complemento automaticamente ao regenerar a entrega completa. O arquivo completo permanece com 217 nós; sua importação não é necessária para ativar a lista.
