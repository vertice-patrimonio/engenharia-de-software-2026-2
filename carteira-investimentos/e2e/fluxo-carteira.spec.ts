import { test, expect } from "@playwright/test";

test.describe("Fluxo Completo E2E — Autenticação, Dashboard e Transações", () => {
  test("deve cadastrar, logar, registrar transação e validar persistência", async ({
    page,
  }) => {
    const emailUnico = `usuario_${Date.now()}@teste.com`;
    const ativosMock = [
      {
        id: "ativo-1",
        ticker: "PETR4",
        nome: "Petrobras PN",
        tipo: "Ação",
      },
    ];
    const operacoesMock: Array<{
      id: string;
      carteira_id: string;
      ativo_id: string;
      tipo: "COMPRA" | "VENDA";
      quantidade: number;
      preco_unitario: number;
      taxas: number;
      data_operacao: string;
    }> = [];

    // Mock das rotas de API no navegador para o ambiente CI sem PostgreSQL
    await page.route("**/api/cotacao*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          results: [
            {
              symbol: "PETR4",
              longName: "Petrobras PN",
              regularMarketPrice: 38.5,
              regularMarketChange: 1.25,
              regularMarketChangePercent: 3.36,
              regularMarketVolume: 45200000,
              currency: "BRL",
            },
          ],
        }),
      });
    });

    await page.route("**/api/auth/cadastro", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          usuario: {
            id: "user-1",
            nome: "Investidor E2E",
            email: emailUnico,
          },
        }),
      });
    });

    await page.route("**/api/auth/login", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          usuario: {
            id: "user-1",
            nome: "Investidor E2E",
            email: emailUnico,
          },
        }),
      });
    });

    await page.route("**/api/usuarios", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "user-1",
          nome: "Investidor E2E",
          email: emailUnico,
          perfil_investidor: "Moderado",
        }),
      });
    });

    await page.route("**/api/ativos", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ativosMock),
      });
    });

    await page.route("**/api/operacoes", async (route) => {
      if (route.request().method() === "POST") {
        const body = route.request().postDataJSON();
        const novaOp = {
          id: `op-${operacoesMock.length + 1}`,
          carteira_id: "carteira-1",
          ativo_id: body.ativoId,
          tipo: body.tipo,
          quantidade: Number(body.quantidade),
          preco_unitario: Number(body.precoUnitario),
          taxas: Number(body.taxas || 0),
          data_operacao: body.dataOperacao,
        };
        operacoesMock.push(novaOp);
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(novaOp),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(operacoesMock),
      });
    });

    await page.route("**/api/investimentos", async (route) => {
      const totalInvestido = operacoesMock.reduce(
        (acc, op) => acc + op.quantidade * op.preco_unitario + op.taxas,
        0,
      );
      const investimentos =
        operacoesMock.length > 0
          ? [
              {
                id: "inv-1",
                ativo_id: "ativo-1",
                quantidade: operacoesMock.reduce(
                  (acc, op) => acc + op.quantidade,
                  0,
                ),
                valor_investido: totalInvestido,
              },
            ]
          : [];

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          investimentos,
          totalInvestido,
          quantidadeAtivos: investimentos.length,
        }),
      });
    });

    // 1. Cadastro
    await page.goto("/cadastro");
    await page.getByPlaceholder("Nome Completo").fill("Investidor E2E");
    await page.getByPlaceholder("CPF").fill("123.456.789-00");
    await page.getByPlaceholder("E-mail").fill(emailUnico);
    await page
      .getByPlaceholder("Crie uma Senha (mín. 8 caracteres)")
      .fill("SenhaTeste@123");
    await page.getByRole("button", { name: /cadastrar/i }).click();

    // 2. Dashboard Consolidado + Card de Cotação ao Vivo
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText("Patrimônio Total Consolidado")).toBeVisible();
    await expect(page.getByText("Investidor E2E")).toBeVisible();
    await expect(page.getByText(/R\$\s?38,50/)).toBeVisible();

    // 3. Login com o usuário cadastrado
    await page.goto("/login");
    await page.getByPlaceholder("seuemail@exemplo.com.br").fill(emailUnico);
    await page.getByPlaceholder("••••••••••••").fill("SenhaTeste@123");
    await page.getByRole("button", { name: /entrar/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // 4. Registrar operação em /transacoes e validar persistência
    await page.goto("/transacoes");
    await expect(
      page.getByRole("heading", { name: "Transações" }),
    ).toBeVisible();
    await expect(page.getByText("Total movimentado")).toBeVisible();
    await expect(page.getByText("Exibindo 0 de 0 transações")).toBeVisible();

    await page.getByRole("button", { name: /nova transação/i }).click();
    await page.getByPlaceholder("Ex: 10").fill("2");
    await page.getByPlaceholder("Ex: 35.50").fill("50");
    await page.getByRole("button", { name: /^registrar$/i }).click();

    await expect(page.getByText("Exibindo 1 de 1 transações")).toBeVisible();

    // 5. Persistência após recarregar a página (F5)
    await page.reload();
    await expect(page.getByText("Exibindo 1 de 1 transações")).toBeVisible();

    // 6. Validar saldo atualizado no Dashboard
    await page.goto("/dashboard");
    await expect(page.getByText(/R\$\s?100,00/).first()).toBeVisible();

    // 7. Perfil do Investidor
    await page.goto("/perfil");
    await expect(page).toHaveURL(/.*\/perfil/);
    await expect(page.getByRole("heading", { name: /perfil/i })).toBeVisible();
  });
});
