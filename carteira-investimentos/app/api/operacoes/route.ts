import { NextRequest, NextResponse } from "next/server";

import { obterUsuarioAutenticado } from "@/lib/auth";

import { buscarCarteiraPorUsuario } from "@/lib/queries/carteiras";

import { listarOperacoes, registrarOperacao } from "@/lib/queries/operacoes";

import {
  validarTipoOperacao,
  validarNumeroPositivo,
  validarTaxas,
  validarDataOperacao,
} from "@/lib/validacoes";

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

    const operacoes = await listarOperacoes(carteira.id);

    return NextResponse.json(operacoes);
  } catch (erro) {
    console.error(erro);

    return NextResponse.json(
      { erro: "Erro ao consultar operações." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessao = await obterUsuarioAutenticado();

    if (!sessao) {
      return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
    }

    const corpo = await request.json();

    const {
      ativoId,
      tipo,
      quantidade,
      precoUnitario,
      taxas = 0,
      dataOperacao,
    } = corpo;

    if (
      typeof ativoId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        ativoId,
      )
    ) {
      return NextResponse.json(
        { erro: "Identificador do ativo inválido." },
        { status: 400 },
      );
    }

    if (!validarTipoOperacao(tipo)) {
      return NextResponse.json(
        { erro: "Tipo de operação inválido." },
        { status: 400 },
      );
    }

    if (!validarNumeroPositivo(quantidade)) {
      return NextResponse.json(
        { erro: "Quantidade inválida." },
        { status: 400 },
      );
    }

    if (!validarNumeroPositivo(precoUnitario)) {
      return NextResponse.json(
        { erro: "Preço unitário inválido." },
        { status: 400 },
      );
    }

    if (!validarTaxas(taxas)) {
      return NextResponse.json({ erro: "Taxas inválidas." }, { status: 400 });
    }

    if (
      typeof dataOperacao !== "string" ||
      !validarDataOperacao(dataOperacao)
    ) {
      return NextResponse.json(
        { erro: "Data da operação inválida." },
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

    const operacao = await registrarOperacao(carteira.id, {
      ativoId,
      tipo,
      quantidade,
      precoUnitario,
      taxas,
      dataOperacao,
    });

    return NextResponse.json(
      {
        mensagem: "Operação registrada com sucesso.",
        operacao,
      },
      { status: 201 },
    );
  } catch (erro) {
    const mensagem =
      erro instanceof Error ? erro.message : "Erro ao registrar operação.";

    if (
      mensagem.includes("não possui") ||
      mensagem.includes("superior à posição") ||
      mensagem.includes("não encontrado")
    ) {
      return NextResponse.json({ erro: mensagem }, { status: 400 });
    }

    console.error("Erro na operação:", erro);

    return NextResponse.json(
      { erro: "Não foi possível registrar a operação." },
      { status: 500 },
    );
  }
}
