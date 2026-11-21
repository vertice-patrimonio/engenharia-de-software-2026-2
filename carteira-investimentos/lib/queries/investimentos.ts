
import { pool } from "@/lib/db";
import { InvestimentoComAtivo } from "@/lib/tipos";

export async function listarInvestimentos(
    carteiraId: string
): Promise<InvestimentoComAtivo[]> {

    const resultado = await pool.query(
        `SELECT
            i.id,
            a.id AS ativo_id,
            a.ticker,
            a.nome,
            a.tipo_ativo,
            a.logo_url,
            i.quantidade,
            i.valor_investido,
            ROUND(
                i.valor_investido / i.quantidade,
                2
            ) AS preco_medio
         FROM investimentos i
         INNER JOIN ativos a
            ON a.id = i.ativo_id
         WHERE i.carteira_id = $1
         ORDER BY a.ticker`,
        [carteiraId]
    );

    return resultado.rows;
}

export async function buscarInvestimento(
    investimentoId: string,
    carteiraId: string
): Promise<InvestimentoComAtivo | null> {

    const resultado = await pool.query(
        `SELECT
            i.id,
            a.id AS ativo_id,
            a.ticker,
            a.nome,
            a.tipo_ativo,
            a.logo_url,
            i.quantidade,
            i.valor_investido,
            ROUND(
                i.valor_investido / i.quantidade,
                2
            ) AS preco_medio
         FROM investimentos i
         INNER JOIN ativos a
            ON a.id = i.ativo_id
         WHERE i.id = $1
         AND i.carteira_id = $2`,
        [investimentoId, carteiraId]
    );

    return resultado.rows[0] ?? null;
}

export async function calcularTotalInvestido(
    carteiraId: string
): Promise<number> {

    const resultado = await pool.query(
        `SELECT COALESCE(
            SUM(valor_investido),
            0
         ) AS total_investido
         FROM investimentos
         WHERE carteira_id = $1`,
        [carteiraId]
    );

    return Number(resultado.rows[0].total_investido);
}

export async function contarAtivos(
    carteiraId: string
): Promise<number> {

    const resultado = await pool.query(
        `SELECT COUNT(*) AS quantidade_ativos
         FROM investimentos
         WHERE carteira_id = $1`,
        [carteiraId]
    );

    return Number(resultado.rows[0].quantidade_ativos);
}

export async function excluirInvestimento(
    investimentoId: string,
    carteiraId: string
): Promise<boolean> {

    const resultado = await pool.query(
        `DELETE FROM investimentos
         WHERE id = $1
         AND carteira_id = $2`,
        [investimentoId, carteiraId]
    );

    return resultado.rowCount !== 0;
}
