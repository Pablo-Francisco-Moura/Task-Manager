# Autoavaliação

## Desafio

Projeto para cadastrar projetos e tarefas relacionadas, com operações CRUD, interface responsiva.

O escopo inicial: Demonstrar que eu conseguia conectar interface, API e banco de dados e manter a relação entre projeto e tarefas.

Tecnologias: PostgreSQL, Prisma, Next.js, Hono e Docker.

Além de atender o escopo, foram acrescentados testes de API, edição de registros, documentação OpenAPI/Swagger, internacionalização (português e inglês) e modos (claro e escuro).

## Como o projeto foi construído

- **Front:** Next.js e React, com componentes reutilizáveis, telas separadas e formulários com React Hook Form.
- **API:** Hono montado nas API Routes do Next.js, com rotas distintas para projetos, tarefas e health check.
- **Banco de dados:** PostgreSQL com Prisma; `Project` tem muitas `Task`, e excluir um projeto exclui as tarefas relacionadas por cascata.
- **Estado e consultas:** TanStack Query para buscar dados e Zustand para estado compartilhado, incluindo a seleção de projeto.
- **Estilo:** Tailwind CSS e componentes Material UI.
- **Preferências:** Com i18next e suporte a tema claro/escuro.
- **Testes:** Vitest e testes das rotas usando o banco de dados.
- **Ambiente:** Docker Compose para o banco e a aplicação, com migrations e seed do Prisma.

## O que considero um acerto

1. **Entreguei o fluxo de ponta a ponta.** A aplicação conecta interface, endpoints, banco e regras de relacionamento; não ficou apenas em telas demonstrativas ou endpoints sem consumidor.
2. **Fui ampliando a entrega de forma incremental.** A construção de listagem, criação, exclusão e depois edição, com commits separados para API, integração com hooks e interface.
3. **Organizei responsabilidades em módulos reconhecíveis.** Rotas, hooks e casos de uso do cliente, componentes e telas têm lugares próprios. Componentes `Project` e `Task` também reduziu a concentração de lógica nas listagens.
4. **Realizei manutenções e documentação.** Nos commits mostram as refatorações, tipos compartilhados, README, checklist e documentação da API, além da implementação funcional.
5. **Fui além do pedido.** Fiz testes de API, Swagger, i18n e tema, para demonstrar uma experiência mais completa para o usuário final.
6. **Usei ferramentas adequadas ao problema.** Prisma como ORM para definir o modelo de dados e acessar o PostgreSQL pela API. A chave estrangeira entre Project e Task, com exclusão em cascata, mantém a integridade referencial no banco.

## O que faltou ou ficou superficial

Esta seção descreve oportunidades visíveis do código, algumas podem ter sido decisões conscientes para manter o desafio pequeno, e não necessariamente erros para o escopo original.

### Produto e experiência de uso

- Ao voltar a executar e avaliar o projeto, percebo que o fluxo principal atende ao que foi solicitado: cadastrar e gerenciar projetos e tarefas. Embora eu tenha acrescentado edição, testes, documentação da API, idiomas e temas, essas entregas ampliaram a solução tecnicamente, mas não aprofundaram muito o valor que o produto oferece no uso cotidiano.
- A interface cumpre sua função, mas hoje considero seu visual simples e rígido, com poucos elementos que criem uma identidade própria ou destaquem as informações mais importantes. Eu poderia ter investido mais na hierarquia visual, no acabamento dos componentes e em uma experiência mais clara para os diferentes estados da tela.
- No frontend, o usuário consegue fazer operações básicas, mas há poucas ferramentas para organizar o trabalho. Status da tarefa, prioridade, prazo, busca, filtros e ordenação ajudariam a acompanhar o que precisa ser feito; uma visualização Kanban poderia tornar o andamento do trabalho mais fácil de entender.
- Eu deveria ter pensado não apenas em completar as operações CRUD, mas também em como alguém usaria a aplicação para acompanhar o trabalho ao longo do tempo. Começando por status, prioridade e prazo, acompanhados de filtros simples.

### Contratos e validação da API

- As rotas leem JSON diretamente e validam os campos com verificações simples de truthiness. Isso não define com precisão tipos, limites, campos extras, strings vazias ou mensagens consistentes.
- A conversão de IDs com `Number(...)` não é uma validação completa de inteiro positivo.
- Os blocos `catch` de algumas rotas transformam qualquer falha em `404`. Um erro de banco ou de programação pode, assim, parecer um recurso inexistente.
- O OpenAPI descreve schemas manualmente. Com schemas de validação compartilhados, validação e documentação poderiam derivar do mesmo contrato e divergir menos.

### Confiança nos testes

- Os testes de tarefas aceitam mais de um resultado para alguns cenários. Por exemplo, criação aceita `201` ou `404`, embora o projeto associado seja criado no próprio teste. Isso permite que uma regressão passe sem cumprir o comportamento esperado.
- O teste de listagem aceita comprimentos alternativos e o arquivo de testes de tarefas não limpa os dados entre cada caso. A ordem ou o estado anterior do banco podem influenciar o resultado.
- Os testes chamam as rotas Hono diretamente; isso é útil para integração da API, mas não verifica a montagem real sob a rota do Next.js.

### Domínio e crescimento dos dados

- O modelo tem apenas nome e relação entre projeto e tarefa. Não existem estado, prioridade, prazo, timestamps, responsável, histórico ou regras de acesso.
- `GET /project` retorna todos os projetos e inclui todas as tarefas, sem paginação, filtros ou ordenação. Isso é simples para um exercício, mas não escala bem para conjuntos maiores.
- O comportamento de edição permite alterações parciais na tarefa, mas a validação do payload e a semântica dos campos não estão formalizadas.

### Operação e produto

- O Compose serve ao desenvolvimento, mas a configuração observada não mostra health checks do banco nem espera explícita pela prontidão do serviço antes da aplicação.
- A imagem Docker executa o servidor de desenvolvimento e usa `npm install`; isso não é uma imagem de produção otimizada.
- O README informa os comandos e o fluxo local, mas o repositório não contém workflow em `.github/workflows` para executar qualidade e testes automaticamente em cada alteração.
- Não há autenticação ou autorização. Isso é aceitável para o desafio original, mas impede tratar os dados como privados em um produto multiusuário.
- O layout carrega provedores de cliente na aplicação. Para evolução, vale avaliar cuidadosamente o que precisa ser interativo e o que pode permanecer renderizado no servidor.
- Tailwind e Material UI convivem no projeto. A combinação funciona, mas sem regras de ownership visual pode aumentar duplicação e inconsistência conforme a interface cresce.
