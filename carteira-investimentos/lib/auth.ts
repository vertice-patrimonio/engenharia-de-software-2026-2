import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "carteira_session";

function obterChave(): Uint8Array {
    const segredo = process.env.SESSION_SECRET;

    if (!segredo || segredo.length < 32) {
        throw new Error(
            "SESSION_SECRET precisa ter pelo menos 32 caracteres."
        );
    }

    return new TextEncoder().encode(segredo);
}

export async function criarSessao(usuarioId: string) {
    const token = await new SignJWT({
        sub: usuarioId,
    })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(obterChave());

    const cookieStore = await cookies();

    cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
    });
}

export async function obterUsuarioAutenticado():
    Promise<{ id: string } | null> {

    const cookieStore = await cookies();

    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
        return null;
    }

    try {
        const { payload } = await jwtVerify(
            token,
            obterChave(),
            {
                algorithms: ["HS256"],
            }
        );

        if (typeof payload.sub !== "string") {
            return null;
        }

        return {
            id: payload.sub,
        };

    } catch {
        return null;
    }
}

export async function encerrarSessao() {
    const cookieStore = await cookies();

    cookieStore.delete(COOKIE_NAME);
}
