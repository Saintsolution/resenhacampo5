# Resenha Campo5 — relatório de 29/10/2026

> Registro histórico. Estado consolidado e correções posteriores: [HANDOFF](HANDOFF.md). Esta cópia foi anonimizada para documentação; não contém os dados individuais do ensaio.
Registro do trabalho realizado em 29/10/2026, horário de Brasília. Este documento não executa operações nem autoriza novas cobranças, exclusões ou publicações.

## Ambiente e operação

- Site: https://resenhacampo5.netlify.app/
- Repositório: Saintsolution/resenhacampo5, branch main. Publicação automática GitHub → Netlify.
- n8n: https://n8n.saintsolution.com.br
- Arquitetura atual: React → n8n → Google Sheets → Asaas.
- O usuário opera a publicação dos workflows no n8n. Preferir alterações pontuais nos nós existentes; não importar workflows inteiros sobre um canvas preenchido.
- Preservar os cadastros e o pagamento do participante de homologação. Não executar limpeza geral.

## Implementado e publicado no frontend

1. Quadro da próxima partida com data, horário, local, participantes e Apto/Não apto. Administradores que jogam primeiro, depois mensalistas e diaristas.
2. Lista administrativa em cartões, com busca por nome/apelido e filtros de categoria e situação. A ficha mostra cadastro, contato e cobranças existentes; pendências oferecem o link de pagamento já emitido.
3. Separação por perfil: OWNER/ADMIN recebem controles e detalhes administrativos; o jogador comum consulta a própria participação, cadastro e cobranças.
4. Impressão/lista do dia por janela do navegador, permitindo salvar PDF, com data de emissão e espaços de conferência.
5. Controles provisórios de chegada, horário e pagamento conferido. São rascunhos na tela, explicitamente identificados; não gravam presença, não confirmam pagamento e não alteram caixa.
6. Atualização periódica das consultas a cada 30 segundos enquanto a página está visível, evitando requisições sobrepostas.
7. Agenda pública na página inicial, abertura do quadro da pelada e entrada na área autenticada. Ordenação pela próxima data e horário entre peladas.
8. Opção para o OWNER também jogar como mensalista, usando seu cadastro existente e preservando OWNER. A opção permanece no cadastro inicial e no dashboard conforme decisão do usuário: validar primeiro o funcionamento pelo dashboard.
9. Aba Histórico de partidas e seleção de data preparadas. Navegação corrigida, mas a persistência/consulta do histórico ainda depende de backend.
10. “Convidado por” visível para OWNER/ADMIN no cartão fechado, ficha e quadro administrativo. O quadro recebe esse nome a partir da lista administrativa da sessão. Ausência de dado mostra “Não registrado”. Não foi incluído no quadro público.
11. Ajustes de largura e apresentação dos painéis, mantendo adaptação para telas menores.

Publicações confirmadas no Netlify pelo carregamento dos novos bundles:

- be9fe78 — quadro da partida e cobranças por perfil.
- bb4b679 — convidador na ficha, agenda ordenada e navegação do histórico.
- b2d840b — convidador também nos cartões e quadro administrativo, último commit publicado nesta sessão.

## Consulta autenticada de sessão

Arquivo de instalação: `workflows/Consulta Sessao Resenha Camp 5./ATUALIZAR_SESSAO_COBRANCAS.code.txt`.

- Busca JOGADORES, TOKENS_ACESSO, LIMITES_AUTH, PELADAS, COBRANCAS, MENSALIDADES e DIARIAS.
- Retorna cobranças próprias, detalhes financeiros administrativos e próxima partida.
- Mensalista: competência da próxima partida, cadastro ativo, status CONFIRMED/RECEIVED e apto_financeiro verdadeiro, com cobrança correspondente.
- Diarista: data da partida e jogo/pagamento correspondentes, além dos mesmos requisitos financeiros.
- OWNER mensalista pode ser associado pela cobrança com pelada_id na coluna Q, preservando o vínculo principal e o papel administrativo.
- Campos convidado_por_id e convidado_por_nome acrescentados às projeções administrativas. Usuário informou publicação do código atualizado.

