# Desafio Técnico One Investimentos - Formulário de Cadastro de Projetos e Tarefas

## Visão Geral

Este é um desafio técnico full stack que consiste no desenvolvimento de um sistema de cadastro de projetos e tarefas. A aplicação deve permitir que os usuários criem projetos e adicionem tarefas relacionadas a cada projeto.

## Tecnologias Utilizadas

- **Frontend:** [Next.js](https://nextjs.org/docs)
- **Backend:** API Routes com [Hono](https://hono.dev/docs/)
- **Banco de Dados:** [PostgreSQL](https://www.postgresql.org/docs/) (via [Prisma ORM](https://www.prisma.io/docs))
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/docs)
- **Containerização:** [Docker](https://docs.docker.com/) e [Docker Compose](https://docs.docker.com/compose/)

## Estrutura do Banco de Dados

A estrutura do banco de dados é baseada em duas entidades: **Project** e **Task**.

```mermaid
erDiagram
    PROJECT {
        int id PK "Auto increment"
        string name "Nome do projeto"
    }

    TASK {
        int id PK "Auto increment"
        string name "Nome da tarefa"
        int projectId FK "Referência ao projeto"
    }

    PROJECT ||--o{ TASK : "possui"
```

```prisma
model Project {
  id   Int    @id @default(autoincrement())
  name String

  tasks Task[]

  @@map("projects")
}

model Task {
  id   Int    @id @default(autoincrement())
  name String

  projectId Int
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@map("tasks")
}
```

## Desafio

### Especificação do Projeto

Desenvolver um sistema full stack de gerenciamento de projetos e tarefas utilizando Next.js, Hono e PostgreSQL. O sistema deve permitir operações CRUD completas em projetos e suas respectivas tarefas, com interface responsiva e arquitetura escalável. Os projetos possuem relacionamento one-to-many com tarefas, garantindo integridade referencial através de cascata na exclusão.

### Checklist de Entrega

**Backend**

- [x] API para criação de projetos
- [x] API para listagem de projetos
- [x] API para exclusão de projetos
- [x] API para criação de tarefas vinculadas a projetos
- [x] API para listagem de tarefas por projeto
- [x] API para exclusão de tarefas

**Frontend**

- [ ] Interface para cadastro de projetos
- [x] Interface para visualização/listagem de projetos
- [ ] Interface para cadastro de tarefas por projeto
- [ ] Interface para visualização/listagem de tarefas associadas a projetos
- [ ] Funcionalidade de exclusão de projetos e tarefas

### Requisitos Técnicos

- Utilizar Next.js para o frontend
- Implementar API Routes com Hono
- Utilizar Prisma ORM para manipulação do banco de dados PostgreSQL
- Criar uma interface intuitiva e responsiva
- Docker e Docker Compose são necessários para a execução do ambiente de desenvolvimento

## Instruções de Instalação

1. Clone este repositório.
2. Acesse o diretório do projeto:
   ```sh
   cd desafio-tecnico-one-fullstack
   ```
3. Instale as dependências:
   ```sh
   npm install
   ```
4. Configure as variáveis de ambiente:
   Crie os arquivos de ambiente `.env` e `.env.test` seguindo as orientações em `.env.example`:

   ```env
    DATABASE_URL="postgresql://POSTGRES_USER:POSTGRES_PASSWORD@localhost:5432/dev_db" # only in .env
    DATABASE_URL="postgresql://POSTGRES_USER:POSTGRES_PASSWORD@localhost:5432/test_db" # only in .env.test
    POSTGRES_USER=
    POSTGRES_PASSWORD=
    POSTGRES_DB= dev_db # only in .env
    POSTGRES_DB= test_db # only in .env.test
   ```

5. **Certifique-se de que o Docker e o Docker Compose estão instalados em seu sistema.**
6. Execute o docker do banco de dados da aplicação:
   ```sh
   docker compose up -d
   ```
7. Execute as migrações do banco de dados:
   ```sh
   npm run migrate
   ```
8. (Opcional) Execute o comando de seed para preencher o banco com algumas informações iniciais:
   ```sh
   npm run db:seed
   ```
9. (Opcional) Execute o comando de teste:
   ```sh
   npm run test
   ```
10. Inicie o servidor:
    ```sh
    npm run dev
    ```

## Estrutura do Projeto

```
/desafio-tecnico-one-fullstack
├── prisma/                     # Esquema do banco de dados
├── src
    ├── server/                 # API Routes Hono
    ├── app/                    # Rotas do Next.js
    ├── components/             # Componentes reutilizáveis
    ├── constants/              # Constantes da aplicação
    ├── hooks/                  # React hooks customizados
    ├── lib/                    # Implementação de bibliotecas da aplicação
    ├── screens/                # Componentes de telas da aplicação
    ├── utils/                  # Funções de utilidades
├── tests/                      # Configuração de testes
├── .env                        # Variáveis de ambiente
├── .env.test                   # Variáveis de ambiente de teste
├── compose.yaml                # Compose do docker da base de dados
├── tailwind.config.ts          # Configuração tailwind
├── vitest.config.ts            # Configuração vitest
├── package.json                # Dependências do projeto
└── README.md                   # Documentação do projeto

```

## Endpoints da API

- `GET /api/project` - Lista todos os projetos
- `POST /api/project` - Cria um novo projeto

## Considerações

- Utilize boas práticas de desenvolvimento e organização de código.
- Documente claramente qualquer decisão arquitetural relevante.
- O reset/migração do banco de dados de testes foi centralizado no script de teste (`npm run test`) para evitar conflitos e duplicidade de comandos, garantindo que o ambiente de testes seja sempre inicializado de forma consistente.

---

Boa sorte no desafio! 🚀
