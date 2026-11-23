import { test, expect } from "@playwright/test";

test.describe("Fluxo Completo E2E — Autenticação, Dashboard e Transações", () => {
  test("deve cadastrar, logar, registrar transação no banco e validar persistência", async ({
    page,
  }) => {
    const emailUnico = `usuario_${Date.now()}@teste.com`;

    // Mock da rota /api/cotacao no navegador para evitar falha de rede externa no E2E
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

    // 1. Cadastro
    await page.goto("/cadastro");
    await page.getByPlaceholder("Nome Completo").fill("Investidor E2E");
    await page.getByPlaceholder("CPF").fill("123.456.789-00");
    await page.getByPlaceholder("E-mail").fill(emailUnico);
    await page.getByPlaceholder("Crie uma Senha").fill("SenhaTeste@123");
    await page.getByRole("button", { name: /cadastrar/i }).click();

    // 2. Dashboard Consolidado + Card de Cotação ao Vivo
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText("Patrimônio Total Consolidado")).toBeVisible();
    await expect(page.getByText("Investidor E2E")).toBeVisible();
    await expect(page.getByText(/R\$\s?38,50/)).toBeVisible();

    // 3. Logout / Login com o usuário recém-criado no banco
    await page.goto("/login");
    await page.getByPlaceholder("guilherme@exemplo.com.br").fill(emailUnico);
    await page.getByPlaceholder("••••••••••••").fill("SenhaTeste@123");
    await page.getByRole("button", { name: /entrar/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // 4. Registrar operação real em /transacoes e validar persistência
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
