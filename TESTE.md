## Execução

- Suíte: `npm test` (ou `npm run test:coverage`), dentro de `carteira-investimentos/`. Estilo: `npm run lint`.
- Integração contínua: `.github/workflows/teste.yml`, a cada pull request e a cada envio ao `main`. A proteção do `main` exige o check `teste` aprovado.

## Casos e onde são verificados

| ID      | Critério | Verificado por                                                        |
|---------|----------|-----------------------------------------------------------------------|
| CT-01   | HU-01    | Sistema, manual: cadastro de usuário com e-mail válido e senha forte  |
| CT-02   | HU-01    | Sistema, manual: bloqueio de cadastro duplicado ou formato inválido   |
| CT-03   | HU-02    | Sistema, manual: login válido e redirecionamento para `/dashboard`    |
| CT-04   | HU-03    | Unidade: `calculoCarteira.test.ts`, preço médio ponderado             |
| CT-05   | HU-03    | Unidade: `calculoCarteira.test.ts`, posição consolidada e lucro/prejuízo |
| CT-06   | HU-03    | Unidade: `calculoCarteira.test.ts`, valores-limite (carteira vazia/zero) |
| CT-07   | HU-04    | Unidade: `calculoCarteira.test.ts`, venda parcial sem alterar preço médio |
| CT-08   | HU-04    | Unidade: `calculoCarteira.test.ts`, zerar posição após venda total    |
| CT-09   | HU-05    | Integração: `cotacaoApi.test.ts`, resposta 200 e contrato JSON        |
| CT-10   | HU-05    | Integração: `cotacaoApi.test.ts`, resposta 400 sem parâmetro `ticker` |
| CT-11   | HU-05    | Integração: `cotacaoApi.test.ts`, respostas 404 e 500 da Brapi        |
| CT-12   | HU-05    | Integração: `cotacaoApi.test.ts`, resposta 429 e cabeçalho `Retry-After` |

## Fora da automação

- Testes E2E de interface: execução manual nas rotas de autenticação, painel e transações na build da tag.
- Teste de utilidade/usabilidade: manual, com pessoa de fora da equipe avaliando a leitura das cotações e o cadastro de operações.

## Critério de saída

Suíte (`npm run test:coverage`) e estilo (`npm run lint`) verdes no `main`, casos manuais executados na build da tag, nenhum defeito major aberto.
