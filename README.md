# Resenha Futebol Campo 5

Interface demonstrativa para a Resenha Futebol Campo 5. React, Vite e TypeScript.

## Desenvolvimento

```sh
npm ci
npm run dev
```

## Verificação

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

## Netlify

Conecte o repositório `Saintsolution/resenhacampo5` e a branch `main`. A configuração está em `netlify.toml`:

- Build: `npm run build`
- Diretório publicado: `dist`
- Node.js: 22
- Redirecionamento SPA para permitir acesso direto a futuras telas.

Não é necessário configurar segredos para publicar a demonstração. `.env.example` contém somente o endereço público confirmado do n8n. Nunca coloque credenciais Google/Asaas ou segredos em variáveis `VITE_*`, pois elas ficam públicas no bundle.

O endereço Netlify será definido pelo responsável pela publicação. Ele deverá ser informado na etapa de autenticação para configurar links de e-mail, CORS e cookies. A publicação da interface não ativa login, envio de e-mail ou recuperação de senha.

## Estado atual

Modo demonstrativo com acesso explícito como organizador, sem senha ou sessão real. Jogadores, convites, pagamentos simulados, despesas e fila são salvos apenas no navegador (localStorage). Use “Reiniciar demonstração” para restaurar os exemplos. Se o armazenamento estiver indisponível, o aplicativo avisa e continua em memória. Backend previsto: n8n + Google Sheets; financeiro: Asaas. Nenhum endpoint de autenticação está conectado e não há cobranças reais nesta interface.

A proposta de autenticação e o procedimento criptográfico isolado estão em `docs/n8n/`. Os scripts SQL antigos são preservados somente como histórico.

## Apresentação prática

Entre como organizador no modo demonstração. Em Convites, crie um exemplo e use “Simular inscrição”. Em Financeiro, confirme um pagamento fictício; em Jogos, inclua o participante na fila. O painel administrativo consolida os resultados. Não informe CPF, senha ou dados reais. Nenhuma ação dessa interface envia mensagens, chama o n8n ou emite cobranças.

### Criação da pelada — etapa A

- `/#/`: entrada com **Criar minha pelada** e **Entrar na minha pelada**.
- `/#/criar-pelada`: dados do organizador → configuração revisável da pelada. Voltar preserva a revisão em memória; cancelar ou recarregar descarta os dados pessoais.
- `/#/entrar`: tela de acesso existente.

O cadastro conjunto está preparado em `src/lib/n8n/bootstrap.ts`: um POST com `{ organizador, pelada }`, header `X-RC5-Ativacao` digitado pelo responsável e `Idempotency-Key` mantida por tentativa. Nenhum segredo é configurado no frontend. Somente após confirmar o endereço na etapa B, preencher `VITE_N8N_BOOTSTRAP_URL`; sem ele, o envio fica indisponível com aviso na tela. Não usar o webhook 09, pois ele ainda grava apenas o OWNER. O backend deverá validar todos os dados e garantir a gravação conjunta/idempotente de JOGADORES + PELADAS, retornando `{ sucesso: true, codigo: "PELADA_CRIADA" }` após concluir a operação. A chave enviada pelo frontend, sozinha, não implementa idempotência no backend.

Nenhum workflow/Sheets foi alterado pela etapa A. Não há gravação ao avançar da primeira para a segunda tela. Dados do cadastro e senha não são persistidos em localStorage/sessionStorage/URL. Teste local: `npm run dev`, abrir a URL indicada pelo Vite e seguir **Criar minha pelada**.

### Primeiro fluxo conectado

O pacote de cadastro conjunto e dashboard está descrito em [README_PRIMEIRO_ACESSO.md](workflows/n8n/README_PRIMEIRO_ACESSO.md). O workflow 13 substitui o 09 na jornada de criação de conta e pelada. O envio conjunto e a consulta de sessão agora têm implementação local de backend; falta configurar/importar e validar no n8n. A URL final de bootstrap permanece dependente da configuração do ambiente.

O fluxo atual do workflow 13 e da sessão 11 utiliza exclusivamente **PELADAS** para os dados da pelada; CONFIG permanece intacta. O cadastro gera os IDs e grava os vínculos de OWNER e pelada no mesmo lote.

### Convites no painel real

O painel agora oferece **Convidar jogador** e a lista de convites. Importação dos workflows 14–16 e teste pelo WhatsApp: [README_CONVITES.md](workflows/n8n/README_CONVITES.md). A abertura pública `/#/convite?token=...` valida o convite e mostra seus dados; inscrição/e-mail/cobrança são a etapa seguinte.
