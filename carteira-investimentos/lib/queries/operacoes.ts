
import { pool } from "@/lib/db";
import { NovaOperacao, Operacao } from "@/lib/tipos";

export async function registrarOperacao(
    carteiraId: string,
    operacao: NovaOperacao
): Promise<Operacao> {

    const {
        ativoId,
        tipo,
        quantidade,
        precoUnitario,
        taxas = 0,
        dataOperacao
    } = operacao;

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Verifica se o ativo existe.
        const ativo = await client.query(
            `SELECT id
             FROM ativos
             WHERE id = $1`,
            [ativoId]
        );

        if (ativo.rowCount === 0) {
            throw new Error("Ativo não encontrado.");
        }

        // Calcula o valor da operação.
        const valorBruto =
            quantidade * precoUnitario;

        if (!Number.isFinite(valorBruto)) {
            throw new Error("Valor da operação inválido.");
        }

        if (tipo === "COMPRA") {

            // Custo da compra, incluindo taxas.
            const valorCompra =
                valorBruto + taxas;

            // Atualiza ou cria a posição.
            await client.query(
                `INSERT INTO investimentos (
                    carteira_id,
                    ativo_id,
                    quantidade,
                    valor_investido
                 )
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (carteira_id, ativo_id)
                 DO UPDATE SET
                    quantidade =
                        investimentos.quantidade +
                        EXCLUDED.quantidade,
                    valor_investido =
                        investimentos.valor_investido +
                        EXCLUDED.valor_investido,
                    atualizado_em = NOW()`,
                [
                    carteiraId,
                    ativoId,
                    quantidade,
                    valorCompra
                ]
            );

        } else {

            // Bloqueia a posição durante a venda.
            const posicao = await client.query(
                `SELECT
                    quantidade,
                    valor_investido
                 FROM investimentos
                 WHERE carteira_id = $1
                 AND ativo_id = $2
                 FOR UPDATE`,
                [carteiraId, ativoId]
            );

            if (posicao.rowCount === 0) {
                throw new Error(
                    "Você não possui esse ativo na carteira."
                );
            }

            const quantidadeAtual = Number(
                posicao.rows[0].quantidade
            );

            const valorInvestido = Number(
                posicao.rows[0].valor_investido
            );

            if (quantidade > quantidadeAtual) {
                throw new Error(
                    "Quantidade de venda superior à posição disponível."
                );
            }

            const quantidadeRestante =
                quantidadeAtual - quantidade;

            if (quantidadeRestante <= 0.000000005) {

                await client.query(
                    `DELETE FROM investimentos
                     WHERE carteira_id = $1
                     AND ativo_id = $2`,
                    [carteiraId, ativoId]
                );

            } else {

                // Mantém o custo médio da posição.
                await client.query(
                    `UPDATE investimentos
                     SET
                        quantidade = $3::numeric,
                        valor_investido = ROUND(
                            valor_investido *
                            $3::numeric / quantidade,
                            2
                        ),
                        atualizado_em = NOW()
                     WHERE carteira_id = $1
                     AND ativo_id = $2`,
                    [
                        carteiraId,
                        ativoId,
                        quantidadeRestante
                    ]
                );
            }
        }

        // Registra a operação.
        const resultado = await client.query(
            `INSERT INTO operacoes (
                carteira_id,
                ativo_id,
                tipo,
                quantidade,
                preco_unitario,
                taxas,
                data_operacao
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [
                carteiraId,
                ativoId,
                tipo,
                quantidade,
                precoUnitario,
                taxas,
                dataOperacao
            ]
        );

        await client.query("COMMIT");

        return resultado.rows[0];

    } catch (erro) {

        await client.query("ROLLBACK");

        throw erro;

    } finally {

        client.release();
    }
}

export async function listarOperacoes(
    carteiraId: string
): Promise<Operacao[]> {

    const resultado = await pool.query(
        `SELECT
            o.id,
            o.carteira_id,
            o.ativo_id,
            o.tipo,
            o.quantidade,
            o.preco_unitario,
            o.taxas,
            o.data_operacao,
            o.criado_em
         FROM operacoes o
         WHERE o.carteira_id = $1
         ORDER BY
            o.data_operacao DESC,
            o.criado_em DESC`,
        [carteiraId]
    );

    return resultado.rows;
}

export async function buscarOperacoesPorAtivo(
    carteiraId: string,
    ativoId: string
): Promise<Operacao[]> {

    const resultado = await pool.query(
        `SELECT *
         FROM operacoes
         WHERE carteira_id = $1
         AND ativo_id = $2
         ORDER BY data_operacao DESC, criado_em DESC`,
        [carteiraId, ativoId]
    );

    return resultado.rows;
}

export async function contarOperacoes(
    carteiraId: string
) {

    const resultado = await pool.query(
        `SELECT
            COUNT(*) AS total_operacoes,
            COUNT(*) FILTER (
                WHERE tipo = 'COMPRA'
            ) AS total_compras,
            COUNT(*) FILTER (
                WHERE tipo = 'VENDA'
            ) AS total_vendas
         FROM operacoes
         WHERE carteira_id = $1`,
        [carteiraId]
    );

    return {
        totalOperacoes: Number(
            resultado.rows[0].total_operacoes
        ),
        totalCompras: Number(
            resultado.rows[0].total_compras
        ),
        totalVendas: Number(
            resultado.rows[0].total_vendas
        )
    };
}

export async function calcularTotaisOperacoes(
    carteiraId: string
) {

    const resultado = await pool.query(
        `SELECT
            COALESCE(
                SUM(
                    CASE
                        WHEN tipo = 'COMPRA'
                        THEN quantidade * preco_unitario + taxas
                        ELSE 0
                    END
                ), 0
            ) AS total_compras,

            COALESCE(
                SUM(
                    CASE
                        WHEN tipo = 'VENDA'
                        THEN quantidade * preco_unitario - taxas
                        ELSE 0
                    END
                ), 0
            ) AS total_vendas

         FROM operacoes
         WHERE carteira_id = $1`,
        [carteiraId]
    );

    return {
        totalCompras: Number(
            resultado.rows[0].total_compras
        ),
        totalVendas: Number(
            resultado.rows[0].total_vendas
        )
    };
}
