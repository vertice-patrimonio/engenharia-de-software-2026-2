import { NextRequest, NextResponse } from "next/server";

import { obterUsuarioAutenticado } from "@/lib/auth";

import {
  buscarCarteiraPorUsuario,
  atualizarNomeCarteira,
} from "@/lib/queries/carteiras";

export async function GET() {
  try {
    const sessao = await obterUsuarioAutenticado();

    if (!sessao) {
      return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
    }

    const carteira = await buscarCarteiraPorUsuario(sessao.id);

    if (!carteira) {
      return NextResponse.json(
        { erro: "Carteira não encontrada." },
        { status: 404 },
      );
    }

    return NextResponse.json(carteira);
  } catch (erro) {
    console.error(erro);

    return NextResponse.json(
      { erro: "Erro ao consultar carteira." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const sessao = await obterUsuarioAutenticado();

    if (!sessao) {
      return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
    }

    const corpo = await request.json();

    const nome = corpo.nome;

    if (
      typeof nome !== "string" ||
      nome.trim().length < 2 ||
      nome.trim().length > 100
    ) {
      return NextResponse.json(
        { erro: "Nome da carteira inválido." },
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

    const atualizada = await atualizarNomeCarteira(
      carteira.id,
      sessao.id,
      nome,
    );

    return NextResponse.json(atualizada);
  } catch (erro) {
    console.error(erro);

    return NextResponse.json(
      { erro: "Erro ao atualizar carteira." },
      { status: 500 },
    );
  }
}
