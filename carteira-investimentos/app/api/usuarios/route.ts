import { NextRequest, NextResponse } from "next/server";
import { obterSessaoAtual } from "@/lib/sessao";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const sessao = await obterSessaoAtual();
    if (!sessao) {
      return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: usuario, error } = await supabaseAdmin
      .from("usuarios")
      .select("id, nome, email, perfil_investidor, criado_em")
      .eq("id", sessao.usuarioId)
      .single();

    if (error || !usuario) {
      return NextResponse.json(
        { erro: "Usuário não encontrado." },
        { status: 404 },
      );
    }

    return NextResponse.json(usuario);
  } catch (erro) {
    console.error("Erro ao buscar usuário:", erro);
    return NextResponse.json(
      { erro: "Erro interno ao buscar dados do usuário." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const sessao = await obterSessaoAtual();
    if (!sessao) {
      return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
    }

    const body = await request.json();
    const atualizacoes: Record<string, string | null> = {};

    if (typeof body.nome === "string" && body.nome.trim()) {
      atualizacoes.nome = body.nome.trim();
    }

    if ("perfil_investidor" in body) {
      atualizacoes.perfil_investidor = body.perfil_investidor
        ? String(body.perfil_investidor).trim()
        : null;
    }

    if (Object.keys(atualizacoes).length === 0) {
      return NextResponse.json(
        { erro: "Nenhum campo válido informado para atualização." },
        { status: 400 },
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("usuarios")
      .update(atualizacoes)
      .eq("id", sessao.usuarioId)
      .select("id, nome, email, perfil_investidor, criado_em")
      .single();

    if (error) {
      return NextResponse.json({ erro: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (erro) {
    console.error("Erro ao atualizar usuário:", erro);
    return NextResponse.json(
      { erro: "Erro interno ao atualizar perfil." },
      { status: 500 },
    );
  }
}
