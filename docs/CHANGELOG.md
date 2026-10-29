# Resenha Campo5 — histórico de alterações

Consolidado em 29/10/2026 a partir do Git local e dos relatórios. Datas abaixo são datas dos commits ou dos registros operacionais, não versões inventadas. “Versão 01” é o marco de entrega solicitado pelo responsável; não foi criada tag nesta auditoria.

## 29/10/2026

- `be9fe78`: quadro da próxima partida, aptidão e cobranças por perfil.
- `bb4b679`: convidador na ficha administrativa, ordenação da agenda e correção da navegação de histórico.
- `b2d840b`: convidador também nos cartões e quadro administrativo.
- `c7bf023`: valores padrão editáveis no cadastro da pelada. Publicação conferida no bundle Netlify durante a sessão operacional.
- Relatório de homologação: retorno Asaas autenticado corrigido, IDs de evento com `&` aceitos e resposta pelo nó apropriado. Recebimento real e atualização de mensalidade/caixa confirmados, sem expor dados individuais aqui.
- Inscrição do OWNER como mensalista: identidade/papel preservados, vínculo de pelada na cobrança e correção do finalizador. Encerramento do relatório confirmou um recebimento do OWNER antes da limpeza; isso não conclui a recorrência mensal.
- Agenda pública ampliada e instalada pelo usuário; funcionalidades de presença continuaram provisórias e histórico sem backend persistente.
- Encerramento: backup verificado, limpeza autorizada dos registros operacionais, CONFIG/cabeçalhos/fórmulas preservados e controles antigos invalidados. Asaas não foi alterado por essa limpeza.
- Organização documental desta entrega: README atualizado, HANDOFF, DECISIONS, CHANGELOG e índice de relatórios. Sem commit, push, deploy ou mudança funcional. Auditoria executou 98 testes: 96 aprovados e dois casos desatualizados, descritos no HANDOFF.

## 28/10/2026

- `4edc0f9`: contraste dos formulários e apresentação dos erros de inscrição.
- `b5dec6c`: cobranças próprias e acesso ao boleto existente no painel.
- Relatório: consulta de cliente Asaas por CPF e grupo exato, correção de header de autenticação e recuperação de link na sessão. Não presumir que este estado intermediário já incluía confirmação de pagamento; evidência posterior está em 29/10.

## 27/10/2026

- `baa9479`: acesso unificado por perfil e cadastro pessoal por pelada.
- `b9641b4`: separação do cadastro OWNER e convites por WhatsApp.
- `3f76bb3`: lista privada de jogadores por pelada no painel administrativo.

## 24/10/2026

- `8d099a1`: cadastro por convite conectado ao workflow de cobrança.
- `8f2533d`: preservação do frame final da vinheta e ajustes de apresentação.

## 23/10/2026

- `93441f7`: landing e fluxo de cadastro de organizador.
- `6c95c28`, `7300812`, `e8ea3d9`: ajustes de abertura e apresentação visual.
- `f0c8ae3`: convites de jogadores e compartilhamento pelo WhatsApp.

## 22/10/2026

- `e873877`: preparação da demonstração e integração n8n para Netlify; o título original do commit contém uma marca anterior.
- `b4f00db`: favicon e banner para compartilhamento.

## Fontes

[Índice de relatórios](relatorios/README.md) e histórico local consultável com `git log --date=short`. Um commit de frontend não comprova publicação dos workflows n8n. Relatórios operacionais não possuem necessariamente commit correspondente.
