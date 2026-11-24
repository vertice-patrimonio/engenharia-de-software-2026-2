import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const rawParam =
      request.nextUrl.searchParams.get("ticker") ||
      request.nextUrl.searchParams.get("tickers") ||
      "";

    const tickers = rawParam
      .split(",")
      .map((item) => item.toUpperCase().trim())
      .filter(Boolean);

    if (tickers.length === 0) {
      return NextResponse.json(
        { erro: "Informe pelo menos um ticker em ?ticker=..." },
        { status: 400 },
      );
    }

    const token = process.env.BRAPI_KEY;
    if (!token) {
      console.error("GET /api/cotacao: BRAPI_TOKEN não definido no ambiente.");
      return NextResponse.json(
        { erro: "BRAPI_TOKEN não configurado no servidor." },
        { status: 500 },
      );
    }

    const consultas = await Promise.all(
      tickers.map(async (simbolo) => {
        try {
          const url = `https://brapi.dev/api/quote/${encodeURIComponent(simbolo)}`;
          const res = await fetch(url, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          });

          if (!res.ok) {
            const corpo = await res.text().catch(() => "");
            console.error(
              `Brapi falhou para ${simbolo} (HTTP ${res.status}):`,
              corpo,
            );
            return null;
          }

          const json = await res.json();
          const ativo = Array.isArray(json?.results) ? json.results[0] : null;
          return ativo ?? null;
        } catch (errAtivo) {
          console.error(`Erro de rede ao consultar ${simbolo}:`, errAtivo);
          return null;
        }
      }),
    );

    const results = consultas.filter(Boolean);

    if (results.length === 0) {
      return NextResponse.json(
        {
          erro: "Nenhuma cotação retornada pela Brapi.",
          results: [],
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      results,
      // Mantém compatibilidade caso algum consumidor leia precoAtual de 1 ativo
      ticker: results[0]?.symbol,
      precoAtual:
        typeof results[0]?.regularMarketPrice === "number"
          ? results[0].regularMarketPrice
          : null,
      moeda: results[0]?.currency || "BRL",
    });
  } catch (erro) {
    console.error("Erro inesperado em GET /api/cotacao:", erro);
    return NextResponse.json(
      {
        erro:
          erro instanceof Error ? erro.message : "Erro interno ao buscar cotações.",
      },
      { status: 500 },
    );
  }
}