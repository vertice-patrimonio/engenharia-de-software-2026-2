import { NextResponse } from "next/server";

import { obterUsuarioAutenticado } from "@/lib/auth";

import { buscarCarteiraPorUsuario } from "@/lib/queries/carteiras";

import { excluirInvestimento } from "@/lib/queries/investimentos";

interface Contexto {
  params: Promise<{
    id: string;
  }>;
}

export async function DELETE(_request: Request, context: Contexto) {
  try {
    const sessao = await obterUsuarioAutenticado();

    if (!sessao) {
      return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
    }

    const { id } = await context.params;

    const carteira = await buscarCarteiraPorUsuario(sessao.id);

    if (!carteira) {
      return NextResponse.json(
        { erro: "Carteira não encontrada." },
        { status: 404 },
      );
    }

    const excluido = await excluirInvestimento(id, carteira.id);

    if (!excluido) {
      return NextResponse.json(
        { erro: "Investimento não encontrado." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      mensagem: "Posição removida com sucesso.",
    });
  } catch (erro) {
    console.error(erro);

    return NextResponse.json(
      { erro: "Erro ao excluir investimento." },
      { status: 500 },
    );
  }
}
