import { test, expect } from '@playwright/test';

test.describe('Fluxo Completo E2E — Autenticação, Dashboard e Transações', () => {
  test('deve cadastrar, logar, validar o dashboard e filtrar movimentações em /transacoes', async ({ page }) => {
    const emailUnico = `usuario_${Date.now()}@teste.com`;

    // Mock da rota /api/cotacao no navegador para evitar falha de rede externa no E2E
    await page.route('**/api/cotacao*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          results: [
            {
              symbol: 'PETR4',
              longName: 'Petrobras PN',
              regularMarketPrice: 38.5,
              regularMarketChange: 1.25,
              regularMarketChangePercent: 3.36,
              regularMarketVolume: 45200000,
              currency: 'BRL',
            },
          ],
        }),
      });
    });

    // 1. Cadastro
    await page.goto('/cadastro');
    await page.getByPlaceholder('Nome Completo').fill('Investidor E2E');
    await page.getByPlaceholder('CPF').fill('123.456.789-00');
    await page.getByPlaceholder('E-mail').fill(emailUnico);
    await page.getByPlaceholder('Crie uma Senha').fill('SenhaTeste@123');
    await page.getByRole('button', { name: /cadastrar/i }).click();

    // 2. Login
    await expect(page).toHaveURL(/\/login/);
    await page.getByPlaceholder('guilherme@exemplo.com.br').fill(emailUnico);
    await page.getByPlaceholder('••••••••••••').fill('SenhaTeste@123');
    await page.getByRole('button', { name: /entrar/i }).click();

    // 3. Dashboard Consolidado + Card de Cotação ao Vivo
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText('Patrimônio Total Consolidado')).toBeVisible();
    await expect(page.getByText('PETR4 - Petrobras PN')).toBeVisible();
    await expect(page.getByText('R$ 10.000,00')).toBeVisible();
    await expect(page.getByText(/R\$\s?38,50/)).toBeVisible();

    // 4. Histórico e Filtros em /transacoes
    await page.goto('/transacoes');
    await expect(page.getByRole('heading', { name: 'Transações' })).toBeVisible();
    await expect(page.getByText('Total movimentado')).toBeVisible();
    await expect(page.getByText('Exibindo 6 de 6 transações')).toBeVisible();

    // Filtrar por texto ("WEGE3")
    await page.getByPlaceholder('Buscar ativo...').fill('WEGE3');
    await expect(page.getByText('WEG ON')).toBeVisible();
    await expect(page.getByText('Exibindo 1 de 6 transações')).toBeVisible();

    // Limpar busca e filtrar por tipo ("Dividendo")
    await page.getByPlaceholder('Buscar ativo...').fill('');
    await page.getByRole('combobox').selectOption('Dividendo');
    await expect(page.getByText('BBAS3')).toBeVisible();
    await expect(page.getByText('Exibindo 1 de 6 transações')).toBeVisible();

    // 5. Persistência após recarregar a página (F5)
    await page.reload();
    await expect(page.getByText('Exibindo 6 de 6 transações')).toBeVisible();
  });
});