
import { NextRequest, NextResponse } from "next/server";
import argon2 from "argon2";

import { buscarUsuarioPorEmail } from "@/lib/queries/usuarios";
import { criarSessao } from "@/lib/auth";
import { validarEmail } from "@/lib/validacoes";


export async function POST(request: NextRequest) {
    try {
        const corpo = await request.json();

        const { email, senha } = corpo;

        if (
            typeof email !== "string" ||
            typeof senha !== "string" ||
            !validarEmail(email)
        ) {
            return NextResponse.json(
                { erro: "Credenciais inválidas." },
                { status: 400 }
            );
        }

        const usuario = await buscarUsuarioPorEmail(
            email
        );

        if (!usuario) {
            return NextResponse.json(
                { erro: "E-mail ou senha incorretos." },
                { status: 401 }
            );
        }

        const senhaCorreta = await argon2.verify(
            usuario.senha_hash,
            senha
        );

        if (!senhaCorreta) {
            return NextResponse.json(
                { erro: "E-mail ou senha incorretos." },
                { status: 401 }
            );
        }

        await criarSessao(usuario.id);

        const {
            senha_hash: _senhaHash,
            ...usuarioSeguro
        } = usuario;

        return NextResponse.json({
            mensagem: "Login realizado com sucesso.",
            usuario: usuarioSeguro,
        });

    } catch (erro) {
        console.error("Erro no login:", erro);

        return NextResponse.json(
            { erro: "Não foi possível realizar o login." },
            { status: 500 }
        );
    }
}
