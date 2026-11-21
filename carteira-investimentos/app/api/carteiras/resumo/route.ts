import { NextResponse } from "next/server";

import { obterUsuarioAutenticado } from "@/lib/auth";

import { calcularResumoCarteira } from "@/lib/queries/carteira";

export async function GET() {
    try {
        const sessao = await obterUsuarioAutenticado();

        if (!sessao) {
            return NextResponse.json(
                { erro: "Não autenticado." },
                { status: 401 }
            );
        }

        const resumo = await calcularResumoCarteira(
            sessao.id
        );

        return NextResponse.json(resumo);

    } catch (erro) {
        console.error("Erro no resumo:", erro);

        return NextResponse.json(
            { erro: "Não foi possível calcular o resumo da carteira." },
            { status: 500 }
        );
    }
}
