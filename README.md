# Task Manager

Aplicação para organizar projetos e tarefas, acompanhar prazos e colaborar com outras pessoas em workspaces compartilhados.

## Funcionalidades

- Uso como visitante ou com conta; workspaces pessoais e compartilhados.
- Projetos e tarefas com descrição, status, prioridade e prazo opcional.
- Quadros de tarefas com busca, filtros e reordenação por status.
- Convites por username e permissões de acesso por projeto.
- Chat do projeto com comentários e histórico de atividade.
- Interface responsiva em português e inglês, com temas claro e escuro.

## Início rápido

Requisitos: Docker e Docker Compose.

Na primeira execução, crie o arquivo de ambiente e inicie os serviços:

```sh
cp .env.example .env
docker compose up --build -d
```

Se o `.env` já existir, não o sobrescreva. Confirme que `DATABASE_URL` aponta para o banco desejado. O Compose inicia o PostgreSQL, aguarda o banco ficar saudável, aplica migrations pendentes e inicia a aplicação.

Abra [http://localhost:3000](http://localhost:3000). Para parar os serviços sem apagar os dados:

```sh
docker compose down
```

O volume do banco é preservado. Para remover também os dados persistidos, seria necessário excluir o volume explicitamente.

## Documentação

- [Configuração, desenvolvimento e testes](docs/development.md)
- [Funcionalidades e colaboração](docs/features.md)
- [Endpoints da API](docs/api.md)
- [Modelo de dados](docs/data-model.md)
- [Documentação interativa da API](http://localhost:3000/swagger.html) (com a aplicação em execução)

## Tecnologias

- Next.js e React
- Hono para a API
- PostgreSQL e Prisma
- Material UI e Tailwind CSS
- Vitest para testes

## Estrutura

```text
src/app/          Rotas Next.js e API
src/components/   Componentes de interface
src/screens/      Telas da aplicação
src/server/       Rotas e regras da API
src/types/        Tipos compartilhados
prisma/           Schema e migrations
docs/             Guias do projeto
```
