# Plano e Rastreabilidade de Testes — Carteira de Investimentos

Este documento descreve a estratégia de testes automatizados, a rastreabilidade entre os requisitos da aplicação e os casos de teste implementados, as omissões deliberadas, bem como as instruções para execução local e integração contínua (CI).

---

## 1. Arquitetura e Ferramentas de Teste

| Camada de Teste | Ferramenta / Stack | Diretório | Objetivo |
| :--- | :--- | :--- | :--- |
| **Unidade, Componentes (UI) e Contrato de API** | Jest + React Testing Library (RTL) | `__tests__/` | Validar regras de formatação, renderização condicional, estados de carregamento/erro e respostas HTTP/contratos da API interna. |
| **Ponta a Ponta (E2E)** | Playwright | `e2e/` | Simular a jornada completa do usuário no navegador real (`/cadastro` → `/login` → `/dashboard` → `/transacoes`), com persistência em PostgreSQL e isolamento de chamadas externas via interceptação de rede (`page.route`). |
| **Qualidade e Estilo** | ESLint | Raiz do projeto | Garantir padronização de código e prevenir erros estáticos antes do merge. |

---

## 2. Casos de Teste Automatizados e Rastreabilidade

### 2.1. Testes de Unidade, Componentes e API (`__tests__/`)

- **`__tests__/CardAtivo.test.tsx`**
  - **CT-UI-01:** Renderização correta de ticker (`symbol`), nome da empresa (`longName`) e preço formatado em Real (`BRL`).
  - **CT-UI-02:** Exibição de variação percentual positiva e negativa com estilos visuais correspondentes.
  - **CT-UI-03:** Tratamento seguro de valores ausentes ou opcionais no contrato da Brapi API.

- **`__tests__/PainelAtivos.test.tsx`**
  - **CT-UI-04:** Exibição do estado de carregamento (*loading*) enquanto aguarda resposta de `/api/cotacao`.
  - **CT-UI-05:** Renderização da lista de ativos após resposta bem-sucedida da API mockada.
  - **CT-UI-06:** Exibição de mensagem amigável de erro quando `/api/cotacao` retorna falha HTTP (`!resposta.ok`).

- **`__tests__/cotacaoApi.test.ts`**
  - **CT-API-01:** Retorno de HTTP `500` com mensagem estruturada quando `BRAPI_KEY` não está configurada no ambiente.
  - **CT-API-02:** Tratamento de falha externa (ex.: HTTP `429 Too Many Requests` da Brapi) sem quebrar o servidor.
  - **CT-API-03:** Retorno de HTTP `200` com os dados de cotação formatados conforme o contrato esperado pelo frontend.

### 2.2. Testes Ponta a Ponta — E2E (`e2e/`)

- **`e2e/fluxo-carteira.spec.ts`**
  - **CT-E2E-01 (Cadastro):** Preenchimento e submissão do formulário em `/cadastro` com redirecionamento para `/login`.
  - **CT-E2E-02 (Autenticação):** Login em `/login` com credenciais válidas e redirecionamento para `/dashboard`.
  - **CT-E2E-03 (Dashboard Consolidado):** Validação dos totalizadores (`Patrimônio Total Consolidado`), tabela de custódia (`PETR4 - Petrobras PN`) e cotações ao vivo via mock da rota `/api/cotacao`.
  - **CT-E2E-04 (Histórico e Filtros de Transações):** Navegação para `/transacoes`, validação dos cards de resumo (`Total movimentado`, `Total em compras`, `Total em vendas`, `Dividendos recebidos`), busca textual por ativo (`WEGE3`), filtro por tipo (`Dividendo`) e persistência após recarregamento (`F5`).

---

## 3. Como Executar Localmente

Entre na pasta da aplicação (`cd carteira-investimentos`) e utilize os comandos abaixo:

```bash
# 1. Subir o banco de dados PostgreSQL de teste
docker compose up -d

# 2. Instalar dependências (caso ainda não tenha instalado)
npm install

# 3. Verificar regras de lint e estilo
npm run lint

# 4. Executar testes unitários, de componentes e de API (Jest + RTL)
npm test

# 5. Gerar relatório de cobertura de código
npm run test:coverage

# 6. Executar testes Ponta a Ponta (Playwright)
npm run test:e2e