Retorno real inspecionado antes da última inclusão de convidador: sessão OWNER válida e participante ADMIN mensalista ativo e apto, com cobrança RECEIVED. Naquele momento a mensalidade do OWNER ainda não estava confirmada; a seção de encerramento registra a evidência posterior.

## Agenda pública e participantes

Workflow: `workflows/n8n/21_agenda_publica_APP_MVP.json`, nome “Resenha — Agenda pública”. Endpoint GET `/webhook/rc5-app-v1/peladas-publicas`.

Arquivos para alteração pontual:

- `workflows/Agenda publica com participantes/BUSCA_AGENDA_PUBLICA.url.txt`
- `workflows/Agenda publica com participantes/PREPARA_AGENDA_PUBLICA.code.txt`

A primeira versão retornava apenas nome/local/dia/horário. Foi complementada para devolver a próxima partida com apelido, categoria, papel, situação e aptidão. A projeção pública não devolve CPF, contatos, hashes, valores ou links de cobrança. Inclui mensalistas ativos e diaristas da data da partida. Ordena partidas pela próxima data/horário. O usuário confirmou que agenda e quadro funcionaram após instalar/publicar.

O código público reutiliza internamente o cálculo do quadro autenticado e depois reduz explicitamente a resposta. Como melhoria futura, extrair cálculo compartilhado e projeção pública própria, evitando construir internamente dados administrativos sem necessidade. A URL pública atual ainda lê TOKENS_ACESSO/LIMITES_AUTH para manter os índices do snapshot; eliminar essas leituras desnecessárias quando refatorar os índices.

## Asaas: pagamento e inscrição

### Retorno de pagamento

Corrigidos autenticação do webhook, aceitação do caractere & nos IDs reais de evento e referências aos nomes reais dos nós. Marcadores de eventos com & usam codificação hex. Corrigido modo de resposta do Webhook para “Using Respond to Webhook Node”.

Pagamento real do participante de homologação verificado na planilha: cobrança RECEIVED, mensalidade apta, movimento único no CAIXA e evento PROCESSADO_RECEIVED. Valores individuais omitidos nesta versão documental para Git. Não emitir novamente nem excluir esse pagamento.

Arquivos pontuais do retorno: `workflows/Retorno Asaas corrigido/`.

### OWNER gerando a própria mensalidade

Workflow existente: “Resenha - Inscricao e Boletos Asaas”. Alterações em quatro nós, publicadas pelo usuário:

- Reserva inscrição Inscrição.
- Finaliza inscrição Inscrição.
- Busca inscrição Inscrição.
- Busca Novamente vínculos Inscrição.

Arquivos: `workflows/Quadro pelada e owner mensalista/`.

O fluxo aceita a inscrição do próprio OWNER por convite próprio, valida senha e mantém identidade/papel. A finalização grava pelada_id em COBRANCAS!Q e registra a mensalidade aguardando pagamento. Não há isenção automática nem renovação mensal implementada.

Incidente: a cobrança do organizador de homologação foi emitida no Asaas, mas o nó Finaliza inscrição estava chamando reserve19. O lote tentou criar novamente o marcador de reserva; Google recusou por marcador já existente, sem gravar os vínculos financeiros. Identificado em execução de homologação, com correção descrita abaixo.

Linha final correta do finalizador, também conferida no arquivo local:

```javascript
return [{json:finalize19($('Cobrança pronta Inscrição').first().json,$input.first().json,Date.now())}];
```

Usuário informou ter corrigido e salvo. Ele preferiu excluir manualmente a cobrança pendente no Asaas e iniciar outra tentativa. A ausência da cobrança antiga na lista foi conferida. A única alteração remota de reparo feita na planilha foi CONVITES!I3: PROCESSANDO → CANCELADO, referente ao convite de homologação afetado. Marcadores e token antigos foram preservados para impedir reutilização. O convite do participante de homologação não foi alterado. Não foi confirmada nesta conversa a conclusão de uma nova cobrança do OWNER após esse reparo.

