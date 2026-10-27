# Modelo de dados

O banco PostgreSQL é gerenciado pelo Prisma. Migrations versionadas estão em `prisma/migrations` e são aplicadas automaticamente no startup do app Docker.

```mermaid
erDiagram
   USER {
      uuid id PK
      string displayName
      string username UK
      string email UK
      string passwordHash
      UserKind kind
      datetime createdAt
      datetime updatedAt
   }

   SESSION {
      uuid id PK
      uuid userId FK
      uuid workspaceId FK
      string tokenHash UK
      datetime expiresAt
      datetime revokedAt
      datetime createdAt
      datetime lastSeenAt
   }

   WORKSPACE {
      uuid id PK
      string name
      WorkspaceKind kind
      datetime createdAt
      datetime updatedAt
   }

   WORKSPACE_MEMBER {
      uuid workspaceId PK, FK
      uuid userId PK, FK
      WorkspaceRole role
      datetime joinedAt
   }

   PROJECT {
      int id PK
      string name
      string description
      uuid workspaceId FK
      uuid createdById FK
      datetime createdAt
      datetime updatedAt
   }

   PROJECT_MEMBER {
      int projectId PK, FK
      uuid userId PK, FK
      WorkspaceRole role
      datetime joinedAt
   }

   TASK {
      int id PK
      string name
      string description
      date dueDate
      datetime dueAt
      TaskStatus status
      TaskPriority priority
      int position
      int projectId FK
      uuid createdById FK
      datetime createdAt
      datetime updatedAt
   }

   WORKSPACE_INVITE {
      int id PK
      uuid workspaceId FK
      uuid createdById FK
      uuid targetUserId FK
      WorkspaceInviteStatus status
      int[] projectIds
      datetime expiresAt
      datetime readAt
      datetime createdAt
      datetime updatedAt
   }

   PROJECT_ACTIVITY {
      int id PK
      int projectId FK
      int taskId FK
      uuid actorId FK
      string actorName
      ProjectActivityType type
      string taskName
      string content
      json details
      boolean isDeleted
      datetime createdAt
      datetime updatedAt
   }

   USER ||--o{ SESSION : owns
   WORKSPACE ||--o{ SESSION : scopes
   USER ||--o{ WORKSPACE_MEMBER : joins
   WORKSPACE ||--o{ WORKSPACE_MEMBER : contains
   USER ||--o{ PROJECT : creates
   USER ||--o{ TASK : creates
   USER ||--o{ PROJECT_MEMBER : joins
   PROJECT ||--o{ PROJECT_MEMBER : grants
   WORKSPACE ||--o{ PROJECT : contains
   WORKSPACE ||--o{ WORKSPACE_INVITE : contains
   USER ||--o{ WORKSPACE_INVITE : creates
   USER ||--o{ WORKSPACE_INVITE : receives
   PROJECT ||--o{ PROJECT_ACTIVITY : logs
   TASK o|--o{ PROJECT_ACTIVITY : relates
   USER ||--o{ PROJECT_ACTIVITY : acts
   PROJECT ||--o{ TASK : contains
```

## Isolamento e acesso

- Cada workspace contém seus projetos e memberships.
- Sessões identificam a pessoa e o workspace ativo.
- Owners administram o workspace e os convites.
- Membros recebem acesso explícito aos projetos compartilhados.
- A API verifica essas relações no servidor antes de retornar ou alterar dados.
