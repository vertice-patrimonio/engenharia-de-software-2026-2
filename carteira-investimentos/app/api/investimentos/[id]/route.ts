import { NextResponse } from "next/server";
import { obterUsuarioAutenticado } from "@/lib/auth";
import { buscarCarteiraPorUsuario } from "@/lib/queries/carteiras";
import { excluirInvestimento } from "@/lib/queries/investimentos";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { erro: "ID de investimento inválido." },
        { status: 400 },
      );
    }

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
    console.error("Erro em DELETE /api/investimentos/[id]:", erro);

    return NextResponse.json(
      { erro: "Erro ao excluir investimento." },
      { status: 500 },
    );
  }
}