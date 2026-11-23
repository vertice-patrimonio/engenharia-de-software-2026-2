"use client";

import { useEffect, useMemo, useState, FormEvent } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Plus,
  Filter,
  CalendarDays,
  ArrowUpDown,
  Wallet,
  CircleDollarSign,
  X,
} from "lucide-react";

type TipoOperacao = "COMPRA" | "VENDA";

interface Ativo {
  id: string;
  ticker: string;
  nome: string;
  tipo: string;
}

interface OperacaoAPI {
  id: string;
  carteira_id: string;
  ativo_id: string;
  tipo: TipoOperacao;
  quantidade: string | number;
  preco_unitario: string | number;
  taxas: string | number;
  data_operacao: string;
}

const formatarMoeda = (valor: number) =>
  valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const formatarData = (data: string) => {
  const apenasData = data.split("T")[0];
  return new Date(`${apenasData}T12:00:00`).toLocaleDateString("pt-BR");
};

export default function TransacoesPage() {
  const [operacoes, setOperacoes] = useState<OperacaoAPI[]>([]);
  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [erroTela, setErroTela] = useState("");

  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("Todos");

  // Estados do Modal de Nova Transação
  const [modalAberto, setModalAberto] = useState(false);
  const [ativoId, setAtivoId] = useState("");
  const [tipo, setTipo] = useState<TipoOperacao>("COMPRA");
  const [quantidade, setQuantidade] = useState("");
  const [precoUnitario, setPrecoUnitario] = useState("");
  const [taxas, setTaxas] = useState("0");
  const [dataOperacao, setDataOperacao] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [erroModal, setErroModal] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function recarregarDados() {
    try {
      const [resOperacoes, resAtivos] = await Promise.all([
        fetch("/api/operacoes"),
        fetch("/api/ativos"),
      ]);

      if (!resOperacoes.ok) {
        const err = await resOperacoes.json();
        setErroTela(err.erro || "Faça login para visualizar suas transações.");
        return;
      }

      const dadosOperacoes = await resOperacoes.json();
      const dadosAtivos = resAtivos.ok ? await resAtivos.json() : [];

      setOperacoes(dadosOperacoes);
      setAtivos(dadosAtivos);
    } catch {
      setErroTela("Erro de conexão ao carregar transações.");
    }
  }

  useEffect(() => {
    let ativo = true;

    async function inicializar() {
      try {
        const [resOperacoes, resAtivos] = await Promise.all([
          fetch("/api/operacoes"),
          fetch("/api/ativos"),
        ]);

        if (!ativo) return;

        if (!resOperacoes.ok) {
          const err = await resOperacoes.json();
          setErroTela(
            err.erro || "Faça login para visualizar suas transações.",
          );
          setCarregandoDados(false);
          return;
        }

        const dadosOperacoes = await resOperacoes.json();
        const dadosAtivos = resAtivos.ok ? await resAtivos.json() : [];

        setOperacoes(dadosOperacoes);
        setAtivos(dadosAtivos);

        if (dadosAtivos.length > 0) {
          setAtivoId((atual) => atual || dadosAtivos[0].id);
        }
      } catch {
        if (ativo) {
          setErroTela("Erro de conexão ao carregar transações.");
        }
      } finally {
        if (ativo) {
          setCarregandoDados(false);
        }
      }
    }

    inicializar();

    return () => {
      ativo = false;
    };
  }, []);

  const mapaAtivos = useMemo(() => {
    const mapa = new Map<string, Ativo>();
    ativos.forEach((ativo) => mapa.set(ativo.id, ativo));
    return mapa;
  }, [ativos]);

  const transacoesEnriquecidas = useMemo(() => {
    return operacoes.map((op) => {
      const ativo = mapaAtivos.get(op.ativo_id);
      return {
        ...op,
        ticker: ativo?.ticker || "ATIVO",
        nomeAtivo: ativo?.nome || "Ativo não identificado",
        qtdNum: Number(op.quantidade),
        precoNum: Number(op.preco_unitario),
        taxasNum: Number(op.taxas || 0),
      };
    });
  }, [operacoes, mapaAtivos]);

  const transacoesFiltradas = useMemo(() => {
    return transacoesEnriquecidas.filter((transacao) => {
      const correspondeBusca =
        transacao.ticker.toLowerCase().includes(busca.toLowerCase()) ||
        transacao.nomeAtivo.toLowerCase().includes(busca.toLowerCase());

      const correspondeTipo =
        filtroTipo === "Todos" || transacao.tipo === filtroTipo;

      return correspondeBusca && correspondeTipo;
    });
  }, [transacoesEnriquecidas, busca, filtroTipo]);

  const totalCompras = transacoesEnriquecidas
    .filter((t) => t.tipo === "COMPRA")
    .reduce((total, t) => total + t.qtdNum * t.precoNum + t.taxasNum, 0);

  const totalVendas = transacoesEnriquecidas
    .filter((t) => t.tipo === "VENDA")
    .reduce((total, t) => total + t.qtdNum * t.precoNum - t.taxasNum, 0);

  const totalTaxas = transacoesEnriquecidas.reduce(
    (total, t) => total + t.taxasNum,
    0,
  );

  const totalMovimentado = totalCompras + totalVendas;

  async function handleCriarTransacao(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErroModal("");
    setSalvando(true);

    try {
      const resposta = await fetch("/api/operacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ativoId,
          tipo,
          quantidade: Number(quantidade),
          precoUnitario: Number(precoUnitario),
          taxas: Number(taxas || 0),
          dataOperacao,
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErroModal(dados.erro || "Não foi possível registrar a operação.");
        return;
      }

      setQuantidade("");
      setPrecoUnitario("");
      setTaxas("0");
      setModalAberto(false);
      await recarregarDados();
    } catch {
      setErroModal("Erro de conexão com o servidor.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="min-h-screen space-y-6 bg-slate-950 p-4 text-slate-200 md:p-6">
      {/* Cabeçalho */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Transações</h1>

          <p className="mt-1 text-sm text-zinc-400">
            Histórico de movimentações e aportes da sua carteira.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setErroModal("");
            setModalAberto(true);
          }}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
        >
          <Plus size={18} />
          Nova transação
        </button>
      </header>

      {erroTela && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {erroTela}
        </div>
      )}

      {/* Cards de resumo */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-400">Total movimentado</p>

            <CircleDollarSign size={20} className="text-emerald-400" />
          </div>

          <h2 className="mt-3 text-2xl font-bold text-white">
            {formatarMoeda(totalMovimentado)}
          </h2>

          <p className="mt-2 text-xs text-zinc-500">Compras e vendas</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-400">Total em compras</p>

            <ArrowDownLeft size={20} className="text-blue-400" />
          </div>

          <h2 className="mt-3 text-2xl font-bold text-white">
            {formatarMoeda(totalCompras)}
          </h2>

          <p className="mt-2 text-xs text-zinc-500">Aportes realizados</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-400">Total em vendas</p>

            <ArrowUpRight size={20} className="text-rose-400" />
          </div>

          <h2 className="mt-3 text-2xl font-bold text-white">
            {formatarMoeda(totalVendas)}
          </h2>

          <p className="mt-2 text-xs text-zinc-500">
            Valores recebidos por vendas
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-400">Total em taxas</p>

            <Wallet size={20} className="text-amber-400" />
          </div>

          <h2 className="mt-3 text-2xl font-bold text-white">
            {formatarMoeda(totalTaxas)}
          </h2>

          <p className="mt-2 text-xs text-zinc-500">Custos operacionais</p>
        </div>
      </section>

      {/* Histórico de transações */}
      <section className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
        <div className="flex flex-col gap-4 border-b border-zinc-800 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Histórico de movimentações
            </h2>

            <p className="mt-1 text-sm text-zinc-400">
              Consulte e filtre as transações realizadas.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {/* Pesquisa */}
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              />

              <input
                type="text"
                placeholder="Buscar ativo..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-500 sm:w-56"
              />
            </div>

            {/* Filtro por tipo */}
            <div className="relative">
              <Filter
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              />

              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full appearance-none rounded-lg border border-zinc-700 bg-slate-950 py-2.5 pl-9 pr-8 text-sm text-white outline-none transition focus:border-emerald-500 sm:w-40"
              >
                <option value="Todos">Todos os tipos</option>
                <option value="COMPRA">Compra</option>
                <option value="VENDA">Venda</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-950/50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-5 py-4">
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays size={14} />
                    Data
                  </span>
                </th>

                <th className="px-5 py-4">Ativo</th>

                <th className="px-5 py-4">Tipo</th>

                <th className="px-5 py-4 text-right">Quantidade</th>

                <th className="px-5 py-4 text-right">Preço unitário</th>

                <th className="px-5 py-4 text-right">Taxas</th>

                <th className="px-5 py-4 text-right">Valor total</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-800/70">
              {carregandoDados ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-zinc-500"
                  >
                    Carregando transações...
                  </td>
                </tr>
              ) : (
                transacoesFiltradas.map((transacao) => {
                  const valorTotal =
                    transacao.qtdNum * transacao.precoNum +
                    (transacao.tipo === "COMPRA"
                      ? transacao.taxasNum
                      : -transacao.taxasNum);

                  return (
                    <tr
                      key={transacao.id}
                      className="transition hover:bg-zinc-800/30"
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-zinc-400">
                        {formatarData(transacao.data_operacao)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-semibold text-white">
                          {transacao.ticker}
                        </div>

                        <div className="mt-1 text-xs text-zinc-500">
                          {transacao.nomeAtivo}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                            transacao.tipo === "COMPRA"
                              ? "bg-blue-500/10 text-blue-400"
                              : "bg-rose-500/10 text-rose-400"
                          }`}
                        >
                          {transacao.tipo === "COMPRA" ? (
                            <ArrowDownLeft size={14} />
                          ) : (
                            <ArrowUpRight size={14} />
                          )}

                          {transacao.tipo === "COMPRA" ? "Compra" : "Venda"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right text-zinc-300">
                        {transacao.qtdNum}
                      </td>

                      <td className="px-5 py-4 text-right text-zinc-300">
                        {formatarMoeda(transacao.precoNum)}
                      </td>

                      <td className="px-5 py-4 text-right text-zinc-400">
                        {formatarMoeda(transacao.taxasNum)}
                      </td>

                      <td
                        className={`whitespace-nowrap px-5 py-4 text-right font-semibold ${
                          transacao.tipo === "COMPRA"
                            ? "text-blue-400"
                            : "text-rose-400"
                        }`}
                      >
                        {formatarMoeda(valorTotal)}
                      </td>
                    </tr>
                  );
                })
              )}

              {!carregandoDados && transacoesFiltradas.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-zinc-500"
                  >
                    Nenhuma transação encontrada.
                    <p className="mt-1 text-xs">
                      Clique em &quot;Nova transação&quot; para registrar sua
                      primeira operação.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé da tabela */}
        <div className="flex flex-col gap-2 border-t border-zinc-800 px-5 py-4 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Exibindo {transacoesFiltradas.length} de {operacoes.length}{" "}
            transações
          </p>

          <p className="inline-flex items-center gap-1">
            <ArrowUpDown size={14} />
            Ordenado por data
          </p>
        </div>
      </section>

      {/* Modal de Nova Transação */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-slate-900 p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Nova Transação</h2>
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {erroModal && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                {erroModal}
              </div>
            )}

            <form onSubmit={handleCriarTransacao} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">
                  Tipo de Operação
                </label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as TipoOperacao)}
                  className="w-full rounded-lg border border-zinc-700 bg-slate-950 p-2.5 text-sm text-white outline-none focus:border-emerald-500"
                >
                  <option value="COMPRA">Compra</option>
                  <option value="VENDA">Venda</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">
                  Ativo
                </label>
                <select
                  value={ativoId}
                  onChange={(e) => setAtivoId(e.target.value)}
                  required
                  className="w-full rounded-lg border border-zinc-700 bg-slate-950 p-2.5 text-sm text-white outline-none focus:border-emerald-500"
                >
                  <option value="" disabled>
                    Selecione um ativo
                  </option>
                  {ativos.map((ativo) => (
                    <option key={ativo.id} value={ativo.id}>
                      {ativo.ticker} — {ativo.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-400">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.000001"
                    placeholder="Ex: 10"
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value)}
                    required
                    className="w-full rounded-lg border border-zinc-700 bg-slate-950 p-2.5 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-400">
                    Preço Unitário (R$)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    placeholder="Ex: 35.50"
                    value={precoUnitario}
                    onChange={(e) => setPrecoUnitario(e.target.value)}
                    required
                    className="w-full rounded-lg border border-zinc-700 bg-slate-950 p-2.5 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-400">
                    Taxas (R$)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={taxas}
                    onChange={(e) => setTaxas(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-slate-950 p-2.5 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-400">
                    Data da Operação
                  </label>
                  <input
                    type="date"
                    value={dataOperacao}
                    onChange={(e) => setDataOperacao(e.target.value)}
                    required
                    className="w-full rounded-lg border border-zinc-700 bg-slate-950 p-2.5 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="cursor-pointer rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                >
                  {salvando ? "Salvando..." : "Registrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
