# Autenticação JogoLindo — proposta para aprovação

Estado: preparação local; nenhum login real, workflow, planilha ou configuração remota criado/alterado. Não contratar outro serviço nem introduzir outro armazenamento de negócio.

## 1. Evidência do ambiente

Consulta pública em 21/10/2026, por HTTPS, sem cookies, credenciais ou bypass de TLS:

- `GET https://n8n.saintsolution.com.br/`: HTTP 200; certificado aceito pelo curl (verificação TLS 0).
- O HTML aponta a base REST pública `rest`.
- `GET /rest/settings`: HTTP 200; somente configurações limitadas do editor. Nenhum campo de versão, execução, runners ou módulos disponível na resposta pública.
- Não há conexão administrativa n8n, SSH, configuração de containers ou workflow exportado disponível no projeto.
- Self-hosted é uma informação confirmada pelo proprietário; versão, Node.js, runners, módulos criptográficos, CORS, SMTP, proxy, cookies e limites de execução permanecem NÃO VERIFICADOS.

Não inferir ausência de um módulo pela falta de metadados públicos. Não tentar endpoints de execução ou autenticação para descobrir configurações.

## 2. Verificações administrativas pendentes (somente leitura)

O responsável pelo servidor deverá informar a versão do n8n exibida no painel ou por `n8n --version` no container/processo já existente, a versão Node.js e a topologia: modo regular/queue, quantidade de instâncias/workers e runners. Não executar comandos que imprimam todo o ambiente, arquivos de credenciais ou configurações com segredos.

Verificar apenas os valores não secretos relevantes: modo dos runners, allowlist de `crypto`, `argon2` e `bcrypt`, imagens/versões dos runners e limite de concorrência. Não copiar `N8N_RUNNERS_AUTH_TOKEN`, chaves de criptografia, credenciais Google/Asaas ou cookies para este repositório/chat.

Em runner externo, confirmar a allowlist no arquivo efetivo do runner (não assumir que a variável do container principal é suficiente). Módulos nativos precisam estar instalados no ambiente que realmente executa o Code node e compatíveis com Node.js, arquitetura e libc. Não instalar, atualizar imagens, permitir módulos ou reiniciar serviços nesta etapa. Se indisponíveis, registrar pendência e solicitar aprovação separada. Nunca liberar `*` para resolver o teste.

Referências oficiais:
- https://docs.n8n.io/code/code-node/
- https://docs.n8n.io/hosting/configuration/task-runners/
- https://docs.n8n.io/hosting/configuration/environment-variables/task-runners/

## 3. Procedimento criptográfico isolado

Arquivo: `crypto-probe.code.txt`. É código para colar em um Code node JavaScript, não um workflow publicado nem endpoint.

1. Após autorização para executar testes, usar ambiente de homologação com a mesma versão/imagem/configuração dos runners de destino. Não criar ou executar este teste em produção nesta etapa.
2. Criar rascunho inativo com Manual Trigger → Code (Run Once for All Items), sem credenciais e sem nodes Google/HTTP/Asaas. Nenhuma entrada externa é necessária.
3. Colar o arquivo e executar manualmente uma vez. Não adicionar `console.log` ou retornar variáveis intermediárias. Todos os valores de senha são fictícios e definidos no próprio arquivo.
4. O relatório deve demonstrar: senha correta aceita; errada rejeitada; dois salts independentes; hashes diferentes para a mesma senha; custo codificado correto; `crypto.randomBytes(32)`; hash SHA-256 determinístico, sensível ao token e validado por vetor conhecido.
5. O relatório só contém nomes, parâmetros, booleanos e tempo agregado de duas gerações e duas verificações. Nunca retorna senha, salt, hash ou token. Módulo bloqueado/ausente é relatado sem mensagem interna.
6. Registrar resultado sanitizado e duração. A amostra de dois tokens não prova entropia: a fonte segura é `crypto.randomBytes`. Tempo agregado não equivale a benchmark por operação.
7. Repetir no máximo três execuções sequenciais em homologação para observar estabilidade. Teste de carga exige aprovação própria. Não reduzir custo automaticamente após falha.

