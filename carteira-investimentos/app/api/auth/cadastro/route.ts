
import { NextRequest, NextResponse } from "next/server";
import argon2 from "argon2";

import { cadastrarUsuario } from "@/lib/queries/usuarios";
import { criarSessao } from "@/lib/auth";
import {
    validarEmail,
    validarSenha,
    validarNome,
} from "@/lib/validacoes";

export async function POST(request: NextRequest) {
    try {
        const corpo = await request.json();

        const { nome, email, senha } = corpo;

        if (
            typeof nome !== "string" ||
            typeof email !== "string" ||
            typeof senha !== "string"
        ) {
            return NextResponse.json(
                { erro: "Dados inválidos." },
                { status: 400 }
            );
        }

        if (!validarNome(nome)) {
            return NextResponse.json(
                { erro: "Nome inválido." },
                { status: 400 }
            );
        }

        if (!validarEmail(email)) {
            return NextResponse.json(
                { erro: "E-mail inválido." },
                { status: 400 }
            );
        }

        if (!validarSenha(senha)) {
            return NextResponse.json(
                {
                    erro: "A senha deve possuir pelo menos 8 caracteres.",
                },
                { status: 400 }
            );
        }

        const senhaHash = await argon2.hash(
            senha,
            {
                type: argon2.argon2id,
            }
        );

        const usuario = await cadastrarUsuario(
            nome,
            email,
            senhaHash
        );

        await criarSessao(usuario.id);

        return NextResponse.json(
            {
                mensagem: "Usuário cadastrado com sucesso.",
                usuario,
            },
            { status: 201 }
        );

    } catch (erro: unknown) {

        const erroBanco = erro as {
            code?: string;
        };

        if (erroBanco.code === "23505") {
            return NextResponse.json(
                { erro: "Este e-mail já está cadastrado." },
                { status: 409 }
            );
        }

        console.error("Erro no cadastro:", erro);

        return NextResponse.json(
            { erro: "Não foi possível realizar o cadastro." },
            { status: 500 }
        );
    }
}
