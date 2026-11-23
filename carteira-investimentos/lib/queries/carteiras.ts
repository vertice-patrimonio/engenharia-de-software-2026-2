import { pool } from "@/lib/db";
import { Carteira } from "@/lib/tipos";

export async function buscarCarteiraPorUsuario(
  usuarioId: string,
): Promise<Carteira | null> {
  const resultado = await pool.query(
    `SELECT
            id,
            usuario_id,
            nome,
            criado_em
         FROM carteiras
         WHERE usuario_id = $1`,
    [usuarioId],
  );

  return resultado.rows[0] ?? null;
}

export async function buscarCarteiraPorId(
  carteiraId: string,
): Promise<Carteira | null> {
  const resultado = await pool.query(
    `SELECT
            id,
            usuario_id,
            nome,
            criado_em
         FROM carteiras
         WHERE id = $1`,
    [carteiraId],
  );

  return resultado.rows[0] ?? null;
}

export async function verificarProprietarioCarteira(
  carteiraId: string,
  usuarioId: string,
): Promise<boolean> {
  const resultado = await pool.query(
    `SELECT 1
         FROM carteiras
         WHERE id = $1
         AND usuario_id = $2`,
    [carteiraId, usuarioId],
  );

  return resultado.rowCount !== 0;
}

export async function atualizarNomeCarteira(
  carteiraId: string,
  usuarioId: string,
  nome: string,
): Promise<Carteira | null> {
  const resultado = await pool.query(
    `UPDATE carteiras
         SET nome = $3
         WHERE id = $1
         AND usuario_id = $2
         RETURNING
            id,
            usuario_id,
            nome,
            criado_em`,
    [carteiraId, usuarioId, nome.trim()],
  );

  return resultado.rows[0] ?? null;
}

export async function contarInvestimentosCarteira(
  carteiraId: string,
): Promise<number> {
  const resultado = await pool.query(
    `SELECT COUNT(*) AS quantidade
         FROM investimentos
         WHERE carteira_id = $1`,
    [carteiraId],
  );

  return Number(resultado.rows[0].quantidade);
}
