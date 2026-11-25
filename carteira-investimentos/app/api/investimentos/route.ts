import { NextResponse } from "next/server";
import { obterSessaoAtual } from "@/lib/sessao";
import { getSupabaseAdmin } from "@/lib/supabase";

async function resolverCarteiraId(
  usuarioId: string,
  carteiraIdSessao: string | null,
) {
  const supabaseAdmin = getSupabaseAdmin();

  if (carteiraIdSessao) {
    const { data } = await supabaseAdmin
      .from("carteiras")
      .select("id")
      .eq("id", carteiraIdSessao)
      .eq("usuario_id", usuarioId)
      .maybeSingle();

    if (data?.id) return data.id;
  }

  const { data: carteira } = await supabaseAdmin
    .from("carteiras")
    .select("id")
    .eq("usuario_id", usuarioId)
    .order("criado_em", { ascending: true })
    .limit(1)
    .maybeSingle();

  return carteira?.id ?? null;
}

export async function GET() {
  try {
    const sessao = await obterSessaoAtual();
    if (!sessao) {
      return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
    }

    const carteiraId = await resolverCarteiraId(
      sessao.usuarioId,
      sessao.carteiraId,
    );

    if (!carteiraId) {
      return NextResponse.json({
        investimentos: [],
        totalInvestido: 0,
        quantidadeAtivos: 0,
      });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("investimentos")
      .select(
        "id, carteira_id, ativo_id, quantidade, valor_investido, atualizado_em",
      )
      .eq("carteira_id", carteiraId)
      .gt("quantidade", 0)
      .order("valor_investido", { ascending: false });

    if (error) {
      console.error("Erro ao consultar investimentos:", error);
      return NextResponse.json({ erro: error.message }, { status: 400 });
    }

    const lista = data ?? [];
    const totalInvestido = lista.reduce(
      (acc, item) => acc + Number(item.valor_investido || 0),
      0,
    );

    return NextResponse.json({
      investimentos: lista,
      totalInvestido,
      quantidadeAtivos: lista.length,
    });
  } catch (erro) {
    console.error("Erro interno em /api/investimentos:", erro);
    return NextResponse.json(
      { erro: "Erro interno ao carregar investimentos." },
      { status: 500 },
    );
  }
}
