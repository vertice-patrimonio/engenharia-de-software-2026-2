import { NextRequest, NextResponse } from "next/server";
import { NOME_COOKIE_SESSAO } from "@/lib/sessao";

const ROTAS_PROTEGIDAS = ["/dashboard", "/carteira", "/transacoes", "/perfil"];

function rotaExigeLogin(pathname: string): boolean {
  return ROTAS_PROTEGIDAS.some(
    (rota) => pathname === rota || pathname.startsWith(`${rota}/`),
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Nunca intercepta rotas de API nem arquivos internos do Next.js
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const cookieSessao = request.cookies.get(NOME_COOKIE_SESSAO)?.value;
  const temCookie = Boolean(cookieSessao && cookieSessao.includes("."));

  if (rotaExigeLogin(pathname) && !temCookie) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname === "/" && temCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/carteira/:path*",
    "/transacoes/:path*",
    "/perfil/:path*",
  ],
};