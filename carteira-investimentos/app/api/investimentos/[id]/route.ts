import { NextResponse } from "next/server";
import { obterSessaoAtual } from "@/lib/sessao";
import { getSupabaseAdmin } from "@/lib/supabase";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface Contexto {
  params: Promise<{
    id: string;
  }>;
}

function isNextPrerenderError(erro: unknown): boolean {
  if (!erro || typeof erro !== "object") return false;
  const digest = (erro as { digest?: unknown }).digest;
  return (
    typeof digest === "string" &&
    (digest.startsWith("NEXT_") || digest === "HANGING_PROMISE_REJECTION")
  );
}

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

export async function DELETE(_request: Request, context: Contexto) {
  try {
    const sessao = await obterSessaoAtual();

    if (!sessao) {
      return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
    }

    const { id } = await context.params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { erro: "ID de investimento inválido." },
        { status: 400 },
      );
    }

    const carteiraId = await resolverCarteiraId(
      sessao.usuarioId,
      sessao.carteiraId,
    );

    if (!carteiraId) {
      return NextResponse.json(
        { erro: "Carteira não encontrada." },
        { status: 404 },
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("investimentos")
      .delete()
      .eq("id", id)
      .eq("carteira_id", carteiraId)
      .select("id");

    if (error) {
      console.error("Erro ao excluir investimento:", error);
      return NextResponse.json(
        { erro: "Erro ao excluir investimento." },
        { status: 500 },
      );
    }

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { erro: "Investimento não encontrado." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      mensagem: "Posição removida com sucesso.",
    });
  } catch (erro) {
    if (isNextPrerenderError(erro)) {
      throw erro;
    }

    console.error("Erro em DELETE /api/investimentos/[id]:", erro);

    return NextResponse.json(
      { erro: "Erro ao excluir investimento." },
      { status: 500 },
    );
  }
}