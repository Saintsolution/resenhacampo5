# Resenha Campo5 — relato de desenvolvimento e homologação de 28/10/2026

> Registro histórico. Estado consolidado e correções posteriores: [HANDOFF](HANDOFF.md). Esta cópia foi anonimizada para documentação; não contém os dados individuais do ensaio.
Documento para continuidade com GPT/Codex. Registra o estado conhecido ao encerramento da conversa; não autoriza limpeza, cobrança, pagamento ou publicação. Complementa o relatório de 27/10/2026.

## Contexto e limites

O MVP Resenha Campo5 usa React → n8n → Google Sheets → Asaas. Sem Supabase nesta fase. O usuário publica manualmente os workflows no n8n. Utilizar os exports atuais fornecidos por ele; não reconstruir produção a partir de pacotes históricos ou testes estruturais.

Site correto: https://resenhacampo5.netlify.app/. Backend público: https://n8n.saintsolution.com.br/webhook/rc5-app-v1. O domínio aflorapreservada.com.br pertence a outro projeto: sua inclusão acidental foi integralmente desfeita antes de commit/publicação.

## Diagnóstico e correção da inscrição

1. A primeira consulta Asaas encontrou dois clientes anteriores com o mesmo CPF. O fluxo retornou CONSULTA_CLIENTE_INCONCLUSIVA para evitar escolher um pagador arbitrariamente. O IF encaminhou uma falha tratada; execução verde no n8n não significava cadastro financeiro concluído.
2. Regra final escolhida pelo usuário: consultar clientes por CPF + grupo exato `Pagamentos Pelada`. Clientes fora do grupo não são reutilizados. Sem resultado no grupo, criar cliente nesse grupo; um resultado é reutilizado; múltiplos resultados continuam bloqueados.
3. O export separado de inscrição foi ajustado em Busca cliente Inscrição (filtro groupName) e Cria cliente Inscrição (groupName no corpo). O grupo é atributo do cliente, não um campo do boleto.
4. Uma tentativa posterior falhou em Cria cliente Inscrição com HTTP 401 Unauthorized. O header estava escrito `accesss_token`, com um s extra. Corrigido localmente; o usuário corrigiu e publicou no servidor.
5. A reserva da criação recusada deixou um marcador `rc5_customer_…`. Esse marcador causou EMISSAO_INCERTA_CONCILIAR_ANTES_DE_REPETIR nas tentativas seguintes. Foi removido pontualmente após conferir o caso, preservando cadastro e demais controles.
6. Após novos ensaios, o usuário confirmou emissão do boleto de homologação e inclusão do cliente no grupo. Há cobrança PENDING e mensalidade vinculadas ao participante de teste. Não repetir emissão para recuperar o link.

O fluxo registra o jogador antes de concluir a parte Asaas. Portanto JOGADORES.situacao=ativo significa cadastro ativo, não mensalidade paga ou elegibilidade esportiva. O papel ADMIN também não comprova adimplência.

## Frontend publicado

- Commit `4edc0f9`: textos dos formulários mais escuros e com traço mais forte; erros da inscrição junto ao botão, evitando mensagens fora da área visível no celular.
- Commit `b5dec6c`: seção Minhas cobranças no painel, com atualização, status, valor, competência, vencimento e acesso à cobrança/boleto existente para PENDING/OVERDUE.
- Ambos enviados ao GitHub/main; presença dos novos recursos conferida nos arquivos públicos do Netlify.
- Arquivos de Minhas cobranças: `src/components/AccessPanel.tsx` e `src/lib/n8n/owner.ts`.
- A atualização usa a consulta autenticada de sessão existente; não cria cobrança e não envia e-mail/WhatsApp.

## Consulta de sessão e recuperação do boleto

O usuário separou a consulta de sessão em workflow independente e informou ter desativado o ramo correspondente no principal. O endpoint deve continuar GET `/webhook/rc5-app-v1/sessao`, com somente um webhook ativo nesse caminho.

Foram alterados dois nós no export separado:

- Busca Dados Sessão: acrescentar COBRANCAS!A:P como quinto intervalo, depois de JOGADORES, TOKENS_ACESSO, LIMITES_AUTH e PELADAS.
- Valida e Prepara Dados Sessão: complementar a sessão autenticada com `minhas_cobrancas`, filtradas pelo participante_id do próprio titular. Retornar apenas campos necessários e links Asaas permitidos. Falha na consulta financeira é sinalizada por `cobrancas_indisponiveis`, sem conceder permissões.

Problemas encontrados no ensaio remoto:

- Login respondeu 200 / LOGIN_AUTORIZADO, mas a consulta de sessão falhou porque a URL começava literalmente com `=https://`. O sinal de igual pertence à serialização do JSON n8n; no editor Expression o texto para colar deve começar com `{{`, sem `=` literal. O arquivo pontual de URL foi corrigido localmente.
- Após corrigir a URL, a sessão retornou a cobrança PENDING com invoice_url vazio. A planilha continha o link correto. O código original usava `new URL` dentro de try/catch; a indisponibilidade desse recurso no ambiente do nó era a causa provável do descarte silencioso.
- O filtro do link foi substituído por validação textual HTTPS restrita a asaas.com/subdomínios, sem depender de URL global. Testado localmente em contexto isolado sem URL.
- O usuário confirmou ao final que funcionou e a cobrança apareceu. Trata-se de confirmação do usuário; não equivale à homologação do pagamento.

## Arquivos atuais para continuidade

