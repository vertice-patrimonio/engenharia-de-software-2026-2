
import { Pool } from "pg";

const globalForPg = globalThis as unknown as {
    pgPool?: Pool;
};

function criarPool(): Pool {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        throw new Error(
            "A variável DATABASE_URL não foi configurada."
        );
    }

    return new Pool({
        connectionString,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
    });
}

export const pool =
    globalForPg.pgPool ?? criarPool();

if (process.env.NODE_ENV !== "production") {
    globalForPg.pgPool = pool;
}

export async function testarConexao() {
    const resultado = await pool.query(
        "SELECT current_database() AS banco"
    );

    return resultado.rows[0].banco as string;
}
