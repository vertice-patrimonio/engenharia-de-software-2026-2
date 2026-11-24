import { NextRequest, NextResponse } from "next/server";
import { obterSessaoAtual } from "@/lib/sessao";
import { getSupabaseAdmin } from "@/lib/supabase";

async function resolverCarteiraId(usuarioId: string, carteiraIdSessao: string | null) {
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
      return NextResponse.json([]);
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("operacoes")
      .select(
        "id, carteira_id, ativo_id, tipo, quantidade, preco_unitario, taxas, data_operacao, criado_em",
      )
      .eq("carteira_id", carteiraId)
      .order("data_operacao", { ascending: false })
      .order("criado_em", { ascending: false });

    if (error) {
      console.error("Erro ao consultar operações:", error);
      return NextResponse.json({ erro: error.message }, { status: 400 });
    }

    return NextResponse.json(data ?? []);
  } catch (erro) {
    console.error("Erro interno em GET /api/operacoes:", erro);
    return NextResponse.json(
      { erro: "Erro interno ao carregar operações." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
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
      return NextResponse.json(
        { erro: "Carteira não encontrada para este usuário." },
        { status: 404 },
      );
    }

    const body = await request.json();
    const ativoId = String(body.ativoId || body.ativo_id || "").trim();
    const tipo = String(body.tipo || "").toUpperCase().trim();
    const quantidade = Number(body.quantidade);
    const precoUnitario = Number(body.precoUnitario ?? body.preco_unitario);
    const taxas = Number(body.taxas || 0);
    const dataOperacao = String(
      body.dataOperacao || body.data_operacao || "",
    ).trim();

    if (!ativoId || (tipo !== "COMPRA" && tipo !== "VENDA") || !dataOperacao) {
      return NextResponse.json(
        { erro: "Preencha ativo, tipo (COMPRA/VENDA) e data da operação." },
        { status: 400 },
      );
    }

    if (
      !Number.isFinite(quantidade) ||
      quantidade <= 0 ||
      !Number.isFinite(precoUnitario) ||
      precoUnitario <= 0 ||
      !Number.isFinite(taxas) ||
      taxas < 0
    ) {
      return NextResponse.json(
        { erro: "Quantidade, preço unitário ou taxas inválidos." },
        { status: 400 },
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Consulta posição consolidada atual do ativo na carteira
    const { data: posicaoAtual, error: erroPosicao } = await supabaseAdmin
      .from("investimentos")
      .select("id, quantidade, valor_investido")
      .eq("carteira_id", carteiraId)
      .eq("ativo_id", ativoId)
      .maybeSingle();

    if (erroPosicao) {
      return NextResponse.json(
        { erro: "Erro ao verificar posição atual do ativo." },
        { status: 500 },
      );
    }

    const qtdAtual = Number(posicaoAtual?.quantidade || 0);
    const valorAtual = Number(posicaoAtual?.valor_investido || 0);

    if (tipo === "VENDA" && quantidade > qtdAtual) {
      return NextResponse.json(
        {
          erro: `Quantidade insuficiente para venda. Disponível em custódia: ${qtdAtual}.`,
        },
        { status: 400 },
      );
    }

    // Insere o registro na tabela 'operacoes'
    const { data: novaOperacao, error: erroInsertOp } = await supabaseAdmin
      .from("operacoes")
      .insert([
        {
          carteira_id: carteiraId,
          ativo_id: ativoId,
          tipo,
          quantidade,
          preco_unitario: precoUnitario,
          taxas,
          data_operacao: dataOperacao,
        },
      ])
      .select()
      .single();

    if (erroInsertOp || !novaOperacao) {
      return NextResponse.json(
        { erro: erroInsertOp?.message || "Erro ao registrar operação." },
        { status: 400 },
      );
    }

    // Recalcula posição consolidada em 'investimentos'
    const agora = new Date().toISOString();

    if (tipo === "COMPRA") {
      const novaQtd = qtdAtual + quantidade;
      const novoValor = valorAtual + quantidade * precoUnitario + taxas;

      const { error: erroUpsertInv } = await supabaseAdmin
        .from("investimentos")
        .upsert(
          [
            {
              carteira_id: carteiraId,
              ativo_id: ativoId,
              quantidade: novaQtd,
              valor_investido: novoValor,
              atualizado_em: agora,
            },
          ],
          { onConflict: "carteira_id,ativo_id" },
        );

      if (erroUpsertInv) {
        console.error("Erro ao atualizar investimentos na compra:", erroUpsertInv);
      }
    } else {
      const novaQtd = qtdAtual - quantidade;

      if (novaQtd <= 0) {
        await supabaseAdmin
          .from("investimentos")
          .delete()
          .eq("carteira_id", carteiraId)
          .eq("ativo_id", ativoId);
      } else {
        const precoMedioAtual = qtdAtual > 0 ? valorAtual / qtdAtual : 0;
        const novoValor = Math.max(0, novaQtd * precoMedioAtual);

        await supabaseAdmin
          .from("investimentos")
          .update({
            quantidade: novaQtd,
            valor_investido: novoValor,
            atualizado_em: agora,
          })
          .eq("carteira_id", carteiraId)
          .eq("ativo_id", ativoId);
      }
    }

    return NextResponse.json(novaOperacao, { status: 201 });
  } catch (erro) {
    console.error("Erro interno em POST /api/operacoes:", erro);
    return NextResponse.json(
      { erro: "Erro interno ao registrar operação." },
      { status: 500 },
    );
  }
}