Algoritmo recomendado: Argon2id, inicialmente m=19456 KiB (19 MiB), t=2, p=1, saída de 32 bytes e salt aleatório individual gerado pela biblioteca. Medir no servidor real antes de aprovar. Alternativa condicionada: bcrypt com custo inicial 12 (nunca abaixo de 10), entrada limitada a 72 bytes UTF-8 e sem truncamento silencioso. Não substituir nenhum deles por SHA-256 de senha. SHA-256 é usado SOMENTE para tokens aleatórios de alta entropia.

O hash de senha codificado já inclui algoritmo, salt e custo; não é necessário armazenar salt em outra coluna. Não usar salt fixo, implementação artesanal ou CPF como senha. Política proposta: 15–64 caracteres, permitir colagem e espaços; com bcrypt, respeitar também os 72 bytes sem normalizar/truncar a senha.

Base dos parâmetros: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html

## 4. Sessões e permissões

Preferir frontend servido no mesmo site do backend, idealmente com proxy de API na mesma origem, caso já suportado pela infraestrutura. O domínio definitivo do frontend está pendente. Isso não autoriza configurar proxy agora.

Cookie proposto: `__Host-jl_session=<segredo aleatório>; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800`, sem atributo Domain. O servidor armazena somente SHA-256 do valor aleatório. Proposta de duração: 8 horas absolutas e 30 minutos de inatividade. Timestamp UTC ISO-8601 no armazenamento; exibição America/Sao_Paulo. O servidor verifica expiração, revogação e status do usuário a cada requisição. Renovar sessão no login, revogar no logout e revogar todas na redefinição de senha. Mudanças de status/permissão têm efeito na próxima requisição.

Se a interface e o backend forem de origens distintas, validar suporte do navegador e política de cookies; CORS deve permitir somente a origem aprovada e credenciais, nunca `*`. Não migrar silenciosamente a sessão para localStorage ou parâmetros de URL. Sem cookie funcional validado, integração de login permanece bloqueada.

Requisições mutáveis exigem Origin/Referer confiável, JSON e token CSRF em `X-CSRF-Token`. O CSRF é vinculado à sessão (somente seu hash armazenado) e entregue em JSON por login/sessão para memória do frontend. Cookies HttpOnly sozinhos e CORS sozinhos não substituem CSRF. Login e demais operações sem sessão também verificam origem e formato do conteúdo.

OWNER/ADMIN são lidos da associação do usuário ao participante da Resenha Campo 5; nunca de campos enviados pelo cliente. Categoria financeira permanece separada. ADMIN não promove privilégios, altera titularidade ou credenciais. Financeiro geral somente OWNER/ADMIN; jogador consulta seus próprios pagamentos. Ricardo precisa ser vinculado à identidade verificada do responsável numa etapa aprovada; o nome exibido não concede OWNER.

## 5. Endpoints PROPOSTOS, não existentes

Base de proposta: `https://n8n.saintsolution.com.br/webhook/jogolindo/v1`. Os caminhos precisam de aprovação e implementação; não foram chamados ou adicionados ao cliente HTTP. Nenhum link abaixo está ativo por esta entrega.

Todos os corpos JSON são limitados em tamanho e validados por campos permitidos. Respostas não contêm senha/hash/CPF completo/token de sessão. Cabeçalhos: `Cache-Control: no-store`, HTTPS, `Referrer-Policy: no-referrer` nas páginas de autenticação.

