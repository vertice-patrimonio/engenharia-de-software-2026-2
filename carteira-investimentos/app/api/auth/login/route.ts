import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  assinarSessao,
  NOME_COOKIE_SESSAO,
  opcoesCookieSessao,
} from "@/lib/sessao";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || "")
      .toLowerCase()
      .trim();
    const senha = String(body.senha || "");

    if (!email || !senha) {
      return NextResponse.json(
        { erro: "Informe e-mail e senha." },
        { status: 400 },
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: usuario, error } = await supabaseAdmin
      .from("usuarios")
      .select("id, nome, email, senha_hash, perfil_investidor")
      .eq("email", email)
      .maybeSingle();

    if (error || !usuario) {
      return NextResponse.json(
        { erro: "E-mail ou senha inválidos." },
        { status: 401 },
      );
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaValida) {
      return NextResponse.json(
        { erro: "E-mail ou senha inválidos." },
        { status: 401 },
      );
    }

    const { data: carteira } = await supabaseAdmin
      .from("carteiras")
      .select("id, nome")
      .eq("usuario_id", usuario.id)
      .order("criado_em", { ascending: true })
      .limit(1)
      .maybeSingle();

    const token = assinarSessao({
      usuarioId: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      carteiraId: carteira?.id ?? null,
    });

    const response = NextResponse.json({
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil_investidor: usuario.perfil_investidor,
      },
      carteira,
    });

    response.cookies.set(NOME_COOKIE_SESSAO, token, opcoesCookieSessao());
    return response;
  } catch (erro) {
    console.error("Erro no login:", erro);
    return NextResponse.json(
      { erro: "Erro interno ao autenticar." },
      { status: 500 },
    );
  }
}

