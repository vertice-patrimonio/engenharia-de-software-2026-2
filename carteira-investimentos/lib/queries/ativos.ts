import { getSupabaseAdmin } from "@/lib/supabase";
import { Ativo, TipoAtivo } from "@/lib/tipos";

const COLUNAS_ATIVO =
  "id, ticker, nome, tipo_ativo, setor, bolsa, logo_url, ativo_no_mercado, atualizado_em";

export async function listarAtivos(): Promise<Ativo[]> {
  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from("ativos")
    .select(COLUNAS_ATIVO)
    .eq("ativo_no_mercado", true)
    .order("ticker", { ascending: true });

  if (error) {
    console.error("Erro ao listar ativos:", error);
    throw error;
  }

  return (data as Ativo[]) ?? [];
}

export async function pesquisarAtivos(pesquisa: string): Promise<Ativo[]> {
  const supabaseAdmin = getSupabaseAdmin();
  const termo = pesquisa.trim().replace(/[%_,]/g, "");

  if (!termo) {
    return [];
  }

  const { data, error } = await supabaseAdmin
    .from("ativos")
    .select(COLUNAS_ATIVO)
    .eq("ativo_no_mercado", true)
    .or(`ticker.ilike.%${termo}%,nome.ilike.%${termo}%`)
    .order("ticker", { ascending: true })
    .limit(30);

  if (error) {
    console.error("Erro ao pesquisar ativos:", error);
    throw error;
  }

  return (data as Ativo[]) ?? [];
}

export async function listarAtivosPorTipo(tipo: TipoAtivo): Promise<Ativo[]> {
  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from("ativos")
    .select(COLUNAS_ATIVO)
    .eq("tipo_ativo", tipo)
    .eq("ativo_no_mercado", true)
    .order("ticker", { ascending: true });

  if (error) {
    console.error("Erro ao listar ativos por tipo:", error);
    throw error;
  }

  return (data as Ativo[]) ?? [];
}

export async function buscarAtivoPorId(id: string): Promise<Ativo | null> {
  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from("ativos")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar ativo por ID:", error);
    throw error;
  }

  return (data as Ativo) ?? null;
}

export async function buscarAtivoPorTicker(
  ticker: string,
): Promise<Ativo | null> {
  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from("ativos")
    .select("*")
    .eq("ticker", ticker.toUpperCase().trim())
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar ativo por ticker:", error);
    throw error;
  }

  return (data as Ativo) ?? null;
}

export async function salvarAtivo(ativo: {
  ticker: string;
  nome: string;
  tipo_ativo: TipoAtivo;
  setor?: string | null;
  bolsa?: string;
  logo_url?: string | null;
  ativo_no_mercado?: boolean;
}): Promise<Ativo> {
  const supabaseAdmin = getSupabaseAdmin();

  const registro = {
    ticker: ativo.ticker.toUpperCase().trim(),
    nome: ativo.nome,
    tipo_ativo: ativo.tipo_ativo,
    setor: ativo.setor ?? null,
    bolsa: ativo.bolsa ?? "B3",
    logo_url: ativo.logo_url ?? null,
    ativo_no_mercado: ativo.ativo_no_mercado ?? true,
    atualizado_em: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from("ativos")
    .upsert(registro, { onConflict: "ticker" })
    .select("*")
    .single();

  if (error || !data) {
    console.error("Erro ao salvar ativo:", error);
    throw error ?? new Error("Não foi possível salvar o ativo.");
  }

  return data as Ativo;
}