/** @jest-environment node */
import { GET } from '../app/api/cotacao/route'; // Ajuste o caminho conforme sua pasta

describe('Integração e Dublê de Teste — API de Cotações (Brapi)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = { ...originalEnv, BRAPI_KEY: 'token-teste-123' };
    global.fetch = jest.fn();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('deve retornar 400 quando o parâmetro ticker não for informado', async () => {
    // Preparar
    const req = new Request('http://localhost:3000/api/cotacao');

    // Agir
    const response = await GET(req);
    const body = await response.json();

    // Conferir
    expect(response.status).toBe(400);
    expect(body).toEqual({ erro: 'Ticker não informado' });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('deve retornar 500 quando BRAPI_KEY não estiver configurada', async () => {
    // Preparar
    delete process.env.BRAPI_KEY;
    const req = new Request('http://localhost:3000/api/cotacao?ticker=PETR4');

    // Agir
    const response = await GET(req);
    const body = await response.json();

    // Conferir
    expect(response.status).toBe(500);
    expect(body).toEqual({ erro: 'Chave da API não configurada' });
  });

  test('deve retornar 200 e o objeto data completo com results quando a Brapi responder com sucesso', async () => {
    // Preparar (Dublê da resposta da Brapi)
    const mockBrapiPayload = {
      results: [{ symbol: 'PETR4', regularMarketPrice: 38.5 }],
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      status: 200,
      json: async () => mockBrapiPayload,
    });
    const req = new Request('http://localhost:3000/api/cotacao?ticker=PETR4');

    // Agir
    const response = await GET(req);
    const body = await response.json();

    // Conferir
    expect(response.status).toBe(200);
    expect(body).toEqual(mockBrapiPayload);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://brapi.dev/api/v2/stocks/quote?symbols=PETR4',
      expect.objectContaining({
        headers: { Authorization: 'Bearer token-teste-123' },
      })
    );
  });

  test('deve repassar status 429 e cabeçalho Retry-After quando atingir limite de requisições (D-03)', async () => {
    // Preparar (Dublê simulando HTTP 429)
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      status: 429,
      headers: new Headers({ 'Retry-After': '120' }),
    });
    const req = new Request('http://localhost:3000/api/cotacao?ticker=VALE3');

    // Agir
    const response = await GET(req);
    const body = await response.json();

    // Conferir
    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('120');
    expect(body).toEqual({ erro: 'Limite atingido.' });
  });

  test('deve retornar 404 quando o ativo não existir ou results vier vazio', async () => {
    // Preparar (Dublê simulando ativo inexistente)
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      status: 200,
      json: async () => ({ results: [] }),
    });
    const req = new Request('http://localhost:3000/api/cotacao?ticker=INVALIDO99');

    // Agir
    const response = await GET(req);
    const body = await response.json();

    // Conferir
    expect(response.status).toBe(404);
    expect(body).toEqual({ erro: 'Ativo não encontrado ou erro na API' });
  });
});