"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

interface InvestimentoAPI {
  id?: string;
  ativo_id: string;
  quantidade: string | number;
  valor_investido: string | number;
}

interface AtivoAPI {
  id: string;
  ticker: string;
  nome: string;
  tipo_ativo?: string;
  tipo?: string;
}

interface PosicaoLinha {
  id: string;
  ativoLabel: string;
  classe: string;
  quantidade: number;
  precoMedio: number;
  valorTotal: number;
}

interface ClasseAlocacao {
  chave: string;
  titulo: string;
  percentual: number;
  valor: number;
  corBarra: string;
}

function normalizarClasse(raw?: string) {
  const valor = (raw || "").toUpperCase().trim();
  if (valor.includes("FIXA") || valor === "RF") {
    return {
      chave: "RENDA_FIXA",
      badge: "Renda Fixa",
      titulo: "Renda Fixa",
      corBarra: "bg-emerald-500",
    };
  }
  if (valor === "FII" || valor.includes("IMOBILI")) {
    return {
      chave: "FII",
      badge: "FII",
      titulo: "Fundos Imobiliários (FII)",
      corBarra: "bg-purple-500",
    };
  }
  if (valor === "ACAO" || valor.includes("AÇ") || valor.includes("VARI")) {
    return {
      chave: "ACAO",
      badge: "Ações",
      titulo: "Ações (Renda Variável)",
      corBarra: "bg-blue-500",
    };
  }
  if (valor === "ETF") {
    return {
      chave: "ETF",
      badge: "ETF",
      titulo: "ETFs",
      corBarra: "bg-cyan-500",
    };
  }
  if (valor === "BDR") {
    return {
      chave: "BDR",
      badge: "BDR",
      titulo: "BDRs",
      corBarra: "bg-amber-500",
    };
  }
  return {
    chave: valor || "OUTRO",
    badge: raw || "Outro",
    titulo: raw || "Outros Ativos",
    corBarra: "bg-slate-600",
  };
}

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

function formatarQuantidade(valor: number) {
  const temDecimal = valor % 1 !== 0;
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: temDecimal ? 2 : 0,
    maximumFractionDigits: temDecimal ? 4 : 0,
  }).format(valor);
}

