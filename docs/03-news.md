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

<a id="task-due-time"></a>

## Adicionar horário opcional ao prazo da tarefa

**Objetivo:** permitir definir a hora local de vencimento sem alterar o significado dos prazos existentes, que continuam sendo datas sem horário.

**Escopo:** adicionar `dueAt` como instante UTC nullable em migration aditiva; manter `dueDate` para registros e clientes que usam apenas data. A interface aceita hora opcional no fuso local do navegador, a API valida timestamps com offset e normaliza o instante, e listas/formulários mostram horário apenas quando informado. Editar uma tarefa sem hora preserva o comportamento de data; remover o prazo limpa ambos os campos.

<a id="guest-workspace"></a>

## Adicionar identidade guest e isolamento por workspace

**Objetivo:** permitir o uso da aplicação sem cadastro, mantendo os dados de cada visitante isolados no servidor.

**Escopo:** `POST /api/session/guest` cria ou reutiliza um usuário guest, um workspace pessoal e a membership `owner`. O navegador recebe um token aleatório em cookie `HttpOnly`, `SameSite=Lax` e `Secure` em produção; somente o hash do token é persistido. As rotas de projeto e tarefa exigem sessão válida e membership, e limitam leituras e escritas ao workspace da sessão. O prazo configurado para a sessão é de 30 dias.

<a id="account-workspaces"></a>

## Adicionar contas e múltiplos workspaces

**Objetivo:** permitir que a pessoa crie uma conta e organize projetos e tarefas em workspaces próprios, mantendo a opção de uso como visitante.

**Escopo:** permitir cadastro com login e senha, e-mail opcional, e autenticação por login ou e-mail. Após entrar na conta, permitir criar, trocar, renomear e excluir workspaces, respeitando a membership e o papel de owner no servidor. Projetos e tarefas da conta são persistidos e consultados no workspace ativo; dados locais só são importados após confirmação explícita. O encerramento da sessão revoga os tokens e retorna a aplicação ao fluxo de visitante.

[Voltar à News](../README.md#news)
