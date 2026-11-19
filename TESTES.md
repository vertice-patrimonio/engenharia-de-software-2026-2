# Plano e Rastreabilidade de Testes — Carteira de Investimentos

Este documento descreve a estratégia de testes automatizados, a rastreabilidade entre os requisitos da aplicação e os casos de teste implementados, bem como as instruções para execução local e integração contínua (CI).

---

## 1. Arquitetura e Ferramentas de Teste

| Camada de Teste | Ferramenta / Stack | Diretório | Objetivo |
| :--- | :--- | :--- | :--- |
| **Unidade e Componentes (UI)** | Jest + React Testing Library (RTL) | `__tests__/` | Validar regras de formatação, renderização condicional, estados de carregamento/erro e integração com contratos de dados da API. |
| **Ponta a Ponta (E2E)** | Playwright | `e2e/` | Simular a jornada completa do usuário no navegador real (`/cadastro` → `/login` → `/dashboard` → `/transacoes`), com isolamento de chamadas externas via interceptação de rede (`page.route`). |
| **Qualidade e Estilo** | ESLint | Raiz do projeto | Garantir padronização de código e prevenir erros estáticos antes do merge. |

---

## 2. Casos de Teste Automatizados e Rastreabilidade

### 2.1. Testes de Componentes (`__tests__/`)

* **`__tests__/CardAtivo.test.tsx`**
  * **CT-UI-01:** Renderização correta de ticker (`symbol`), nome da empresa (`longName`) e preço formatado em Real (`BRL`).
  * **CT-UI-02:** Exibição de variação percentual positiva e negativa com estilos visuais correspondentes.
  * **CT-UI-03:** Tratamento seguro de valores ausentes ou opcionais no contrato da Brapi API.

* **`__tests__/PainelAtivos.test.tsx`**
  * **CT-UI-04:** Exibição do estado de carregamento (*loading*) enquanto aguarda resposta de `/api/cotacao`.
  * **CT-UI-05:** Renderização da lista de ativos após resposta bem-sucedida da API mockada.
  * **CT-UI-06:** Exibição de mensagem amigável de erro quando `/api/cotacao` retorna falha HTTP (`!resposta.ok`).

### 2.2. Testes Ponta a Ponta — E2E (`e2e/`)

* **`e2e/fluxo-carteira.spec.ts`**
  * **CT-E2E-01 (Cadastro):** Preenchimento e submissão do formulário em `/cadastro` com redirecionamento para `/login`.
  * **CT-E2E-02 (Autenticação):** Login em `/login` com credenciais válidas e redirecionamento para `/dashboard`.
  * **CT-E2E-03 (Dashboard Consolidado):** Validação dos totalizadores (`Patrimônio Total Consolidado`), tabela de custódia (`PETR4 - Petrobras PN`) e cotações ao vivo via mock da rota `/api/cotacao`.
  * **CT-E2E-04 (Histórico e Filtros de Transações):** Navegação para `/transacoes`, validação dos cards de resumo (`Total movimentado`, `Total em compras`, `Total em vendas`, `Dividendos recebidos`), busca textual por ativo (`WEGE3`), filtro por tipo (`Dividendo`) e persistência após recarregamento (`F5`).

---

## 3. Como Executar Localmente

Entre na pasta da aplicação (`cd carteira-investimentos`) e utilize os comandos abaixo:

```bash
# 1. Instalar dependências (caso ainda não tenha instalado)
npm install

# 2. Executar testes unitários e de componentes (Jest + RTL)
npm test

# 3. Gerar relatório de cobertura de código
npm run test:coverage

# 4. Executar testes Ponta a Ponta (Playwright)
npm run test:e2e

# 5. Verificar regras de lint e estilo
npm run lint
