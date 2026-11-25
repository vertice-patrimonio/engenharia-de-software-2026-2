import crypto from "crypto";
import { cookies } from "next/headers";

export const NOME_COOKIE_SESSAO = "vertice_sessao";

export interface DadosSessao {
  usuarioId: string;
  nome: string;
  email: string;
  carteiraId: string | null;
  exp: number;
}

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET não configurado ou muito curto no .env.local");
  }
  return secret;
}

export function assinarSessao(
  payload: Omit<DadosSessao, "exp">,
  diasValidade = 7,
): string {
  const exp = Math.floor(Date.now() / 1000) + diasValidade * 24 * 60 * 60;
  const dadosCompletos: DadosSessao = { ...payload, exp };

  const dataBase64 = Buffer.from(JSON.stringify(dadosCompletos)).toString(
    "base64url",
  );
  const assinatura = crypto
    .createHmac("sha256", getSecret())
    .update(dataBase64)
    .digest("base64url");

  return `${dataBase64}.${assinatura}`;
}

export function verificarTokenSessao(
  token?: string | null,
): DadosSessao | null {
  if (!token) return null;

  const partes = token.split(".");
  if (partes.length !== 2) return null;

  const [dataBase64, assinaturaRecebida] = partes;
  if (!dataBase64 || !assinaturaRecebida) return null;

  try {
    const assinaturaEsperada = crypto
      .createHmac("sha256", getSecret())
      .update(dataBase64)
      .digest("base64url");

    const bufRecebido = Buffer.from(assinaturaRecebida);
    const bufEsperado = Buffer.from(assinaturaEsperada);

    if (
      bufRecebido.length !== bufEsperado.length ||
      !crypto.timingSafeEqual(bufRecebido, bufEsperado)
    ) {
      return null;
    }

    const parsed = JSON.parse(
      Buffer.from(dataBase64, "base64url").toString("utf8"),
    ) as DadosSessao;

    const agoraSegundos = Math.floor(Date.now() / 1000);
    if (!parsed.exp || parsed.exp < agoraSegundos || !parsed.usuarioId) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function obterSessaoAtual(): Promise<DadosSessao | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(NOME_COOKIE_SESSAO)?.value;
  return verificarTokenSessao(token);
}

export function opcoesCookieSessao(diasValidade = 7) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: diasValidade * 24 * 60 * 60,
    secure: process.env.NODE_ENV === "production",
  };
}
