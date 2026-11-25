import { NextRequest, NextResponse } from "next/server";
import {
  listarAtivos,
  pesquisarAtivos,
  listarAtivosPorTipo,
} from "@/lib/queries/ativos";
import { TipoAtivo } from "@/lib/tipos";
import { getSupabaseAdmin } from "@/lib/supabase";

const TIPOS_VALIDOS = ["ACAO", "FII", "ETF", "BDR", "OUTRO"];

function mapearTipoBrapi(tipoBrapi?: string, ticker?: string): TipoAtivo {
  const t = (tipoBrapi || "").toLowerCase();
  const sim = (ticker || "").toUpperCase();

  if (t === "fund" || sim.endsWith("11")) return "FII";
  if (t === "bdr" || sim.endsWith("34") || sim.endsWith("35") || sim.endsWith("39")) return "BDR";
  if (t === "etf") return "ETF";
  if (t === "stock") return "ACAO";
  return "OUTRO";
}

export async function GET(request: NextRequest) {
  try {
    const pesquisa = request.nextUrl.searchParams.get("search");
    const tipo = request.nextUrl.searchParams.get("tipo");

    if (tipo) {
      if (!TIPOS_VALIDOS.includes(tipo)) {
        return NextResponse.json(
          { erro: "Tipo de ativo inválido." },
          { status: 400 },
        );
      }

      const resultado = await listarAtivosPorTipo(tipo as TipoAtivo);
      return NextResponse.json(resultado);
    }

    if (pesquisa !== null) {
      const termo = pesquisa.trim();
      if (termo.length < 1) {
        return NextResponse.json([]);
      }

      // 1. Busca primeiro no banco de dados (Supabase)
      const locais = await pesquisarAtivos(termo);

      // 2. Consulta também a lista geral da B3 na Brapi
      const token = process.env.BRAPI_KEY;
      if (!token) {
        return NextResponse.json(locais);
      }

      try {
        const resBrapi = await fetch(
          `https://brapi.dev/api/quote/list?search=${encodeURIComponent(termo)}&limit=15`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          },
        );

        if (!resBrapi.ok) {
          return NextResponse.json(locais);
        }

        const json = await resBrapi.json();
        const stocks = Array.isArray(json?.stocks) ? json.stocks : [];

        const tickersLocais = new Set(
          locais.map((item: { ticker: string }) => item.ticker.toUpperCase()),
        );

        const externos = stocks
          .filter(
            (s: { stock?: string }) =>
              s.stock && !tickersLocais.has(s.stock.toUpperCase()),
          )
          .map(
            (s: {
              stock: string;
              name?: string;
              type?: string;
              sector?: string;
              logo?: string;
            }) => ({
              id: null, // indica que ainda não foi salvo na tabela `ativos`
              ticker: s.stock.toUpperCase(),
              nome: s.name || s.stock.toUpperCase(),
              tipo_ativo: mapearTipoBrapi(s.type, s.stock),
              setor: s.sector || null,
              bolsa: "B3",
              logo_url: s.logo || null,
              origem: "BRAPI",
            }),
          );

        return NextResponse.json([...locais, ...externos]);
      } catch {
        return NextResponse.json(locais);
      }
    }

    const resultado = await listarAtivos();
    return NextResponse.json(resultado);
  } catch (erro) {
    console.error("Erro ao consultar ativos:", erro);
    return NextResponse.json(
      { erro: "Não foi possível consultar os ativos." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { ticker, nome, tipo_ativo, setor, bolsa, logo_url } =
      await request.json();

    if (!ticker || !nome || !tipo_ativo) {
      return NextResponse.json(
        { erro: "ticker, nome e tipo_ativo são obrigatórios." },
        { status: 400 },
      );
    }

    const tipoNormalizado = String(tipo_ativo).toUpperCase().trim();
    if (!TIPOS_VALIDOS.includes(tipoNormalizado)) {
      return NextResponse.json(
        { erro: "Tipo de ativo inválido." },
        { status: 400 },
      );
    }

    const tickerNormalizado = String(ticker).toUpperCase().trim();
    const supabaseAdmin = getSupabaseAdmin();

    // Evita erro de duplicidade caso o ativo já exista no banco
    const { data: existente } = await supabaseAdmin
      .from("ativos")
      .select("*")
      .eq("ticker", tickerNormalizado)
      .maybeSingle();

    if (existente) {
      return NextResponse.json(existente, { status: 200 });
    }

    const { data, error } = await supabaseAdmin
      .from("ativos")
      .insert([
        {
          ticker: tickerNormalizado,
          nome: String(nome).trim(),
          tipo_ativo: tipoNormalizado,
          setor: setor ? String(setor).trim() : null,
          bolsa: bolsa ? String(bolsa).trim() : "B3",
          logo_url: logo_url ? String(logo_url).trim() : null,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ erro: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (erro) {
    console.error("Erro ao cadastrar ativo:", erro);
    return NextResponse.json(
      { erro: "Não foi possível cadastrar o ativo." },
      { status: 500 },
    );
  }
}