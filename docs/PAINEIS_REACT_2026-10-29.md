# Painéis React — 29/10/2026

Implementação local, não publicada. Não alterou planilhas nem workflows nesta etapa. Preservar os dois jogadores reais até validar na tela com o n8n.

Prévia de interface, exclusivamente em desenvolvimento: http://127.0.0.1:5173/#/previa-paineis. Exemplos fictícios identificados; não são os jogadores da planilha. A rota e os exemplos não entram no build de produção.

- Organização: lista do dia em ordem OWNER/ADMIN que jogam, mensalistas, diaristas. Apto/Não apto vem da resposta, nunca do check manual. Fichas expansíveis com nome, apelido, categoria, estado, CPF, contatos e cobranças, restritas à interface administrativa. Busca por nome e filtro por categoria/atividade.
- Jogador: somente a própria situação na partida, cadastro e cobranças, com link existente quando houver pagamento pendente. Não gera segunda cobrança para imprimir ou reabrir pagamento.
- Capa: abre quadro público da próxima partida, com apelido, categoria/função, Apto/Não apto. Nunca envia ficha pessoal à impressão.
- Imprimir/salvar PDF: abre impressão nativa do navegador em A4 paisagem. Lista com data/hora da emissão, campos de chegada, horário e pagamento conferido. Não altera caixa, cobranças ou aptidão.
- OWNER/ADMIN: controles de chegada, horário e pagamento conferido são rascunhos em memória da tela, explicitamente identificados; não persistem após sair/recarregar. Conservados durante atualização da consulta. Precisam de gravação autenticada no n8n.
- Histórico por data: interface pronta, mostra indisponibilidade enquanto não receber os dados. Ainda não cria snapshots de partidas nem inventa histórico a partir da lista atual.
- Atualização de consulta a cada 30 segundos enquanto aba visível, sem requisições sobrepostas. Não é push em tempo real. Sem backend novo, a interface não fabrica participantes ou aptidão.

## Contrato para a próxima etapa no n8n

1. Sessão autenticada: `proxima_partida: {data, participantes, total_aptos}`. Participante básico: participante_id, apelido, categoria, papel_administrativo, situacao, apto. Jogador comum deve receber somente os campos autorizados pelo backend; a UI usa apenas o próprio estado no painel pessoal.
2. Somente OWNER/ADMIN autorizados na pelada: `jogadores[]` com dados da ficha, `apto?` e `cobrancas?: [{payment_id,tipo,competencia,vencimento,valor,status,invoice_url?,pago_em?}]`. Campos financeiros ausentes são tratados como indisponíveis.
3. Agenda pública: `peladas[]` com agenda e `proxima_partida?: {data,participantes}`. Incluir todos os mensalistas e apenas diaristas vinculados ao jogo do dia. Lista pública de apelidos/categoria/aptidão autorizada pelo usuário; não incluir CPF, contatos, links de cobrança, valores ou identificadores de cliente Asaas.
4. Histórico administrativo: `historico_partidas?: [{data,participantes}]`, posteriormente consulta por data no servidor. Dados históricos devem vir de registros daquela partida, não do estado atual.
5. Próxima etapa: persistência de presença/horário/conferência com autorização OWNER/ADMIN, identificação de partida, autor e data da alteração. Recebimento manual precisa de operação financeira separada e idempotente. Check de pagamento conferido não implica recebimento manual.

Validação: typecheck, lint, build e suíte local; conferidos no navegador separação de perfis, abertura de ficha e chegada com preenchimento de horário. Integração dos dois jogadores reais e gravações dependem do workflow seguinte. Não apagar os dados atuais.
