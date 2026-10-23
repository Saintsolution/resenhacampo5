# Etapa 1 — OWNER inicial

Importar `08_cadastrar_owner_MANUAL.json` como novo workflow. Não substituir o original ou os sete fluxos de autenticação.

1. Selecionar a credencial Google existente nos dois nós HTTP Request.
2. Em **Dados do OWNER**, preencher `participante_id` com um identificador estável ainda não utilizado, `pelada_id` com o identificador adotado para a Resenha, CPF da identidade Ricardo, telefone e e-mail temporários autorizados do responsável. Não inserir senha. Não utilizar o CPF de Chico Mauro para representar Ricardo.
3. Conferir os dados e executar manualmente, sem outra execução ou edição simultânea de JOGADORES. O destino já é a planilha de desenvolvimento autorizada.
4. Esperar `OWNER_CADASTRADO`, `senha_definida:false`. Conferir uma linha em JOGADORES, com categoria vazia, papel OWNER, situação ativo, senha/sessão em branco. Nenhuma outra aba é alterada.

A leitura verifica os 18 cabeçalhos, CPF, duplicação de identificador/CPF na pelada e existência de OWNER. Não atualiza cadastros existentes nem promove jogadores automaticamente. Reexecução após sucesso para sem escrever.

Os campos de senha e sessão ficam vazios deliberadamente. Cadastro não autentica e não concede acesso ao frontend por si só. Primeiro acesso/login serão a etapa 2 após confirmação. O OWNER não precisa ser mensalista/diarista e não recebe cobrança neste procedimento.

Sem webhook público, e-mail ou Asaas. Fluxo usa Manual Trigger 1, Code 2 e HTTP Request 4.2, sem imports ou instalação. Não executado no servidor nesta entrega.

Leitura seguida de append não é transação de unicidade: executar uma única vez, com escrita coordenada. Em timeout/erro de escrita, conferir a linha antes de repetir. Settings desativam retenção de execuções, mas o editor mostra dados transitórios e políticas globais/proxy devem ser respeitadas. Não fixar dados nem exportar o workflow preenchido para Git/chat. Para limpar o teste, remover apenas a linha confirmada do OWNER de desenvolvimento; não apagar cabeçalhos/fórmulas/abas.