| Método e caminho | Entrada JSON | Resposta e regra |
| --- | --- | --- |
| POST `/auth/convites/validar` | `{token}` | 200 `{valido:true,categoria,pelada_nome,expira_em}`; 400 `{erro:{codigo:"TOKEN_INVALIDO_OU_EXPIRADO"}}`. Somente metadados não sensíveis, sem consumo do token. |
| POST `/auth/senha/criar` | `{convite_token,nome,apelido,cpf,telefone,email,senha}` | 201 `{cadastro_concluido:true,status:"pendente_email"}`; não inicia sessão nem libera conta antes da confirmação de e-mail. Valida convite, correspondência do destinatário, CPF e duplicação, cria identidade/vínculo e consome convite uma única vez. Não aceita papel, aptidão, valor ou ID Asaas do cliente. |
| POST `/auth/login` | `{email,senha}` | 200 `{usuario:{usuario_id,nome,apelido,categoria,papel_administrativo},sessao:{expira_em},csrf_token}` e Set-Cookie; 401 genérico. Nunca retornar o token de sessão em JSON. |
| GET `/auth/sessao` | Cookie, sem corpo | 200 com mesmo DTO público de usuário/sessão e CSRF; 401 para sessão ausente, expirada, revogada ou usuário bloqueado. Não estender o limite absoluto. |
| POST `/auth/logout` | Cookie + CSRF, sem dados de usuário | 204, revoga sessão e expira cookie; comportamento idempotente para sessão já ausente/revogada. |
| POST `/auth/senha/recuperar` | `{email}` | Sempre 202 `{mensagem:"Se houver uma conta elegível, enviaremos as instruções."}` para email sintaticamente válido; envio assíncrono, não revelar existência/status do usuário. |
| POST `/auth/senha/redefinir` | `{token,nova_senha}` | 200 `{senha_redefinida:true}`; consome token válido, substitui hash e revoga sessões e outros tokens de recuperação. Não inicia sessão automaticamente. |

Erros padronizados: `{erro:{codigo,mensagem}}`. 400 inválido/token expirado; 401 sessão/login inválido; 403 sem permissão/CSRF inválido; 429 com Retry-After; 503 indisponibilidade/estado em recuperação. Erros de cadastro não devem revelar detalhes de CPF ou outras contas. Não retornar mensagens de bibliotecas, stack traces ou valores submetidos.

Convite: 72h, token aleatório 256 bits; recuperação: 15min, uso único. Uma nova recuperação invalida as anteriores. Link de convite/recuperação usa fragmento `#token=...`, lido em memória e removido com history.replaceState; token enviado no corpo JSON, nunca em query/path/logs. A página não deve carregar recursos de terceiros antes da remoção nem enviar Referer sensível. Confirmar canais de entrega: e-mail do cadastro precisa ser validado por token próprio antes de liberar conta e recuperar senha. Para preservar isso, o cadastro fica `pendente_email`; endpoints de emissão/validação da confirmação de e-mail serão definidos na etapa de cadastro, antes da ativação real. Telefone declarado não é prova de posse do destinatário.

## 6. Planilha privada mínima proposta

NÃO criada. Acesso somente responsável técnico e credencial n8n; sem compartilhamento com jogadores ou ADMIN. Compartilhamento da planilha operacional também deve permanecer restrito. Dados de células recebidos de usuários são escritos como RAW, nunca como fórmula.

| Aba | Colunas propostas |
| --- | --- |
| USUARIOS_AUTH | usuario_id, participante_id, email_normalizado, senha_hash, algoritmo, status, cpf_hmac, criado_em, atualizado_em |
| TOKENS_AUTH | token_hash, usuario_id, convite_id, finalidade, destinatario_hmac, expira_em, utilizado_em, revogado_em |
| SESSOES | sessao_hash, usuario_id, csrf_hash, criado_em, ultima_atividade_em, expira_em, revogado_em |
| LIMITES_AUTH | chave_hmac, acao, janela_inicio_em, contador, bloqueado_ate_em |
| OPERACOES_AUTH | operacao_id, tipo, sujeito_hmac, estado, criado_em, atualizado_em |

As três abas iniciais mantêm os campos solicitados. Complementos são necessários para vínculo, inatividade, revogação de tokens, proteção contra abuso e recuperação de operações parciais. IDs e finalidade distinguem convite, confirmação de e-mail e recuperação. Não duplicar tokens entre CONVITES e TOKENS_AUTH: operacional guarda metadados; a privada guarda o hash. Hash/salt de senha nunca é devolvido ao app.

`cpf_hmac`: HMAC-SHA256 de CPF normalizado, com chave persistente protegida no servidor e namespace fixo Resenha Campo 5; o CPF tem espaço pequeno e não deve usar SHA-256 simples para deduplicação. Não armazenar CPF completo nessa planilha. `destinatario_hmac` protege a associação ao destinatário do convite. Chaves de limite podem derivar de e-mail/IP sob HMAC, com retenção curta. Segredos HMAC não ficam no Sheets ou frontend; rotação exige plano para manter a deduplicação.