## Problemas de configuração esclarecidos

- Ao colar manualmente em Expression do n8n: `{{ ... }}`, sem = inicial. Em JSON exportado: `={{ ... }}`. URL fixa começa diretamente com https://. O erro literal “Invalid URL: =https://...” foi causado por confusão entre os formatos; os arquivos de copiar/colar devem respeitar essa distinção.
- Triângulos de credenciais apareceram na visualização de execuções salvas, enquanto o Editor não apresentava alerta e as consultas/gravações funcionavam. Não recriar credenciais por esse aviso isolado.
- Resposta Google batchUpdate com replies contendo objetos vazios representa retorno normal dessas operações. NO_UPDATES_REQUESTED refere-se a comentários, não à ausência de gravação das células.
- A agenda pública inicialmente não tinha webhook registrado: retornava 404 e o navegador também acusava CORS. Não tratar ausência de cabeçalho em resposta de erro como prova de problema isolado de CORS.

## Verificações e limites da validação

- Ao longo do dia passaram testes locais de frontend/backend, typecheck, lint e build. Antes da primeira publicação do painel, a suíte então existente tinha 98 testes aprovados.
- Nos últimos ajustes de convidador passaram os sete testes de access-panel, typecheck, lint e build; não foi repetida a suíte completa a cada publicação.
- Após ampliar a agenda pública, foi verificada sua sintaxe e resposta de falha. O teste antigo de agenda em tests/match-roster.test.mjs ainda precisa ser atualizado ao novo snapshot de sete intervalos; não afirmar que a suíte completa atual está verde.
- Inspeção funcional inicial em prévia local com perfis fictícios e consultas reais no n8n/planilha. Revisão visual completa de OWNER, ADMIN e jogador comum em produção ainda pendente.
- Último frontend conferido por bundle publicado; usuário ainda não confirmou visualmente os nomes de convidadores após a última publicação.
- A árvore de trabalho contém arquivos locais e exports privados não enviados ao GitHub. Não adicionar todos os arquivos indiscriminadamente a um commit.

## Próximas implementações — ordem sugerida

### 1. Concluir validação do que está publicado

- Conferir “Convidado por” no OWNER e ADMIN com o dado real retornado pela sessão.
- Validar nova emissão de mensalidade do OWNER após o reparo: uma cobrança no Asaas e um registro correspondente em COBRANCAS/MENSALIDADES, mantendo OWNER. A emissão real deve ser feita pelo usuário, uma vez.
- Testar convite e cobrança de diarista para uma data específica, incluindo opção com/sem colete e retorno do pagamento.
- Revisar os três perfis no site e o uso em celular/tablet. Conferir impressão e link de cobrança existente.
- Não usar reexecução de tentativas financeiras antigas como teste genérico.

### 2. Corrigir limites e uniformizar o quadro

- Prioridade técnica: a sessão ainda possui limite GLOBAL de 30 consultas por 15 minutos. Polling a cada 30 segundos pode esgotá-lo com um único painel e certamente com vários usuários. Redesenhar o limite de consulta de sessão sem prejudicar login/recuperação; não apenas aumentar cegamente o limite global.
- Uniformizar o filtro de diaristas no quadro autenticado: atualmente a projeção pública filtra a data, mas a seleção administrativa pode incluir todos os diaristas vinculados à pelada como não aptos.
- Fortalecer testes de isolamento entre peladas, competência e jogo e atualizar testes da agenda pública. Consolidar cálculo compartilhado sem misturar projeções públicas e privadas.
- Revisar contadores de jogadores para incluir OWNER participante de forma consistente.

### 3. Persistência de presença e histórico

