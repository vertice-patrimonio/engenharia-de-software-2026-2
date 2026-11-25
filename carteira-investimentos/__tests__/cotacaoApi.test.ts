/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET } from "../app/api/cotacao/route";

describe("Integração e Dublê de Teste — API de Cotações (Brapi)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = { ...originalEnv, BRAPI_KEY: "token-teste-123" };
    global.fetch = jest.fn();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("deve retornar 400 quando o parâmetro ticker não for informado", async () => {
    const req = new NextRequest("http://localhost:3000/api/cotacao");

    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      erro: "Informe pelo menos um ticker em ?ticker=...",
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("deve retornar 500 quando BRAPI_KEY não estiver configurada", async () => {
    delete process.env.BRAPI_KEY;
    const req = new NextRequest(
      "http://localhost:3000/api/cotacao?ticker=PETR4",
    );

    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      erro: "BRAPI_KEY não configurado no servidor.",
    });
  });

  test("deve retornar 200 com results e precoAtual quando a Brapi responder com sucesso", async () => {
    const ativoMock = {
      symbol: "PETR4",
      regularMarketPrice: 38.5,
      currency: "BRL",
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ results: [ativoMock] }),
    });

    const req = new NextRequest(
      "http://localhost:3000/api/cotacao?ticker=PETR4",
    );

    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.results).toEqual([ativoMock]);
    expect(body.ticker).toBe("PETR4");
    expect(body.precoAtual).toBe(38.5);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://brapi.dev/api/quote/PETR4",
      expect.objectContaining({
        headers: { Authorization: "Bearer token-teste-123" },
      }),
    );
  });

  test("deve retornar 502 quando a Brapi retornar erro ou limite de requisições", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => "Too Many Requests",
    });

    const req = new NextRequest(
      "http://localhost:3000/api/cotacao?ticker=VALE3",
    );

    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.erro).toBe("Nenhuma cotação retornada pela Brapi.");
  });

  test("deve retornar 502 quando o ativo não existir ou results vier vazio", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ results: [] }),
    });

    const req = new NextRequest(
      "http://localhost:3000/api/cotacao?ticker=INVALIDO99",
    );

    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.erro).toBe("Nenhuma cotação retornada pela Brapi.");
  });
});
