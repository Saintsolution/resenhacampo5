# Resenha Campo5 — decisões e regras

Consolidação em 29/10/2026. As datas de commits estão no [changelog](CHANGELOG.md); não atribuímos data original a decisões sem registro. “Adotada” descreve a direção atual, sem garantir homologação de todos os cenários.

| Tema | Decisão / motivo | Estado e consequência |
| --- | --- | --- |
| Arquitetura | React → n8n → Google Sheets → Asaas | Adotada no MVP; migrações Supabase são históricas |
| Marca | Resenha Campo5 | Nome usado na documentação nova; identificadores legados preservados |
| Multi-organizador/multi-peladas | OWNER cria e consulta peladas próprias; backend verifica titularidade | Implementação local e jornada conectada; não implica participação arbitrária em múltiplas peladas |
| Identidade e participação | Separar conceitualmente usuário, organizador e jogador | JOGADORES ainda reúne identidade e vínculo principal; normalização futura exige migração explícita |
| Papéis | OWNER e ADMIN administram; jogador consulta seus próprios dados | Autorização vem do servidor, nunca de campos livres do navegador |
| Promoção administrativa | Convite ADMIN é exclusivo do OWNER na regra mais recente | Teste local exige isso; fonte antiga diverge e ramo publicado precisa ser conferido |
| OWNER jogador | Pode pagar mensalidade e jogar usando identidade existente, preservando OWNER | Cenário de recebimento confirmado antes da limpeza; sem isenção e sem recorrência completa |
| Cadastro OWNER | Convite exclusivo, de uso único, vinculado ao destinatário; conta primeiro e pelada após login | Substitui jornada de bootstrap conjunto no frontend atual |
| Categoria financeira | Mensalista por competência; diarista por jogo/data, com opção de colete | Não confundir categoria com papel administrativo |
| Convites | Registrar convidador, validade e destino; inscrição consome convite | Compartilhamento por WhatsApp não significa mensagem automaticamente enviada pelo assistente |
| Aptidão | Cadastro ativo mais registro/cobrança compatível, status confirmado/recebido e aptidão financeira | Não inferir aptidão de cadastro ativo, ADMIN ou valor pago em outro mês/jogo |
| Competência | Próxima partida define mês mensalista e data diarista, em America/Sao_Paulo | Renovação mensal futura ainda precisa ser implementada |
| Financeiro externo | Asaas é origem do evento de pagamento; Sheets mantém vínculos e projeções | Emissão externa e finalização local não são atômicas; conciliar falha antes de repetir |
| Conciliação | Preservar idempotência por evento, crédito e operação | Remover marcadores em produção pode permitir duplicação |
| Presença e histórico | Devem ser registros esportivos separados do cadastro e financeiro | Hoje controles de campo são rascunhos em memória; persistência e concorrência pendentes |
| Conferência em campo | “Pagamento conferido” é anotação do operador | Não confirma pagamento Asaas, não concede aptidão e não altera caixa |
| Scout | Definir times, partidas, métricas e correções com o responsável antes da implementação | Não implementado; aba ou tipo de domínio não prova funcionalidade |
| Privacidade | Lista administrativa restrita; agenda pública tem projeção reduzida | Convidador mostrado para OWNER/ADMIN; sem contatos/CPFs/cobranças no quadro público |
| Configuração inicial | Valores padrão editáveis no formulário; CONFIG preservada | Padrões não criam pelada nem vínculo financeiro |
| Implantação | Frontend publica por GitHub → Netlify; usuário publica n8n | Export local não é fonte definitiva do servidor; preferir alteração pontual |
| Histórico | Preservar relatórios, fontes e backups privados | Não apagar/mover pacotes ou adicionar arquivos em massa ao Git |

## Decisões ainda abertas

Redesenho do limite de sessão, modelo normalizado de participação, identidade de partida extraordinária/adiada, persistência de presença, política de correção/auditoria, regras de fila/times/scout, renovação mensal e tratamento completo de estorno/cancelamento. Não apresentar essas decisões como implementadas.
