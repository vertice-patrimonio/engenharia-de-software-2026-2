import { NextResponse } from "next/server";
import { NOME_COOKIE_SESSAO } from "@/lib/sessao";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(NOME_COOKIE_SESSAO, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}