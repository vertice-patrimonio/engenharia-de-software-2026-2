import { pool } from "@/lib/db";
import { buscarCotacoes } from "@/lib/brapi";

interface PosicaoBanco {
  ticker: string;
  nome: string;
  tipo_ativo: string;
  logo_url: string | null;
  quantidade: string;
  valor_investido: string;
}

export async function calcularResumoCarteira(usuarioId: string) {
  // 1. Busca a carteira do usuário.
  const carteira = await pool.query(
    `SELECT id
         FROM carteiras
         WHERE usuario_id = $1`,
    [usuarioId],
  );

  if (carteira.rowCount === 0) {
    throw new Error("Carteira não encontrada.");
  }

  const carteiraId = carteira.rows[0].id;

  // 2. Busca as posições.
  const resultado = await pool.query(
    `SELECT
            a.ticker,
            a.nome,
            a.tipo_ativo,
            a.logo_url,
            i.quantidade,
            i.valor_investido
         FROM investimentos i
         INNER JOIN ativos a
            ON a.id = i.ativo_id
         WHERE i.carteira_id = $1
         ORDER BY a.ticker`,
    [carteiraId],
  );

  const investimentos = resultado.rows as PosicaoBanco[];

  // 3. Retorna um resumo vazio quando necessário.
  if (investimentos.length === 0) {
    return {
      carteiraId,
      totalInvestido: 0,
      patrimonioAtual: 0,
      resultadoNaoRealizado: 0,
      rentabilidadePercentual: 0,
      quantidadeAtivos: 0,
      composicao: [],
      ativosSemCotacao: [],
      posicoes: [],
    };
  }

  // 4. Busca os preços dos ativos.
  const tickers = investimentos.map((item) => item.ticker);

  const cotacoes = await buscarCotacoes(tickers);

  const mapaCotacoes = new Map(
    cotacoes.map((item) => [item.ticker, item.preco]),
  );

  // 5. Calcula as posições individualmente.
  const posicoes = investimentos.map((item) => {
    const quantidade = Number(item.quantidade);

    const valorInvestido = Number(item.valor_investido);

    const precoMedio = valorInvestido / quantidade;

    const precoAtual = mapaCotacoes.get(item.ticker) ?? null;

    const valorAtual = precoAtual === null ? null : quantidade * precoAtual;

    const resultadoNaoRealizado =
      valorAtual === null ? null : valorAtual - valorInvestido;

    return {
      ticker: item.ticker,
      nome: item.nome,
      tipoAtivo: item.tipo_ativo,
      logoUrl: item.logo_url,
      quantidade,
      valorInvestido,
      precoMedio,
      precoAtual,
      valorAtual,
      resultadoNaoRealizado,
    };
  });

  // 6. Calcula o total investido.
  const totalInvestido = posicoes.reduce(
    (total, item) => total + item.valorInvestido,
    0,
  );

  // 7. Identifica ativos sem cotação.
  const ativosSemCotacao = posicoes
    .filter((item) => item.valorAtual === null)
    .map((item) => item.ticker);

  // 8. Calcula o patrimônio parcial.
  const patrimonioParcial = posicoes.reduce(
    (total, item) => total + (item.valorAtual ?? 0),
    0,
  );

  const cotacaoCompleta = ativosSemCotacao.length === 0;

  const patrimonioAtual = cotacaoCompleta ? patrimonioParcial : null;

  const resultadoNaoRealizado = cotacaoCompleta
    ? patrimonioParcial - totalInvestido
    : null;

  const rentabilidadePercentual =
    cotacaoCompleta && totalInvestido > 0
      ? (resultadoNaoRealizado! / totalInvestido) * 100
      : null;

  // 9. Calcula a composição por tipo de ativo.
  const mapaComposicao = new Map<string, number>();

  for (const item of posicoes) {
    const atual = mapaComposicao.get(item.tipoAtivo) ?? 0;

    mapaComposicao.set(item.tipoAtivo, atual + item.valorInvestido);
  }

  const composicao = Array.from(mapaComposicao.entries()).map(
    ([tipoAtivo, valor]) => ({
      tipoAtivo,
      valor,
      percentual: totalInvestido > 0 ? (valor / totalInvestido) * 100 : 0,
    }),
  );

  // 10. Retorna o resumo.
  return {
    carteiraId,
    totalInvestido,
    patrimonioAtual,
    patrimonioParcial,
    resultadoNaoRealizado,
    rentabilidadePercentual,
    quantidadeAtivos: posicoes.length,
    composicao,
    ativosSemCotacao,
    posicoes,
  };
}
