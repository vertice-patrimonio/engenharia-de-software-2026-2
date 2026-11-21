
import { pool } from "@/lib/db";
import {
    PerfilInvestidor,
    Usuario,
    UsuarioComSenha,
} from "@/lib/tipos";

export async function cadastrarUsuario(
    nome: string,
    email: string,
    senhaHash: string
): Promise<Usuario> {

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const resultado = await client.query(
            `INSERT INTO usuarios (
                nome,
                email,
                senha_hash
            )
            VALUES ($1, $2, $3)
            RETURNING
                id,
                nome,
                email,
                perfil_investidor,
                criado_em`,
            [nome.trim(), email.toLowerCase().trim(), senhaHash]
        );

        const usuario = resultado.rows[0] as Usuario;

        await client.query(
            `INSERT INTO carteiras (
                usuario_id,
                nome
            )
            VALUES ($1, 'Minha carteira')`,
            [usuario.id]
        );

        await client.query("COMMIT");

        return usuario;

    } catch (erro) {
        await client.query("ROLLBACK");
        throw erro;

    } finally {
        client.release();
    }
}

export async function buscarUsuarioPorEmail(
    email: string
): Promise<UsuarioComSenha | null> {

    const resultado = await pool.query(
        `SELECT
            id,
            nome,
            email,
            senha_hash,
            perfil_investidor,
            criado_em
         FROM usuarios
         WHERE email = $1`,
        [email.toLowerCase().trim()]
    );

    return resultado.rows[0] ?? null;
}

export async function buscarUsuarioPorId(
    id: string
): Promise<Usuario | null> {

    const resultado = await pool.query(
        `SELECT
            id,
            nome,
            email,
            perfil_investidor,
            criado_em
         FROM usuarios
         WHERE id = $1`,
        [id]
    );

    return resultado.rows[0] ?? null;
}

export async function atualizarPerfilUsuario(
    id: string,
    nome: string,
    perfil: PerfilInvestidor | null
): Promise<Usuario | null> {

    const resultado = await pool.query(
        `UPDATE usuarios
         SET
            nome = $2,
            perfil_investidor = $3
         WHERE id = $1
         RETURNING
            id,
            nome,
            email,
            perfil_investidor,
            criado_em`,
        [id, nome.trim(), perfil]
    );

    return resultado.rows[0] ?? null;
}

export async function emailJaCadastrado(
    email: string
): Promise<boolean> {

    const resultado = await pool.query(
        `SELECT 1
         FROM usuarios
         WHERE email = $1`,
        [email.toLowerCase().trim()]
    );

    return resultado.rowCount !== 0;
}
