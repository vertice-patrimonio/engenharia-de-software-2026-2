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
  tipo?: string;
  tipo_ativo?: string;
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

  // Estados do Modal de Nova Transação (sem new Date() direto no useState para não bloquear o prerender no Next.js 16)
  const [modalAberto, setModalAberto] = useState(false);
  const [ativoId, setAtivoId] = useState("");
  const [tipo, setTipo] = useState<TipoOperacao>("COMPRA");
  const [quantidade, setQuantidade] = useState("");
  const [precoUnitario, setPrecoUnitario] = useState("");
  const [taxas, setTaxas] = useState("0");
  const [dataOperacao, setDataOperacao] = useState("");
  const [buscandoCotacao, setBuscandoCotacao] = useState(false);
  const [avisoCotacao, setAvisoCotacao] = useState("");
  const [erroModal, setErroModal] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function recarregarDados() {
    try {
      const [resOperacoes, resAtivos] = await Promise.all([
        fetch("/api/operacoes", { cache: "no-store" }),
        fetch("/api/ativos", { cache: "no-store" }),
      ]);

      if (!resOperacoes.ok) {
        const err = await resOperacoes.json().catch(() => ({}));
        setErroTela(err.erro || "Faça login para visualizar suas transações.");
        return;
      }

      const dadosOperacoes = await resOperacoes.json();
      const dadosAtivos = resAtivos.ok ? await resAtivos.json() : [];

      setOperacoes(Array.isArray(dadosOperacoes) ? dadosOperacoes : []);
      setAtivos(Array.isArray(dadosAtivos) ? dadosAtivos : []);
    } catch {
      setErroTela("Erro de conexão ao carregar transações.");
    }
  }

  useEffect(() => {
    let ativo = true;

    setDataOperacao((atual) => atual || new Date().toISOString().split("T")[0]);

    async function inicializar() {
      try {
        const [resOperacoes, resAtivos] = await Promise.all([
          fetch("/api/operacoes", { cache: "no-store" }),
          fetch("/api/ativos", { cache: "no-store" }),
        ]);

        if (!ativo) return;

        if (!resOperacoes.ok) {
          const err = await resOperacoes.json().catch(() => ({}));
          setErroTela(
            err.erro || "Faça login para visualizar suas transações.",
          );
          setCarregandoDados(false);
          return;
        }

        const dadosOperacoes = await resOperacoes.json();
        const dadosAtivos = resAtivos.ok ? await resAtivos.json() : [];

        const listaOperacoes = Array.isArray(dadosOperacoes)
          ? dadosOperacoes
          : [];
        const listaAtivos = Array.isArray(dadosAtivos) ? dadosAtivos : [];

        setOperacoes(listaOperacoes);
        setAtivos(listaAtivos);

        if (listaAtivos.length > 0) {
          setAtivoId((atual) => atual || listaAtivos[0].id);
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

  // Busca automaticamente o preço unitário atual ao abrir o modal ou trocar o ativo
  useEffect(() => {
    if (!modalAberto || !ativoId) return;

    const ativoSelecionado = ativos.find((a) => a.id === ativoId);
    if (!ativoSelecionado?.ticker) return;

    let cancelado = false;

    async function puxarPrecoAtual() {
      try {
        setBuscandoCotacao(true);
        setAvisoCotacao("");

        const res = await fetch(
          `/api/cotacao?ticker=${encodeURIComponent(ativoSelecionado!.ticker)}`,
          { cache: "no-store" },
        );

        if (cancelado) return;

        if (!res.ok) {
          setAvisoCotacao(
            "Cotação indisponível no momento; informe o preço manualmente.",
          );
          return;
        }

        const dados = await res.json();
        if (typeof dados.precoAtual === "number" && dados.precoAtual > 0) {
          setPrecoUnitario(String(dados.precoAtual));
          setAvisoCotacao(
            `Cotação atual de ${ativoSelecionado!.ticker} preenchida automaticamente.`,
          );
        } else {
          setAvisoCotacao(
            "Cotação não encontrada; informe o preço manualmente.",
          );
        }
      } catch {
        if (!cancelado) {
          setAvisoCotacao(
            "Erro ao buscar cotação; informe o preço manualmente.",
          );
        }
      } finally {
        if (!cancelado) {
          setBuscandoCotacao(false);
        }
      }
    }

    puxarPrecoAtual();

    return () => {
      cancelado = true;
    };
  }, [modalAberto, ativoId, ativos]);

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
      setDataOperacao(new Date().toISOString().split("T")[0]);
      setAvisoCotacao("");
      setModalAberto(false);
      await recarregarDados();
    } catch {
      setErroModal("Erro de conexão com o servidor.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-slate-900">
      {/* Cabeçalho */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Transações
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Histórico de movimentações e aportes da sua carteira.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setErroModal("");
            setAvisoCotacao("");
            if (!dataOperacao) {
              setDataOperacao(new Date().toISOString().split("T")[0]);
            }
            if (!ativoId && ativos.length > 0) {
              setAtivoId(ativos[0].id);
            }
            setModalAberto(true);
          }}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-emerald-600"
        >
          <Plus size={18} />
          Nova transação
        </button>
      </header>

      {erroTela && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
          {erroTela}
        </div>
      )}

      {/* Cards de resumo */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Total movimentado
            </p>

            <CircleDollarSign size={20} className="text-emerald-600" />
          </div>

          <h2 className="mt-3 text-2xl font-bold text-slate-900">
            {formatarMoeda(totalMovimentado)}
          </h2>

          <p className="mt-2 text-xs text-slate-400">Compras e vendas</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Total em compras
            </p>

            <ArrowDownLeft size={20} className="text-blue-600" />
          </div>

          <h2 className="mt-3 text-2xl font-bold text-slate-900">
            {formatarMoeda(totalCompras)}
          </h2>

          <p className="mt-2 text-xs text-slate-400">Aportes realizados</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Total em vendas
            </p>

            <ArrowUpRight size={20} className="text-rose-600" />
          </div>

          <h2 className="mt-3 text-2xl font-bold text-slate-900">
            {formatarMoeda(totalVendas)}
          </h2>

          <p className="mt-2 text-xs text-slate-400">
            Valores recebidos por vendas
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Total em taxas</p>

            <Wallet size={20} className="text-amber-600" />
          </div>

          <h2 className="mt-3 text-2xl font-bold text-slate-900">
            {formatarMoeda(totalTaxas)}
          </h2>

          <p className="mt-2 text-xs text-slate-400">Custos operacionais</p>
        </div>
      </section>

      {/* Histórico de transações */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Histórico de movimentações
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Consulte e filtre as transações realizadas.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {/* Pesquisa */}
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                placeholder="Buscar ativo..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white sm:w-56"
              />
            </div>

            {/* Filtro por tipo */}
            <div className="relative">
              <Filter
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-8 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white sm:w-40"
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
          <table className="w-full min-w-[850px] border-collapse text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-3.5">
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays size={14} />
                    Data
                  </span>
                </th>

                <th className="px-5 py-3.5">Ativo</th>

                <th className="px-5 py-3.5">Tipo</th>

                <th className="px-5 py-3.5 text-right">Quantidade</th>

                <th className="px-5 py-3.5 text-right">Preço unitário</th>

                <th className="px-5 py-3.5 text-right">Taxas</th>

                <th className="px-5 py-3.5 text-right">Valor total</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {carregandoDados ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-slate-500"
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
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                        {formatarData(transacao.data_operacao)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">
                          {transacao.ticker}
                        </div>

                        <div className="mt-0.5 text-xs text-slate-500">
                          {transacao.nomeAtivo}
                        </div>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                            transacao.tipo === "COMPRA"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-rose-50 text-rose-700"
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

                      <td className="whitespace-nowrap px-5 py-4 text-right font-medium text-slate-700">
                        {transacao.qtdNum}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right font-medium text-slate-700">
                        {formatarMoeda(transacao.precoNum)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right text-slate-500">
                        {formatarMoeda(transacao.taxasNum)}
                      </td>

                      <td
                        className={`whitespace-nowrap px-5 py-4 text-right font-bold ${
                          transacao.tipo === "COMPRA"
                            ? "text-blue-600"
                            : "text-rose-600"
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
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    Nenhuma transação encontrada.
                    <p className="mt-1 text-xs text-slate-400">
                      Clique em "Nova transação" para registrar sua
                      primeira operação.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé da tabela */}
        <div className="flex flex-col gap-2 border-t border-slate-100 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-[1px] p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                Nova Transação
              </h2>
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {erroModal && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">
                {erroModal}
              </div>
            )}

            <form onSubmit={handleCriarTransacao} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Tipo de Operação
                </label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as TipoOperacao)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white"
                >
                  <option value="COMPRA">Compra</option>
                  <option value="VENDA">Venda</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Ativo
                </label>
                <select
                  value={ativoId}
                  onChange={(e) => setAtivoId(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white"
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
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
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
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Preço Unitário (R$)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    placeholder={buscandoCotacao ? "Buscando..." : "Ex: 35.50"}
                    value={precoUnitario}
                    onChange={(e) => {
                      setPrecoUnitario(e.target.value);
                      setAvisoCotacao("");
                    }}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white"
                  />
                  {buscandoCotacao ? (
                    <p className="mt-1 text-[11px] text-slate-400">
                      Buscando cotação atual...
                    </p>
                  ) : (
                    avisoCotacao && (
                      <p className="mt-1 text-[11px] text-emerald-600">
                        {avisoCotacao}
                      </p>
                    )
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Taxas (R$)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={taxas}
                    onChange={(e) => setTaxas(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Data da Operação
                  </label>
                  <input
                    type="date"
                    value={dataOperacao}
                    onChange={(e) => setDataOperacao(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
                >
                  {salvando ? "Salvando..." : "Registrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}