import { Cotacao } from "@/lib/tipos";

const BRAPI_URL = "https://brapi.dev/api";

interface RespostaBrapi {
  results: Array<{
    symbol: string;
    data?: {
      regularMarketPrice?: number | null;
      regularMarketTime?: string;
    };
  }>;
  errors?: Array<{
    symbol?: string;
    message?: string;
  }>;
}

export async function buscarCotacoes(tickers: string[]): Promise<Cotacao[]> {
  const unicos = [
    ...new Set(tickers.map((ticker) => ticker.toUpperCase().trim())),
  ];

  if (unicos.length === 0) {
    return [];
  }

  const token = process.env.BRAPI_API_KEY;

  if (!token) {
    throw new Error("BRAPI_API_KEY não configurada.");
  }

  const url = new URL(`${BRAPI_URL}/v2/stocks/quote`);

  url.searchParams.set("symbols", unicos.join(","));

  const resposta = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });

  if (!resposta.ok) {
    throw new Error(`Erro na brapi: HTTP ${resposta.status}`);
  }

  const dados: RespostaBrapi = await resposta.json();

  return (dados.results ?? [])
    .filter(
      (item) =>
        typeof item.data?.regularMarketPrice === "number" &&
        Number.isFinite(item.data.regularMarketPrice),
    )
    .map((item) => ({
      ticker: item.symbol,
      preco: item.data!.regularMarketPrice!,
      horario: item.data?.regularMarketTime ?? null,
    }));
}
