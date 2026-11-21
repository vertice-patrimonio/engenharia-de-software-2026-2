
import { pool } from "@/lib/db";
import { Ativo, TipoAtivo } from "@/lib/tipos";

export async function listarAtivos(): Promise<Ativo[]> {

    const resultado = await pool.query(
        `SELECT
            id,
            ticker,
            nome,
            tipo_ativo,
            setor,
            bolsa,
            logo_url,
            ativo_no_mercado,
            atualizado_em
         FROM ativos
         WHERE ativo_no_mercado = TRUE
         ORDER BY ticker`
    );

    return resultado.rows;
}

export async function pesquisarAtivos(
    pesquisa: string
): Promise<Ativo[]> {

    const resultado = await pool.query(
        `SELECT
            id,
            ticker,
            nome,
            tipo_ativo,
            setor,
            bolsa,
            logo_url,
            ativo_no_mercado,
            atualizado_em
         FROM ativos
         WHERE ativo_no_mercado = TRUE
         AND (
            ticker ILIKE $1
            OR nome ILIKE $1
         )
         ORDER BY ticker
         LIMIT 30`,
        [`%${pesquisa.trim()}%`]
    );

    return resultado.rows;
}

export async function listarAtivosPorTipo(
    tipo: TipoAtivo
): Promise<Ativo[]> {

    const resultado = await pool.query(
        `SELECT
            id,
            ticker,
            nome,
            tipo_ativo,
            setor,
            bolsa,
            logo_url,
            ativo_no_mercado,
            atualizado_em
         FROM ativos
         WHERE tipo_ativo = $1
         AND ativo_no_mercado = TRUE
         ORDER BY ticker`,
        [tipo]
    );

    return resultado.rows;
}

export async function buscarAtivoPorId(
    id: string
): Promise<Ativo | null> {

    const resultado = await pool.query(
        `SELECT *
         FROM ativos
         WHERE id = $1`,
        [id]
    );

    return resultado.rows[0] ?? null;
}

export async function buscarAtivoPorTicker(
    ticker: string
): Promise<Ativo | null> {

    const resultado = await pool.query(
        `SELECT *
         FROM ativos
         WHERE ticker = $1`,
        [ticker.toUpperCase().trim()]
    );

    return resultado.rows[0] ?? null;
}

export async function salvarAtivo(
    ativo: {
        ticker: string;
        nome: string;
        tipo_ativo: TipoAtivo;
        setor?: string | null;
        bolsa?: string;
        logo_url?: string | null;
        ativo_no_mercado?: boolean;
    }
): Promise<Ativo> {

    const resultado = await pool.query(
        `INSERT INTO ativos (
            ticker,
            nome,
            tipo_ativo,
            setor,
            bolsa,
            logo_url,
            ativo_no_mercado,
            atualizado_em
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         ON CONFLICT (ticker)
         DO UPDATE SET
            nome = EXCLUDED.nome,
            tipo_ativo = EXCLUDED.tipo_ativo,
            setor = EXCLUDED.setor,
            bolsa = EXCLUDED.bolsa,
            logo_url = EXCLUDED.logo_url,
            ativo_no_mercado = EXCLUDED.ativo_no_mercado,
            atualizado_em = NOW()
         RETURNING *`,
        [
            ativo.ticker.toUpperCase().trim(),
            ativo.nome,
            ativo.tipo_ativo,
            ativo.setor ?? null,
            ativo.bolsa ?? "B3",
            ativo.logo_url ?? null,
            ativo.ativo_no_mercado ?? true
        ]
    );

    return resultado.rows[0];
}
