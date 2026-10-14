# News

## Validar o CI no GitHub Actions

**Objetivo:** confirmar que o workflow existente verifica o projeto corretamente no runner do GitHub.

**Escopo:** validar o workflow em pull requests destinados a `master` e em todo `push` para `master` (incluindo merge de PRs de `dev`). Conferir os logs e corrigir problemas encontrados. O workflow provisiona PostgreSQL e executa `npm ci`, geração do Prisma Client, typecheck, lint, testes e build de produção.

