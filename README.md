# Resenha Campo5

Aplicação para organizar peladas, convites, participantes e consultas financeiras. O frontend usa React, TypeScript, Vite e Tailwind CSS; os fluxos operacionais usam n8n, Google Sheets e Asaas.

A versão 01 foi preparada para operação supervisionada em 29/10/2026. Existem funcionalidades conectadas e pagamentos homologados; presença persistente, histórico esportivo, scout e recorrência mensal continuam pendentes. A versão do pacote npm ainda é `0.0.0`; “versão 01” é a identificação de entrega adotada pelo responsável, sem tag de release criada nesta organização.

## Documentação

- [HANDOFF — memorial técnico e continuidade](docs/HANDOFF.md): começar por aqui.
- [CHANGELOG — evolução comprovada](docs/CHANGELOG.md).
- [DECISIONS — decisões e regras](docs/DECISIONS.md).
- [Índice dos relatórios preservados](docs/relatorios/README.md).

## Executar localmente

Usar Node.js 22, conforme a configuração do Netlify, e npm com o lockfile existente.

```sh
npm ci
cp .env.example .env
npm run dev
```

O Vite informa a porta local. **O exemplo de ambiente aponta para o n8n de produção**: abrir a aplicação pode consultar a agenda real; cadastro, convites e inscrições podem gravar e emitir cobrança real. Antes de testar esses fluxos, configurar webhooks e planilha de homologação isolados. Não usar registros reais como fixtures.

Variáveis públicas: `VITE_N8N_BASE_URL`, `VITE_N8N_APP_BASE_URL` e `VITE_N8N_BOOTSTRAP_URL`. A última pertence ao transporte legado de cadastro conjunto, mantido no código; a jornada atual cadastra o OWNER por convite e cria a pelada depois do login. Nenhuma variável `VITE_*` pode conter segredo: seu conteúdo fica público no bundle.

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
```

Na auditoria documental de 29/10/2026, `npm test` executou 98 testes: 96 passaram e dois falharam por expectativas/fixtures desatualizadas. Veja o [estado dos testes](docs/HANDOFF.md#testes-e-validação). Os comandos não comprovam homologação remota.

## Estrutura

| Caminho | Responsabilidade |
| --- | --- |
| `src/components/` | Landing, acesso real, painel, convites, quadro e fichas |
| `src/lib/n8n/` | Contratos e transporte dos endpoints |
| `src/App.tsx`, `src/lib/demo.ts` | Entrada da aplicação e demonstração legada |
| `src/types/`, `src/context/`, `src/screens/` | Modelos e módulos preservados; nem todos integram a jornada atual |
| `tests/` | Testes Node, renderização React e contratos/fluxos locais |
| `workflows/` | Exports, fontes, entregas pontuais e históricos n8n |
| `scripts/` | Preparação local de pacotes; não executar como publicação automática |
| `supabase/migrations/` | Modelo SQL histórico, fora da arquitetura ativa do MVP |
| `docs/` | Memorial, decisões e relatórios |

## Publicação e operação

Site: https://resenhacampo5.netlify.app/. Repositório: `Saintsolution/resenhacampo5`, branch `main`. O Netlify publica automaticamente após push: build `npm run build`, saída `dist`, configuração em `netlify.toml`.

O usuário publica os workflows no n8n. Um JSON local, seu campo `active` ou um build React bem-sucedido não comprovam a versão ativa no servidor. Antes de alterar um fluxo, obter o export atual e conferir endpoints, conexões e credenciais. Preferir correções pontuais nos nós existentes.

Não versionar `.env`, backups, exports privados, tokens ou dados de jogadores. Há arquivos locais não versionados e alterações anteriores à documentação; revisar cada arquivo antes de preparar qualquer commit.
