
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
    try {
        const resultado = await pool.query(
            `SELECT current_database() AS banco`
        );

        const tabelas = await pool.query(
            `SELECT table_name
             FROM information_schema.tables
             WHERE table_schema = 'public'
             AND table_type = 'BASE TABLE'
             ORDER BY table_name`
        );

        return NextResponse.json({
            conectado: true,
            banco: resultado.rows[0].banco,
            tabelas: tabelas.rows.map(
                (item) => item.table_name
            ),
        });

    } catch (erro) {
        console.error("Erro no PostgreSQL:", erro);

        return NextResponse.json(
            {
                conectado: false,
                erro: "Não foi possível conectar ao PostgreSQL.",
            },
            { status: 500 }
        );
    }
}
