import { test, expect } from "@playwright/test";

test.describe("Fluxo Ponta a Ponta — Autenticação e Acesso à Carteira", () => {
  test("deve alternar entre login e cadastro e redirecionar para o dashboard ao autenticar", async ({
    page,
  }) => {
    await page.route("**/api/auth/login", async (route) => {
      await route.fulfill({
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": "vertice_sessao=sessao-teste.assinatura-mock; Path=/",
        },
        body: JSON.stringify({
          usuario: {
            id: "user-123",
            nome: "Investidor Teste",
            email: "teste@vertice.com",
            perfil_investidor: "Moderado",
          },
          carteira: {
            id: "carteira-123",
            nome: "Carteira Principal",
          },
        }),
      });
    });

    await page.route("**/api/carteira**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          carteira: { id: "carteira-123", nome: "Carteira Principal" },
          posicoes: [],
          operacoes: [],
        }),
      });
    });

    await page.route("**/api/operacoes**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ operacoes: [] }),
      });
    });

    await page.route("**/api/ativos**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ativos: [] }),
      });
    });

    await page.goto("/");

    // Verifica estado inicial (Login)
    await expect(
      page.getByRole("heading", { name: "Acessar conta" }),
    ).toBeVisible();

    // Testa alternância para aba de Cadastro
    await page.getByRole("button", { name: "Criar conta" }).click();
    await expect(
      page.getByRole("heading", { name: "Criar nova conta" }),
    ).toBeVisible();
    await expect(page.getByPlaceholder("Ex: Vitor Gabriel")).toBeVisible();

    // Volta para Login e preenche credenciais
    await page.getByRole("button", { name: "Entrar" }).first().click();
    await page.getByPlaceholder("seu@email.com").fill("teste@vertice.com");
    await page.getByPlaceholder("Mínimo de 6 caracteres").fill("123456");

    await page.locator('button[type="submit"]').click();

    // Deve redirecionar para o dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
