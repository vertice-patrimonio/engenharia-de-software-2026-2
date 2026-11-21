
import { NextRequest, NextResponse } from "next/server";

import {
    listarAtivos,
    pesquisarAtivos,
    listarAtivosPorTipo,
} from "@/lib/queries/ativos";

import { TipoAtivo } from "@/lib/tipos";

const TIPOS_VALIDOS = [
    "ACAO",
    "FII",
    "ETF",
    "BDR",
    "OUTRO",
];

export async function GET(request: NextRequest) {
    try {
        const pesquisa =
            request.nextUrl.searchParams.get("search");

        const tipo =
            request.nextUrl.searchParams.get("tipo");

        let resultado;

        if (tipo) {
            if (!TIPOS_VALIDOS.includes(tipo)) {
                return NextResponse.json(
                    { erro: "Tipo de ativo inválido." },
                    { status: 400 }
                );
            }

            resultado = await listarAtivosPorTipo(
                tipo as TipoAtivo
            );

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
            { status: 500 }
        );
    }
}