- Definir identidade de cada partida (pelada_id + jogo_id/data), incluindo jogos extras, adiados e cancelados.
- Salvar presença, chegada e ordem de chegada, com identificação do admin e horário da alteração.
- Recuperar registros ao atualizar ou trocar de dispositivo. Tratar concorrência entre administradores e repetição de requisições.
- Permitir lançamento durante a pelada e complementação posterior por OWNER/ADMIN.
- Histórico por data e impressão com os dados gravados.
- Conferência manual de pagamento não deve fabricar confirmação Asaas, aptidão ou movimento de caixa.

### 4. Scout — regras a definir com calma pelo usuário

A base atual identifica jogadores, peladas, datas e permissões; o scout ainda não foi implementado.

Definir quais dados acompanhar: times, partidas dentro do encontro, placar, gols, assistências, goleiros, vitórias/empates/derrotas, minutos ou participações. Decidir critérios para fila, formação de times e rankings. Só depois definir tabelas, formulários e indicadores.

Cada lançamento deve referenciar jogador e partida, permitir correção por admin e preservar histórico. Participação esportiva deve ser separada de cadastro ativo e situação financeira. Dados podem ser lançados ao vivo ou posteriormente, conforme a regra que for escolhida.

### 5. Evoluções financeiras e operacionais

- Definir renovação de mensalidades por competência; hoje o fluxo trata inscrição inicial, não assinatura automática.
- Definir como lidar com estorno, cancelamento, exclusão e conciliação de emissão com falha posterior de gravação.
- Preparar procedimento de recuperação da cobrança existente sem duplicar emissão.
- Reavaliar persistência/limites do MVP à medida que houver mais peladas e jogadores.

## Próxima retomada

Começar conferindo o estado real dos workflows e cadastros, sem assumir que uma nova mensalidade foi concluída. Manter a operação financeira existente e discutir o scout antes de implementá-lo. A decisão atual é manter as opções de OWNER mensalista como estão e validar pelo dashboard.


## Encerramento da homologação e preparação da versão 01

Por nova autorização explícita do usuário, os registros operacionais foram zerados em 29/10/2026. Essa decisão substitui a orientação anterior de preservar os cadastros de homologação na planilha ativa.

- Backup completo salvo antes da limpeza: cópia privada de homologação de 29/10/2026, localizada pelo responsável no Drive. Dados e fórmulas das 13 abas foram comparados com a origem e coincidiram.
- Limpas as linhas 2 a 1000 de PELADAS, JOGADORES, LIMITES_AUTH, TOKENS_ACESSO, CONVITES, COBRANCAS, MENSALIDADES, DIARIAS, CAIXA, EVENTOS_ASAAS e JOGOS_SCOUT. Verificação posterior confirmou zero registros nessas 11 abas e preservação de todos os cabeçalhos.
- CONFIG e fórmulas do DASHBOARD preservadas e comparadas com o estado anterior.
- Removidos 21 marcadores de cadastros, convites e inscrições antigas. Mantidos quatro marcadores de eventos/créditos financeiros para impedir reprocessamento dos pagamentos antigos. Eles não são cadastros nem geram uma pelada.
- Asaas não foi alterado por essa limpeza. Os pagamentos reais anteriores permanecem no Asaas e no backup.
- A leitura anterior à limpeza confirmou também a mensalidade do OWNER como RECEIVED, apta e com movimento de caixa correspondente; essa evidência atualiza a pendência de confirmação registrada anteriormente neste relatório.
- Contas, sessões e convites anteriores foram invalidados pela limpeza. Gerar um novo convite de OWNER antes de encaminhar o acesso ao novo responsável.
- Valores iniciais editáveis no formulário: mensalidade R$ 30; diária sem colete R$ 15; com colete R$ 20; colete avulso R$ 5; vencimento dia 10; convite válido por 72 horas. Nome, local, cidade, dia e horários continuam para preenchimento. Esses padrões não criam uma pelada antecipadamente.
- Frontend enviado ao GitHub em c7bf023. Sete testes do painel, typecheck, lint e build passaram. As limitações de presença/histórico/scout e os demais itens técnicos anteriores continuam registrados; a limpeza não implementa essas evoluções.
