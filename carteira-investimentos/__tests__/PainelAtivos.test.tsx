/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import PainelAtivos from '@/components/PainelAtivos';

describe('Componente PainelAtivos', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve exibir o estado de carregamento antes da resposta da API', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<PainelAtivos />);

    expect(screen.getByText('Carregando cotações ao vivo...')).toBeInTheDocument();
  });

  it('deve renderizar os cards dos ativos quando a API responde 200 com results', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            symbol: 'PETR4',
            longName: 'Petrobras PN',
            regularMarketPrice: 38.5,
            regularMarketChange: 1.2,
            regularMarketChangePercent: 3.22,
          },
          {
            symbol: 'VALE3',
            longName: 'Vale ON',
            regularMarketPrice: 62.5,
            regularMarketChange: -0.5,
            regularMarketChangePercent: -0.79,
          },
        ],
      }),
    });

    render(<PainelAtivos />);

    await waitFor(() => {
      expect(screen.getByText('PETR4')).toBeInTheDocument();
      expect(screen.getByText('VALE3')).toBeInTheDocument();
      expect(screen.getByText(/R\$\s?38,50/)).toBeInTheDocument();
      expect(screen.getByText(/R\$\s?62,50/)).toBeInTheDocument();
    });
  });

  it('deve exibir mensagem de erro quando a API de cotações falhar', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<PainelAtivos />);

    await waitFor(() => {
      expect(screen.getByText('Não foi possível carregar os ativos.')).toBeInTheDocument();
    });
  });
});