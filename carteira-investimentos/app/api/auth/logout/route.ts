import { NextResponse } from "next/server";
import { encerrarSessao } from "@/lib/auth";

export async function POST() {
    await encerrarSessao();

    return NextResponse.json({
        mensagem: "Sessão encerrada com sucesso.",
    });
}