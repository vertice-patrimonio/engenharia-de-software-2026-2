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

    const nome = String(body.nome || "").trim();
    const email = String(body.email || "")
      .toLowerCase()
      .trim();
    const senha = String(body.senha || "");
    const perfilInvestidor = body.perfil_investidor
      ? String(body.perfil_investidor).trim()
      : null;

    if (!nome || !email || !senha) {
      return NextResponse.json(
        { erro: "Nome, e-mail e senha são obrigatórios." },
        { status: 400 },
      );
    }

    if (senha.length < 6) {
      return NextResponse.json(
        { erro: "A senha deve ter pelo menos 6 caracteres." },
        { status: 400 },
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Verifica se já existe usuário com o mesmo e-mail
    const { data: usuarioExistente, error: erroConsulta } = await supabaseAdmin
      .from("usuarios")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (erroConsulta) {
      console.error("Erro ao verificar e-mail:", erroConsulta);
      return NextResponse.json(
        { erro: "Erro ao validar usuário no banco." },
        { status: 500 },
      );
    }

    if (usuarioExistente) {
      return NextResponse.json(
        { erro: "Já existe uma conta cadastrada com este e-mail." },
        { status: 409 },
      );
    }

    // 2. Gera o hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // 3. Insere o usuário na tabela 'usuarios'
    const { data: novoUsuario, error: erroUsuario } = await supabaseAdmin
      .from("usuarios")
      .insert([
        {
          nome,
          email,
          senha_hash: senhaHash,
          perfil_investidor: perfilInvestidor,
        },
      ])
      .select("id, nome, email, perfil_investidor, criado_em")
      .single();

    if (erroUsuario || !novoUsuario) {
      console.error("Erro ao criar usuário:", erroUsuario);
      return NextResponse.json(
        { erro: erroUsuario?.message || "Não foi possível cadastrar o usuário." },
        { status: 400 },
      );
    }

    // 4. Cria automaticamente a carteira padrão na tabela 'carteiras'
    const { data: novaCarteira, error: erroCarteira } = await supabaseAdmin
      .from("carteiras")
      .insert([
        {
          usuario_id: novoUsuario.id,
          nome: "Minha carteira",
        },
      ])
      .select("id, usuario_id, nome, criado_em")
      .single();

    if (erroCarteira || !novaCarteira) {
      console.error("Erro ao criar carteira automática:", erroCarteira);

      // Rollback: remove o usuário se a carteira não pôde ser criada
      await supabaseAdmin.from("usuarios").delete().eq("id", novoUsuario.id);

      return NextResponse.json(
        { erro: "Erro ao inicializar a carteira do usuário." },
        { status: 500 },
      );
    }

    // 5. Assina o token e grava o cookie HttpOnly de sessão
    const token = assinarSessao({
      usuarioId: novoUsuario.id,
      nome: novoUsuario.nome,
      email: novoUsuario.email,
      carteiraId: novaCarteira.id,
    });

    const response = NextResponse.json(
      {
        mensagem: "Conta e carteira criadas com sucesso.",
        usuario: novoUsuario,
        carteira: novaCarteira,
      },
      { status: 201 },
    );

    response.cookies.set(NOME_COOKIE_SESSAO, token, opcoesCookieSessao());

    return response;
  } catch (erro) {
    console.error("Erro interno no cadastro:", erro);
    return NextResponse.json(
      { erro: "Erro interno ao processar o cadastro." },
      { status: 500 },
    );
  }
}