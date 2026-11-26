import { NextResponse } from "next/server";
import { NOME_COOKIE_SESSAO } from "@/lib/sessao";

export async function POST() {
  const resposta = NextResponse.json({
    mensagem: "Sessão encerrada com sucesso.",
  });

  resposta.cookies.set(NOME_COOKIE_SESSAO, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });

  return resposta;
}