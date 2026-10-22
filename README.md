# JogoLindo — Resenha Campo 5

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

Dados simulados e temporários; Ricardo é um perfil demonstrativo, sem sessão real. Backend previsto: n8n + Google Sheets; financeiro: Asaas. Nenhum endpoint de autenticação está conectado e não há cobranças reais nesta interface.

A proposta de autenticação e o procedimento criptográfico isolado estão em `docs/n8n/`. Os scripts SQL antigos são preservados somente como histórico.