export default function MinhaCarteiraPage() {
  const [investimentos, setInvestimentos] = useState<InvestimentoAPI[]>([]);
  const [ativos, setAtivos] = useState<AtivoAPI[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativoMontado = true;

    async function carregarCarteira() {
      try {
        setErro("");
        const [resInv, resAtivos] = await Promise.all([
          fetch("/api/investimentos", { cache: "no-store" }),
          fetch("/api/ativos", { cache: "no-store" }),
        ]);

        if (!ativoMontado) return;

        if (!resInv.ok) {
          const errDados = await resInv.json().catch(() => ({}));
          setErro(errDados.erro || "Não foi possível carregar a carteira.");
          setCarregando(false);
          return;
        }

        const dadosInv = await resInv.json();
        const listaInv: InvestimentoAPI[] = Array.isArray(dadosInv)
          ? dadosInv
          : dadosInv.investimentos || [];

        setInvestimentos(listaInv.filter((item) => Number(item.quantidade) > 0));

        if (resAtivos.ok) {
          const dadosAtivos = await resAtivos.json();
          setAtivos(Array.isArray(dadosAtivos) ? dadosAtivos : []);
        }
      } catch (err) {
        console.error("Erro ao carregar carteira:", err);
        if (ativoMontado) {
          setErro("Erro de conexão ao carregar os dados da carteira.");
        }
      } finally {
        if (ativoMontado) {
          setCarregando(false);
        }
      }
    }

    carregarCarteira();

    return () => {
      ativoMontado = false;
    };
  }, []);

  const mapaAtivos = useMemo(() => {
    const mapa = new Map<string, AtivoAPI>();
    ativos.forEach((item) => mapa.set(item.id, item));
    return mapa;
  }, [ativos]);

  const posicoes = useMemo<PosicaoLinha[]>(() => {
    return investimentos.map((inv, idx) => {
      const ativo = mapaAtivos.get(inv.ativo_id);
      const qtd = Number(inv.quantidade || 0);
      const valorTotal = Number(inv.valor_investido || 0);
      const precoMedio = qtd > 0 ? valorTotal / qtd : 0;
      const classeInfo = normalizarClasse(ativo?.tipo_ativo || ativo?.tipo);

      const ativoLabel = ativo
        ? `${ativo.ticker} (${ativo.nome})`
        : inv.ativo_id;

      return {
        id: inv.id || `${inv.ativo_id}-${idx}`,
        ativoLabel,
        classe: classeInfo.badge,
        quantidade: qtd,
        precoMedio,
        valorTotal,
      };
    });
  }, [investimentos, mapaAtivos]);

  const totalAtivosCustodia = posicoes.length;
  const totalUnidades = useMemo(
    () => posicoes.reduce((acc, p) => acc + p.quantidade, 0),
    [posicoes],
  );
  const patrimonioTotal = useMemo(
    () => posicoes.reduce((acc, p) => acc + p.valorTotal, 0),
    [posicoes],
  );

  const alocacaoPorClasse = useMemo<ClasseAlocacao[]>(() => {
    if (investimentos.length === 0 || patrimonioTotal <= 0) {
      return [];
    }

    const acumulado = new Map<
      string,
      { chave: string; titulo: string; valor: number; corBarra: string }
    >();

    for (const inv of investimentos) {
      const ativo = mapaAtivos.get(inv.ativo_id);
      const info = normalizarClasse(ativo?.tipo_ativo || ativo?.tipo);
      const valor = Number(inv.valor_investido || 0);

      const atual = acumulado.get(info.chave) ?? {
        chave: info.chave,
        titulo: info.titulo,
        valor: 0,
        corBarra: info.corBarra,
      };
      atual.valor += valor;
      acumulado.set(info.chave, atual);
    }

    return Array.from(acumulado.values())
      .map((item) => ({
        ...item,
        percentual: Math.round((item.valor / patrimonioTotal) * 100),
      }))
      .sort((a, b) => b.valor - a.valor);
  }, [investimentos, mapaAtivos, patrimonioTotal]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-slate-900">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Minha Carteira
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Análise detalhada da sua alocação de ativos e performance.
          </p>
        </div>

        <Link
          href="/transacoes"
          className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition"
        >
          + Nova movimentação
        </Link>
      </header>

      {erro && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
          {erro}
        </div>
      )}

      {/* Resumo rápido de ativos, quantidade e patrimônio */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Patrimônio em Custódia
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {carregando ? "..." : formatarMoeda(patrimonioTotal)}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Ativos na Carteira
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {carregando ? "..." : totalAtivosCustodia}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Quantidade Total de Cotas/Ações
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {carregando ? "..." : formatarQuantidade(totalUnidades)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Card Esquerdo: Alocação por Classe */}
        <section className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] p-6">
          <h2 className="text-base font-bold text-slate-900 mb-6">
            Alocação por Classe
          </h2>

          {carregando ? (
            <p className="text-sm text-slate-400">Carregando alocação...</p>
          ) : alocacaoPorClasse.length === 0 ? (
            <p className="text-sm text-slate-500">
              Sem alocação ainda. Registre uma compra em{" "}
              <Link
                href="/transacoes"
                className="font-semibold text-emerald-600 hover:underline"
              >
                Transações
              </Link>
              .
            </p>
          ) : (
            <div className="space-y-6">
              {alocacaoPorClasse.map((item) => (
                <div key={item.chave}>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-semibold text-slate-800">
                      {item.titulo}
                    </span>
                    <span className="font-medium text-slate-500">
                      {item.percentual}%
                    </span>
                  </div>

                  <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full ${item.corBarra} transition-all duration-300`}
                      style={{
                        width: `${Math.min(100, Math.max(0, item.percentual))}%`,
                      }}
                    />
                  </div>

                  <p className="text-xs font-medium text-slate-500">
                    {formatarMoeda(item.valor)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Card Direito: Posições Detalhadas */}
        <section className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-slate-900">
              Posições Detalhadas
            </h2>
            {carregando && (
              <span className="text-xs text-slate-400">Atualizando...</span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="pb-3.5 pr-4">Ativo</th>
                  <th className="pb-3.5 px-3">Classe</th>
                  <th className="pb-3.5 px-3 text-right">Quantidade</th>
                  <th className="pb-3.5 px-3 text-right">Preço Médio</th>
                  <th className="pb-3.5 pl-3 text-right">Valor Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {carregando ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400">
                      Carregando posições...
                    </td>
                  </tr>
                ) : posicoes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-500">
                      Nenhum ativo em custódia no momento.
                    </td>
                  </tr>
                ) : (
                  posicoes.map((pos) => (
                    <tr
                      key={pos.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-5 pr-4 font-bold text-slate-900">
                        {pos.ativoLabel}
                      </td>
                      <td className="py-5 px-3 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
                          {pos.classe}
                        </span>
                      </td>
                      <td className="py-5 px-3 text-right font-medium text-slate-700 whitespace-nowrap">
                        {formatarQuantidade(pos.quantidade)}
                      </td>
                      <td className="py-5 px-3 text-right font-medium text-slate-700 whitespace-nowrap">
                        {formatarMoeda(pos.precoMedio)}
                      </td>
                      <td className="py-5 pl-3 text-right font-bold text-slate-900 whitespace-nowrap">
                        {formatarMoeda(pos.valorTotal)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}