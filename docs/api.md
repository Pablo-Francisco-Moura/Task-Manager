# API

A API é implementada com Hono e exposta pelas rotas do Next.js no prefixo `/api`. A documentação OpenAPI interativa fica em [`/swagger.html`](http://localhost:3000/swagger.html) enquanto a aplicação está em execução.

As rotas que leem ou alteram dados exigem uma sessão válida e aplicam o escopo do workspace e as permissões do usuário.

## Sessões e workspaces

- `POST /api/session/guest` — inicia ou recupera uma sessão de visitante.
- `POST /api/session/account` — cria uma conta.
- `POST /api/session/sign-in` — inicia uma sessão de conta.
- `POST /api/session/sign-out` — encerra a sessão atual.
- `GET /api/session/workspace` — consulta workspace e contexto da sessão.
- `PATCH /api/session/workspace` — troca o workspace ativo.
- `POST /api/session/workspace` — cria um workspace.
- `PATCH /api/session/workspace/:workspaceId` — renomeia um workspace.
- `DELETE /api/session/workspace/:workspaceId` — exclui um workspace permitido.

## Membros e convites

- `GET /api/session/workspace/:workspaceId/members` — lista membros e projetos visíveis.
- `PUT /api/session/workspace/:workspaceId/members/:userId/projects` — atualiza acesso aos projetos.
- `DELETE /api/session/workspace/:workspaceId/members/:userId` — remove um membro.
- `GET /api/session/workspace/:workspaceId/invites` e `POST /api/session/workspace/:workspaceId/invite` — lista convites enviados e convida por username.
- `GET /api/session/workspace/invites` — lista convites recebidos.
- `PATCH /api/session/workspace/invites/:inviteId/read` — marca um convite como lido.
- `POST /api/session/workspace/invites/:inviteId/accept` — aceita um convite.
- `POST /api/session/workspace/invites/:inviteId/decline` — recusa um convite.
- `DELETE /api/session/workspace/invites/:inviteId` — revoga um convite enviado.

## Projetos e atividade

- `GET /api/project` — lista projetos disponíveis no workspace.
- `POST /api/project` — cria um projeto.
- `PATCH /api/project/:id` — atualiza um projeto.
- `DELETE /api/project/:id` — exclui um projeto permitido.
- `GET /api/project/:projectId/activity` — lista atividade do projeto.
- `GET /api/project/:projectId/activity/unread-count` — consulta atividades não lidas de outras pessoas.
- `POST /api/project/:projectId/activity/read` — marca como lida até `activityId` enviado no corpo.
- `POST /api/project/:projectId/comments` — cria um comentário.
- `PATCH /api/project/:projectId/activity/:activityId` — atualiza um comentário permitido.
- `DELETE /api/project/:projectId/activity/:activityId` — remove ou oculta um comentário permitido.

## Tarefas

- `GET /api/task?projectId=:id` — lista tarefas de um projeto acessível.
- `POST /api/task` — cria uma tarefa.
- `PATCH /api/task/:id` — atualiza uma tarefa.
- `DELETE /api/task/:id` — exclui uma tarefa.
- `PATCH /api/task/reorder` — atualiza a ordem das tarefas por status.

Schemas, limites e formatos detalhados dos payloads estão descritos na documentação OpenAPI gerada a partir dos schemas compartilhados de validação.
