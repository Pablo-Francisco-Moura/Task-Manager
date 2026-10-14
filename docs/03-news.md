# News

## Validar o CI no GitHub Actions

**Objetivo:** confirmar que o workflow existente verifica o projeto corretamente no runner do GitHub.

**Escopo:** validar o workflow em pull requests destinados a `master` e em todo `push` para `master` (incluindo merge de PRs de `dev`). Conferir os logs e corrigir problemas encontrados. O workflow provisiona PostgreSQL e executa `npm ci`, geração do Prisma Client, typecheck, lint, testes e build de produção.

<a id="descricao-opcional"></a>

## Adicionar descrição opcional às tarefas

**Objetivo:** permitir adicionar contexto a tarefas e projetos sem tornar a descrição obrigatória.

**Escopo:** oferecer descrição opcional e anulável em projetos e tarefas, com limite de 2.000 caracteres. Permitir criar, editar, limpar e exibir o campo na interface; validar e documentar os contratos com os schemas Zod/OpenAPI compartilhados. A migration deve preservar registros existentes.

<a id="task-status"></a>

## Adicionar status às tarefas

**Objetivo:** permitir acompanhar o andamento de cada tarefa com os estados `todo`, `in_progress` e `done`.

**Escopo:** adicionar `status` ao modelo `Task` com migration aditiva e valor padrão `todo` para tarefas existentes; validar e documentar os valores na API com os schemas Zod/OpenAPI compartilhados; permitir alterar e exibir o status na interface. Manter a tarefa sem status enviado retrocompatível usando o padrão definido.

<a id="task-priority"></a>

## Adicionar prioridade às tarefas

**Objetivo:** permitir identificar a importância relativa de cada tarefa com `low`, `normal` ou `high`.

**Escopo:** adicionar `priority` ao modelo `Task` com migration aditiva e valor padrão `normal` para tarefas existentes; validar e documentar os valores na API pelos schemas Zod/OpenAPI compartilhados; permitir selecionar e visualizar a prioridade na interface. Criação sem prioridade deve continuar válida.

<a id="task-kanban"></a>

## Exibir tarefas em quadro Kanban nas telas maiores

**Objetivo:** facilitar o acompanhamento visual das tarefas em telas maiores sem alterar a experiência em dispositivos móveis.

**Escopo:** manter a apresentação atual em lista em telas mobile e exibir, em telas maiores, as tarefas do projeto selecionado em colunas correspondentes aos status `todo`, `in_progress` e `done`. Permitir mover tarefas entre colunas e reordená-las manualmente; persistir o status e a posição de cada tarefa na API. Adicionar uma posição ao modelo `Task` com migration que atribua uma ordem inicial consistente às tarefas existentes, e atualizar os schemas Zod/OpenAPI e o endpoint para validar e salvar status e posição. Preservar as operações atuais de criação, edição e exclusão, além da descrição e da prioridade da tarefa. Manter `Project` e `Task` como modelos; as colunas são fixas e derivadas dos status existentes, sem tabela de colunas. A interface deve continuar utilizável por teclado e em diferentes tamanhos de tela.

[Voltar à News](../README.md#news)
