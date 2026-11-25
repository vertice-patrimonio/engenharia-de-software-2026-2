import { NextRequest, NextResponse } from "next/server";

import {
  listarAtivos,
  pesquisarAtivos,
  listarAtivosPorTipo,
} from "@/lib/queries/ativos";

import { TipoAtivo } from "@/lib/tipos";

const TIPOS_VALIDOS = ["ACAO", "FII", "ETF", "BDR", "OUTRO"];

export async function GET(request: NextRequest) {
  try {
    const pesquisa = request.nextUrl.searchParams.get("search");

    const tipo = request.nextUrl.searchParams.get("tipo");

    let resultado;

    if (tipo) {
      if (!TIPOS_VALIDOS.includes(tipo)) {
        return NextResponse.json(
          { erro: "Tipo de ativo inválido." },
          { status: 400 },
        );
      }

      resultado = await listarAtivosPorTipo(tipo as TipoAtivo);
    } else if (pesquisa !== null) {
      if (pesquisa.trim().length < 1) {
        return NextResponse.json([]);
      }

      resultado = await pesquisarAtivos(pesquisa);
    } else {
      resultado = await listarAtivos();
    }

    return NextResponse.json(resultado);
  } catch (erro) {
    console.error("Erro ao consultar ativos:", erro);

    return NextResponse.json(
      { erro: "Não foi possível consultar os ativos." },
      { status: 500 },
    );
  }
}

import { getSupabaseAdmin } from "@/lib/supabase";

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

    const supabaseAdmin = getSupabaseAdmin();

    const { data, error } = await supabaseAdmin
      .from("ativos")
      .insert([
        {
          ticker: String(ticker).toUpperCase().trim(),
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