| Finalidade | Arquivo |
| --- | --- |
| Export separado de inscrição ajustado | `workflows/Resenha - Inscricao e Pagamentos Asaas/Resenha - Inscricao e Boletos Asaas.json` |
| Export separado de sessão ajustado | `workflows/Consulta Sessao Resenha Camp 5./Consulta Sessao Resenha Camp 5.json` |
| JavaScript pontual de sessão | `workflows/Consulta Sessao Resenha Camp 5./ATUALIZAR_SESSAO_COBRANCAS.code.txt` |
| URL para colar em Expression | `workflows/Consulta Sessao Resenha Camp 5./BUSCA_DADOS_SESSAO_URL.txt` |
| Instruções pontuais | `workflows/Consulta Sessao Resenha Camp 5./LEIA_PRIMEIRO.md` |

Os nomes `Camp 5.` na pasta de sessão e `Camp 5` no arquivo refletem o nome salvo pelo usuário. Não renomear ou apagar automaticamente. Backups originais e pré-alterações foram preservados.

## Validação local

Antes do push de Minhas cobranças: typecheck, lint e build aprovados; suíte local completa com 90 testes aprovados, sem falhas. Dez verificações adicionais de renderização cobriram pendente, vencida, recebida, links, vencimento, ausência de cobrança e indisponibilidade. A correção posterior do filtro de links foi validada com duas URLs permitidas e seis entradas indevidas, sem URL global.

Esses resultados não comprovam as configurações remotas nem pagamento real. Não tratar antigos testes com exports privados como fonte da implantação atual.

## O que falta homologar antes do pagamento

Não foi auditado nesta etapa o export atualizado do retorno Asaas publicado. O fluxo conhecido Recebe Retorno Asaas, POST `/webhook/resenha-status-asaas`, contém tratamento de PAYMENT_CONFIRMED, PAYMENT_RECEIVED e PAYMENT_OVERDUE, mas é necessário conferir a versão atual e a configuração no Asaas.

Próxima revisão deve confirmar:

1. Recepção autenticada dos eventos no endpoint correto e workflow publicado.
2. Vínculos entre participante, pelada, customer_id, payment_id, COBRANCAS e MENSALIDADES/DIARIAS.
3. Atualização idempotente do status e da aptidão financeira, sem duplicar registros nem regredir estado por evento antigo.
4. Distinção entre confirmação de pagamento e recebimento efetivo no CAIXA.
5. Regra explícita de competência para elegibilidade da próxima partida. O boleto atual é de outubro; não assumir que libera novembro.

O painel lê cobranças já gravadas em COBRANCAS. Não busca automaticamente todas as cobranças de subscriptions no Asaas. Criação/ativação da assinatura, gravação de subscription_id e ingestão de futuras cobranças recorrentes continuam pendentes de auditoria/homologação. Não anunciar recorrência concluída.

## Plano combinado

1. Preservar o boleto atual e concluir a auditoria do retorno Asaas antes de pedir pagamento.
2. O irmão do usuário paga esse boleto para testar atualização automática de adimplência. O assistente não executa o pagamento nem marca manualmente como pago.
3. Conferir execução real, status nas planilhas, painel e elegibilidade da partida conforme competência.
4. Somente depois, planejar reinício: usuário limpa os testes no Asaas; assistente limpa registros e marcadores correspondentes no Sheets mediante autorização concreta e conferência de pendências.
5. Novo ensaio pretendido: irmão como OWNER; usuário convidado como ADMIN mensalista; usuário convida personagem fictício como diarista. OWNER sem categoria de jogador não gera mensalidade automaticamente.

Esse reinício futuro ainda não foi executado. Não limpar agora os registros do boleto em homologação.

## Limpezas realizadas e cuidados

Durante o dia houve múltiplas limpezas solicitadas pelo usuário. Foram preservados cabeçalhos, CONFIG, abas e fórmulas do DASHBOARD. Marcadores internos de testes são intervalos nomeados: apagar linhas não os remove. Backups privados foram salvos em `backups/*.local`.

No Google Sheets: Dados → Intervalos nomeados permite inspecionar esses marcadores. Removê-los durante operação normal pode liberar duplicações. Não fazer limpeza global com cobranças/assinaturas pendentes sem conciliar os vínculos externos.

O separador entre colunas B/C do DASHBOARD era congelamento de duas colunas. Os ícones dos cabeçalhos são filtros; novas colunas fora do intervalo original não tinham esses ícones. O usuário informou ter ampliado os filtros manualmente.

## Organização e documentação no Git

É normal separar aplicação, testes, documentação e exports. O excesso atual vem principalmente da convivência de entregas atuais, pacotes históricos, scripts geradores e backups locais. A organização precisa ser feita depois, sem exclusão em massa.

Este relatório pode ser documentação versionada: não inclui CPF, senha, token, contato pessoal nem chave de API. Exports n8n podem conter segredos e devem ser revisados/sanitizados antes de qualquer inclusão no Git. Não versionar backups privados. Nunca usar `git add .` nesta árvore.

Plano de organização: identificar fontes atuais e dependências dos testes; manter originais privados; criar índice em docs; arquivar históricos com referências; consolidar apenas duplicações comprovadas. Testar antes de remover arquivos que scripts ou testes utilizam. O texto longo dentro dos nós inclui funções legadas compartilhadas: não remover funções apenas por parecerem antigas antes de analisar o caminho executado e suas dependências.

## Forma de trabalho remota

No fim da sessão, o usuário autorizou leitura direta do n8n pelo Chrome conectado. Isso permitiu inspecionar configuração e execuções sem copiar JSONs manualmente. Essa autorização foi somente de leitura: não salvar, publicar, editar ou executar nós sem instrução específica. Continuar usando exports atualizados para preparar alterações locais.
