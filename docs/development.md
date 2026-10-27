# Desenvolvimento

## Requisitos

- Node.js 20 ou compatível com a imagem Docker do projeto
- Docker e Docker Compose para o ambiente conteinerizado

## Docker

Na primeira execução:

```sh
cp .env.example .env
docker compose up --build -d
```

Não copie o exemplo por cima de um `.env` existente. A aplicação recebe `DATABASE_URL` desse arquivo; dentro do contêiner, hosts loopback (`localhost`, `127.0.0.1`) são convertidos para o hostname do serviço `db`. Outros hosts permanecem inalterados.

O serviço da aplicação espera o healthcheck do PostgreSQL, gera o Prisma Client e aplica migrations pendentes antes de iniciar o Next.js. Consulte os logs e o estado dos serviços com:

```sh
docker compose ps
docker compose logs -f app
```

Para encerrar sem apagar os dados do banco:

```sh
docker compose down
```

O volume `pg-data` é persistente. Não remova esse volume se precisar conservar os dados locais.

## Desenvolvimento no host

Instale as dependências e configure os ambientes de desenvolvimento e teste:

```sh
npm ci
cp .env.example .env
cp .env.test.example .env.test
```

O `.env.example` usa `dev_db`; o `.env.test.example` usa `test_db`. Inicie o Next.js no host com:

```sh
npm run dev
```

Para trabalhar no banco via Docker, inicie o serviço `db` e garanta que o `.env` usado no host tenha uma URL que aponte para `localhost:5432`.

## Qualidade e testes

```sh
npm run typecheck
npm run lint
npm test
```

O script de testes aplica migrations ao banco de teste antes de executar Vitest. Confirme sempre que `.env.test` aponta para `test_db`, nunca para dados de produção.

## Migrations e seed

O contêiner aplica migrations pendentes durante o startup. Para executá-las manualmente no banco apontado por `DATABASE_URL`:

```sh
npm run migrate:deploy
```

Revise o destino antes de executar. Em produção, configure `DATABASE_URL` no ambiente de deploy e aplique migrations separadamente; não use o banco local de desenvolvimento para dados de produção.

Para carregar dados de exemplo no banco conectado ao serviço `app`:

```sh
docker compose exec app npm run db:seed
```

## Cache do Next.js no Docker

Para limpar somente o cache de desenvolvimento e reiniciar o app, sem apagar o banco:

```sh
npm run dev:docker:clean
```
