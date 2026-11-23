import { NextResponse } from "next/server";

import { obterUsuarioAutenticado } from "@/lib/auth";

import { buscarCarteiraPorUsuario } from "@/lib/queries/carteiras";

import {
  listarInvestimentos,
  calcularTotalInvestido,
  contarAtivos,
} from "@/lib/queries/investimentos";

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

    const [investimentos, totalInvestido, quantidadeAtivos] = await Promise.all(
      [
        listarInvestimentos(carteira.id),
        calcularTotalInvestido(carteira.id),
        contarAtivos(carteira.id),
      ],
    );

    return NextResponse.json({
      investimentos,
      totalInvestido,
      quantidadeAtivos,
    });
  } catch (erro) {
    console.error(erro);

    return NextResponse.json(
      { erro: "Erro ao consultar investimentos." },
      { status: 500 },
    );
  }
}
