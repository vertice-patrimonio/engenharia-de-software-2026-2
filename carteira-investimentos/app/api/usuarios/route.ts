import { NextRequest, NextResponse } from "next/server";

import { obterUsuarioAutenticado } from "@/lib/auth";

import {
  buscarUsuarioPorId,
  atualizarPerfilUsuario,
} from "@/lib/queries/usuarios";

import { validarNome, validarPerfil } from "@/lib/validacoes";

export async function GET() {
  try {
    const sessao = await obterUsuarioAutenticado();

    if (!sessao) {
      return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
    }

    const usuario = await buscarUsuarioPorId(sessao.id);

    if (!usuario) {
      return NextResponse.json(
        { erro: "Usuário não encontrado." },
        { status: 404 },
      );
    }

    return NextResponse.json(usuario);
  } catch (erro) {
    console.error(erro);

    return NextResponse.json(
      { erro: "Erro ao consultar usuário." },
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

    const { nome, perfil_investidor } = corpo;

    if (typeof nome !== "string" || !validarNome(nome)) {
      return NextResponse.json({ erro: "Nome inválido." }, { status: 400 });
    }

    if (perfil_investidor !== null && !validarPerfil(perfil_investidor)) {
      return NextResponse.json(
        { erro: "Perfil de investidor inválido." },
        { status: 400 },
      );
    }

    const usuario = await atualizarPerfilUsuario(
      sessao.id,
      nome,
      perfil_investidor,
    );

    return NextResponse.json(usuario);
  } catch (erro) {
    console.error(erro);

    return NextResponse.json(
      { erro: "Erro ao atualizar perfil." },
      { status: 500 },
    );
  }
}
