
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

import { Pool } from "pg";

interface AtivoBrapi {
    stock: string;
    name: string;
    type?: string;
    subType?: string;
    sector?: string;
    logo?: string;
}

interface RespostaBrapi {
    stocks: AtivoBrapi[];
    currentPage?: number;
    totalPages?: number;
    hasNextPage?: boolean;
}

function converterTipo(
    subTipo: string | undefined
): "ACAO" | "FII" | "ETF" | "BDR" | "OUTRO" {

    switch (subTipo?.toLowerCase()) {
        case "stock":
        case "unit":
            return "ACAO";

        case "fii":
            return "FII";

        case "etf":
            return "ETF";

        case "bdr":
            return "BDR";

        default:
            return "OUTRO";
    }
}

async function buscarPagina(
    pagina: number
): Promise<RespostaBrapi> {

    const url = new URL(
        "https://brapi.dev/api/quote/list"
    );

    url.searchParams.set("limit", "2000");
    url.searchParams.set("page", String(pagina));

    const resposta = await fetch(url.toString(), {
        signal: AbortSignal.timeout(20000),
    });

    if (!resposta.ok) {
        throw new Error(
            `Erro ao consultar a brapi: HTTP ${resposta.status}`
        );
    }

    return await resposta.json();
}

async function sincronizar() {

    if (!process.env.DATABASE_URL) {
        throw new Error(
            "DATABASE_URL não configurada."
        );
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    const client = await pool.connect();

    let totalProcessado = 0;

    try {

        console.log("Iniciando sincronização de ativos...");

        await client.query("BEGIN");

        let pagina = 1;
        let continuar = true;

        while (continuar) {

            console.log(`Consultando página ${pagina}...`);

            const dados = await buscarPagina(pagina);

            const ativos = dados.stocks ?? [];

            for (const ativo of ativos) {

                if (!ativo.stock || !ativo.name) {
                    continue;
                }

                const ticker = ativo.stock
                    .trim()
                    .toUpperCase();

                const nome = ativo.name.trim();

                if (!ticker || !nome) {
                    continue;
                }

                await client.query(
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
                    VALUES (
                        $1, $2, $3, $4, $5, $6, TRUE, NOW()
                    )
                    ON CONFLICT (ticker)
                    DO UPDATE SET
                        nome = EXCLUDED.nome,
                        tipo_ativo = EXCLUDED.tipo_ativo,
                        setor = EXCLUDED.setor,
                        bolsa = EXCLUDED.bolsa,
                        logo_url = EXCLUDED.logo_url,
                        ativo_no_mercado = TRUE,
                        atualizado_em = NOW()`,
                    [
                        ticker,
                        nome,
                        converterTipo(ativo.subType),
                        ativo.sector ?? null,
                        "B3",
                        ativo.logo ?? null,
                    ]
                );

                totalProcessado++;
            }

            continuar =
                dados.hasNextPage === true &&
                dados.totalPages !== undefined &&
                pagina < dados.totalPages;

            pagina++;

            if (pagina > 100) {
                throw new Error(
                    "Limite de páginas excedido."
                );
            }
        }

        await client.query("COMMIT");

        console.log("--------------------------------");
        console.log("Sincronização concluída!");
        console.log(`Ativos processados: ${totalProcessado}`);
        console.log("--------------------------------");

    } catch (erro) {

        await client.query("ROLLBACK");

        console.error(
            "Erro na sincronização:",
            erro
        );

        process.exitCode = 1;

    } finally {

        client.release();

        await pool.end();
    }
}

sincronizar().catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
});
