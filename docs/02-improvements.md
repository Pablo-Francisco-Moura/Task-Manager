# Melhorias

## Confiabilidade e qualidade

### 1. Contratos e erros da API

- [x] Validar tipos, limites e campos aceitos nos payloads.
- [x] Validar IDs como inteiros positivos; rejeitar valores como zero, decimais, expoentes e strings numéricas em campos JSON tipados como número.
- [x] Distinguir entrada inválida (`400`), recurso inexistente (`404`) e erro inesperado (`500`), sem converter qualquer falha do banco em `404`.
- [x] Compartilhar schemas entre a validação das rotas e a documentação OpenAPI, para manter regra e documentação alinhadas.

### 2. Testes confiáveis

- [x] Fazer os testes de criação e listagem exigirem o resultado esperado, sem aceitar status ou quantidades alternativas.
- [x] Isolar o banco entre cada caso de teste para que a ordem de execução não altere os resultados.
- [x] Testar os casos inválidos, os limites dos campos e a montagem da API na rota real do Next.js.

### 3. Interface e acessibilidade

- [ ] Melhorar a hierarquia visual para destacar projeto, tarefa e ações principais.
- [ ] Definir estados de carregamento, vazio, erro e sucesso de forma consistente.
- [ ] Verificar navegação por teclado, foco visível, rótulos, contraste e layouts responsivos.

### 4. Operação reproduzível

- [ ] Criar CI para pull requests que instale dependências pelo lockfile (`npm ci`) e execute verificação de tipos, lint, testes e build.
- [ ] Configurar no workflow um PostgreSQL temporário para os testes, sem usar dados de desenvolvimento.
- [ ] Adicionar health check ao banco e garantir que a aplicação espere até ele estar pronto.
- [ ] Validar build e lint no ambiente de produção e corrigir erros ou warnings que bloqueiem a compilação.

### 5. Renderização e arquitetura do frontend

- [ ] Avaliar quais provedores precisam envolver a aplicação e manter cada um no menor escopo necessário.
- [ ] Manter no servidor o conteúdo que não exige interação e usar componentes cliente apenas para as partes interativas.
