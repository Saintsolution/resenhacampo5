# Teste de cadastro separado e convite WhatsApp

Frontend: menu público com login; cadastro OWNER disponível somente pelo link exclusivo. A conta é salva antes da pelada. Depois do login, OWNER sem pelada encontra o botão “Criar minha pelada”; OWNER com peladas pode selecionar uma e criar outra. Senhas de login e cadastro, inclusive o cadastro de jogador por convite, têm botão mostrar/ocultar.

Convites de jogadores preservam apelido, WhatsApp e tipo. OWNER pode convidar ADMIN mensalista. ADMIN e mensalista apto convidam jogadores; diarista não convida. A permissão é conferida no backend, além da apresentação dos botões.

O arquivo local privado para atualização manual é `workflows/para importar/RESENHA_CAMPO_5.json`, com 217 nós, acompanhado de `LEIA_PRIMEIRO.md`. Parte exclusivamente do export oficial fornecido pelo usuário; não mistura pacotes antigos. O gerador está em `scripts/preparar-workflow-owner.py` e falha se o export necessário não estiver disponível.

A preparação não acessa o n8n, não altera Sheets e não chama o Asaas. O teste real somente começa depois da publicação manual do novo workflow e da geração do convite OWNER pelo operador do n8n. A geração manual grava um token de convite na planilha; a inscrição de jogador por convite conserva a emissão real de boleto já existente.

Validação local cobre cadastro sem pelada, login sem vínculo, primeira pelada, repetição idempotente, token de outro destinatário, expiração, uso único, concorrência, hierarquia dos convites, layout por perfil e preservação dos ramos financeiros do export. Testes que dependem de exports privados são ignorados quando esses arquivos não estão disponíveis em um clone público; não se publicam credenciais para executar esses testes.

Envio exclusivamente pelo WhatsApp; nenhum nó Gmail nesta entrega. Listagem pública de próximas peladas/inscritos não foi implementada nesta alteração; não apresentar a seção atual como consulta conectada.
