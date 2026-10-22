# Estado da integração

Frontend demonstrativo da Resenha Campo 5. Os dados são locais e desaparecem ao recarregar. Ricardo é um perfil ilustrativo, sem sessão ou permissões reais.

O endereço n8n confirmado é https://n8n.saintsolution.com.br. Nenhum endpoint foi definido ou acessado nesta limpeza. `src/lib/n8n/http.ts` fornece apenas transporte HTTP, sem chamadas automáticas ou credenciais. `config.ts` lê somente a URL pública; `.env.example` documenta essa configuração.

As telas de acesso e seleção foram preservadas. O provedor desconectado retorna usuário/sessão nulos e erro explícito em login/cadastro. A criação de outras peladas foi retirada. Não há autenticação implementada nem proteção efetiva de dados de produção nesta demonstração.

Os tipos em `src/types/domain.ts` preservam o modelo anterior como referência, sem garantir correspondência com as colunas do Sheets ou futuros contratos. Nenhum campo de credencial financeira deve fazer parte dos contratos públicos.

Antes de conectar: verificar versão/runners do n8n e suporte real a Argon2id ou bcrypt; definir contratos, cookies/CORS/CSRF, expiração/revogação e limitação de tentativas. O transporte omite cookies enquanto o contrato de sessão não é aprovado. As respostas JSON ainda precisarão de validação específica por endpoint.

Os scripts SQL na pasta histórica de migrações estão preservados, sem uso no MVP. Nenhum recurso remoto foi excluído ou alterado. O SDK antigo foi removido; não é necessário para executar a interface.

## Recuperação local

Tag Git: `recovery-before-supabase-cleanup` (commit `4760566`). Não contém `.env`, ignorado por segurança, nem dependências ou build. Para inspecionar a versão anterior sem alterar os arquivos atuais: `git show recovery-before-supabase-cleanup:src/App.tsx`.

## Verificação

`npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.
Os testes HTTP usam somente fetch simulado, sem acesso a endpoints reais.