O CPF completo só transita por TLS para validação/cadastro Asaas, após aprovação da etapa financeira; o cliente não recebe CPF alheio. ID cliente Asaas sempre pertence à conta de Ricardo, obtido pelo backend. Conta ativa, CPF válido, papel e pagamento são verificações distintas.

## 7. Abuso, logs e concorrência

Limites iniciais propostos: login 5 falhas/15min por email e 30 tentativas/15min por IP; recuperação 3/hora por email e 10/hora por IP; convite/cadastro 10/15min por IP. Ajustar com uso real; nunca confiar cegamente em X-Forwarded-For do cliente. Obter IP apenas do proxy confiável. Aplicar limites antes do hash caro e da consulta extensa; conta inexistente faz verificação com hash fictício de mesmo custo para reduzir diferenças de tempo. Camada de limite no proxy existente é desejável, depende de auditoria/aprovação. Contadores no Sheets são proteção do app, não substituem defesa de tráfego volumoso.

Não salvar entradas/saídas completas de execuções de autenticação, inclusive execuções com erro, nem dados fixados ou logs com corpos HTTP, cookies, CPF e tokens. Verificar logging/retenção n8n e proxy antes de testes reais. Auditoria sanitizada guarda somente ação, ID de operação/usuário, horário e resultado.

Sheets não tem unicidade transacional ou compare-and-swap entre essas operações. Ler e depois append não impede duplicação; batchUpdate não é transação entre duas planilhas. Trava em uma célula ou memória de Code node não é mutex distribuído confiável.

Estratégia condicionada à topologia: uma única execução escritora por vez para TODO o domínio de autenticação, incluindo consumo de tokens, contadores, criação de identidades, sessões e vínculos operacionais. Não basta serializar cada endpoint separadamente. Não usar execução manual ou subworkflow paralelo como se respeitasse limite de produção. Em n8n regular com uma única instância, avaliar entrada escritora única e limite de produção 1; isso afeta workflows existentes e só pode ser aprovado após análise. Em múltiplas instâncias/queue, sem mecanismo global comprovado, não declarar segurança de simultaneidade. Não adicionar Redis ou outro serviço para resolver nesta etapa.

`OPERACOES_AUTH` registra intenções/etapas e IDs determinísticos para reprocessamento. Estado incompleto bloqueia conclusão daquele usuário/token (503) até reconciliação serializada. Redefinição marca usuário em alteração antes da troca e revoga sessões antes de reativá-lo. Leituras também rejeitam estado em alteração. Falha parcial nunca deve liberar uma conta ou consumir um token novamente. Somente um escritor e journal não tornam Sheets transacional; recovery e casos de falha precisam ser implementados/testados antes da liberação.

Referência: https://docs.n8n.io/hosting/scaling/concurrency-control/ (limites de produção não abrangem execuções manuais ou subworkflows).

## 8. Plano após aprovação

1. Obter evidências administrativas sanitizadas da versão, topologia e runners. Confirmar domínio do frontend e canal de e-mail existente.
2. Executar probe isolado em homologação aprovada; escolher algoritmo e custo por resultado. Se módulos não existem, apresentar mudança de ambiente para aprovação separada.
3. Aprovar endpoints, DTOs, estado pendente_email/validação de email, política de cookies/CSRF, limites, serialização global e recuperação de falhas.
4. Criar planilha privada e credencial de escopo mínimo somente após autorização.
5. Implementar workflows de homologação e testes com usuários fictícios; nenhuma cobrança Asaas nesta fase.
6. Testar senha, expiração, logout, revogação, token repetido, email não verificado, CSRF/CORS, bloqueio de tentativas, isolamento de dados e papéis OWNER/ADMIN/jogadores.
7. Disparar cadastros/consumos simultâneos e simular falhas entre gravações. Exigir apenas uma conclusão e nenhum acesso indevido.
8. Conectar frontend somente depois de aprovadas as evidências. O transporte atual mantém `credentials: omit` até essa etapa; interface/demo não foi alterada nesta entrega.

## 9. Validação local desta entrega

`node --test tests/crypto-probe.test.mjs`: verificação do procedimento com módulos bloqueados e com crypto do Node local. Isso NÃO comprova crypto, Argon2id ou bcrypt no servidor n8n. Não instalar módulos para transformar um teste local em evidência remota.
