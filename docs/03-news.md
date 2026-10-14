# News

## Validar o CI no GitHub Actions

**Objetivo:** confirmar que o workflow existente verifica o projeto corretamente no runner do GitHub.

**Escopo:** validar o workflow em pull requests destinados a `master` e em todo `push` para `master` (incluindo merge de PRs de `dev`). Conferir os logs e corrigir problemas encontrados. O workflow provisiona PostgreSQL e executa `npm ci`, geração do Prisma Client, typecheck, lint, testes e build de produção.

<a id="descricao-opcional"></a>

## Adicionar descrição opcional às tarefas

**Objetivo:** permitir adicionar contexto a tarefas e projetos sem tornar a descrição obrigatória.

**Escopo:** oferecer descrição opcional e anulável em projetos e tarefas, com limite de 2.000 caracteres. Permitir criar, editar, limpar e exibir o campo na interface; validar e documentar os contratos com os schemas Zod/OpenAPI compartilhados. A migration deve preservar registros existentes.

**Concluída quando:** criação, edição, limpeza, limite máximo e valores inválidos estão cobertos por testes; registros antigos continuam válidos; typecheck, lint, suíte de testes e build passam.

## Adicionar status às tarefas

**Objetivo:** permitir acompanhar o andamento de cada tarefa com os estados `todo`, `in_progress` e `done`.

**Escopo:** adicionar `status` ao modelo `Task` com migration aditiva e valor padrão `todo` para tarefas existentes; validar e documentar os valores na API com os schemas Zod/OpenAPI compartilhados; permitir alterar e exibir o status na interface. Manter a tarefa sem status enviado retrocompatível usando o padrão definido.

**Concluída quando:** migration aplicada sem perda de dados, status padrão válido para tarefas existentes e novas, criação/edição/listagem cobertas por testes, interface permite alterar e identificar o status e o conjunto local de typecheck, lint, testes e build passa. Executar CI remoto no PR/marco de integração, não a cada commit local.

[Voltar à News](../README.md#news)
