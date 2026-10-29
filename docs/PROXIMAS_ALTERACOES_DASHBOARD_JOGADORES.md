# Próxima etapa — dashboard e edição de jogadores

Decisões registradas em 24/10/2026. Implementação combinada para a próxima sessão; este registro não altera aplicativo, planilhas ou workflows.

- DASHBOARD: uma linha por pelada, identificada por pelada_id, e indicadores em colunas. Totais derivados das demais abas; evitar duplicação financeira e calcular saldo por CAIXA.
- O painel pode combinar dados de PELADAS, JOGADORES, cobranças e outras abas via backend, respeitando permissões e vínculo à pelada. Não copiar os detalhes de cada jogador para a aba de resumo.
- Lista de jogadores: clicar no nome abre os detalhes daquele participante.
- Edição permitida: apelido, telefone e e-mail. Nome e CPF não editáveis nessa tela; a restrição também deve ser aplicada no backend.
- Ao editar telefone/e-mail, sincronizar os campos correspondentes no cliente Asaas já vinculado por asaas_customer_id, usando a credencial de produção da Resenha. Não criar cliente novo. Apelido permanece local, salvo se for definido um mapeamento específico; não substituir o nome do cliente pelo apelido.
- Prever falha na sincronização: não apresentar a atualização como integralmente concluída se o Asaas falhar; permitir recuperação sem duplicação.
- Confirmar na implementação quem pode editar: o próprio jogador e/ou OWNER/ADMIN; dados pessoais visíveis apenas aos perfis autorizados.
- Preservar os fluxos existentes; nenhuma publicação, edição de planilha ou chamada ao Asaas foi executada por este registro.

## Atualização de encerramento — 27/10/2026

Estado completo e roteiro de retomada em [RELATORIO_DESENVOLVIMENTO_HOMOLOGACAO_2026-10-27.md](RELATORIO_DESENVOLVIMENTO_HOMOLOGACAO_2026-10-27.md). O bloco de 24/10 acima é histórico; não significa que todas as suas pendências continuem abertas.

- DASHBOARD por pelada: reorganizado na planilha real. Lista e detalhes de jogadores para OWNER/ADMIN: frontend publicado; usuário informou a substituição do código de sessão, faltando confirmar publicação/resultado com o primeiro jogador.
- Teste atual aguarda participante de homologação se cadastrar pelo convite ADMIN mensalista. Depois da homologação, planejar a limpeza de testes e a entrada definitiva dele como OWNER; nenhuma limpeza foi executada.
- Próxima interface: peladas na página inicial; clicar no nome/linha abre inscritos, dia, data e horário. Mensalistas primeiro, diaristas depois; ADMIN mensalista integra o primeiro grupo.
- A lista básica também deverá aparecer nos painéis de todos, com exposição de dados conforme permissão. Não publicar dados pessoais de terceiros na página inicial ou no acesso de jogador comum.
- Próxima edição: titular e OWNER/ADMIN autorizado poderão alterar apelido, telefone e e-mail, sem editar CPF/nome/permissões/finanças nessa tela. Contato de cliente Asaas exige sincronização com o cliente existente; hoje está bloqueado quando vinculado.
- OWNER/ADMIN poderão desligar participantes apenas da pelada autorizada, preservando histórico. Ainda não implementado.
- Ordem de chegada, prioridade de jogo, filas, montagem de times e entrada/saída da partida ficam para depois. Agora a prioridade é homologar inscrição, boleto/retorno e entregar a listagem básica.
- Trabalho pausado por solicitação do usuário. Retomar pelo relatório, usando o export atual do n8n como fonte oficial.
