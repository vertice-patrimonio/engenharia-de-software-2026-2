"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PainelAtivos from "@/components/PainelAtivos";

interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil_investidor: string | null;
}

interface Investimento {
  id?: string;
  ativo_id: string;
  quantidade: string | number;
  valor_investido: string | number;
}

interface Ativo {
  id: string;
  ticker: string;
  nome: string;
  tipo?: string;
  tipo_ativo?: string;
}

const formatarMoeda = (valor: number) =>
  valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const formatarQuantidade = (valor: number) => {
  const temDecimal = valor % 1 !== 0;
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: temDecimal ? 2 : 0,
    maximumFractionDigits: temDecimal ? 4 : 0,
  });
};

export default function DashboardHome() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [investimentos, setInvestimentos] = useState<Investimento[]>([]);
  const [totalInvestido, setTotalInvestido] = useState(0);
  const [quantidadeAtivos, setQuantidadeAtivos] = useState(0);
  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarDashboard() {
      try {
        const [resUsuario, resInvestimentos, resAtivos] = await Promise.all([
          fetch("/api/usuarios"),
          fetch("/api/investimentos"),
          fetch("/api/ativos"),
        ]);

        if (resUsuario.ok) {
          setUsuario(await resUsuario.json());
        }

        if (resInvestimentos.ok) {
          const dadosInv = await resInvestimentos.json();
          setInvestimentos(dadosInv.investimentos || []);
          setTotalInvestido(Number(dadosInv.totalInvestido || 0));
          setQuantidadeAtivos(Number(dadosInv.quantidadeAtivos || 0));
        }

        if (resAtivos.ok) {
          setAtivos(await resAtivos.json());
        }
      } catch (erro) {
        console.error("Erro ao carregar dashboard:", erro);
      } finally {
        setCarregando(false);
      }
    }

    carregarDashboard();
  }, []);

  const mapaAtivos = useMemo(() => {
    const mapa = new Map<string, Ativo>();
    ativos.forEach((ativo) => mapa.set(ativo.id, ativo));
    return mapa;
  }, [ativos]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header>
        <p className="text-slate-500 text-sm mb-1">
          Olá,{" "}
          <span className="font-semibold text-slate-900">
            {usuario?.nome || (carregando ? "..." : "Investidor")}
          </span>
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Aqui está o panorama completo do seu patrimônio consolidado hoje.
        </h1>
      </header>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] p-6 rounded-2xl">
          <h3 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
            Patrimônio Total Consolidado
          </h3>
          <p className="text-4xl font-bold text-slate-900">
            {carregando ? "Carregando..." : formatarMoeda(totalInvestido)}
          </p>
          <p className="text-emerald-600 text-sm mt-2 font-medium">
            {quantidadeAtivos}{" "}
            {quantidadeAtivos === 1
              ? "ativo em custódia"
              : "ativos em custódia"}
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] p-6 rounded-2xl">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h3 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                Perfil do Investidor
              </h3>
              <p className="text-3xl font-bold text-slate-900 capitalize">
                {usuario?.perfil_investidor || "Não definido"}
              </p>
              <p className="text-slate-500 text-sm mt-2">
                {usuario?.email || "Sessão ativa"}
              </p>
            </div>
            <div className="bg-slate-100 px-3 py-1.5 rounded-lg shrink-0">
              <span className="text-xs font-medium text-slate-600">
                Ambiente Criptografado
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Acompanhamento de Mercado */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          Acompanhamento de Mercado
        </h2>
        <PainelAtivos />
      </section>

      {/* Tabela de Investimentos */}
      <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Meus Investimentos
            </h3>
            <p className="text-sm text-slate-500">
              Principais posições ativas em custódia
            </p>
          </div>
          <Link
            href="/transacoes"
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 hover:underline whitespace-nowrap"
          >
            + Registrar movimentação
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                <th className="p-4">Ativo/Produto</th>
                <th className="p-4">Classe</th>
                <th className="p-4 text-right">Quantidade</th>
                <th className="p-4 text-right">Preço Médio</th>
                <th className="p-4 text-right">Total Investido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-800">
              {carregando ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500">
                    Carregando posições da carteira...
                  </td>
                </tr>
              ) : investimentos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500">
                    Nenhum ativo em custódia ainda. Acesse{" "}
                    <Link
                      href="/transacoes"
                      className="text-emerald-600 font-medium hover:underline"
                    >
                      Transações
                    </Link>{" "}
                    para registrar sua primeira compra.
                  </td>
                </tr>
              ) : (
                investimentos.map((inv) => {
                  const ativo = mapaAtivos.get(inv.ativo_id);
                  const qtd = Number(inv.quantidade);
                  const total = Number(inv.valor_investido);
                  const precoMedio = qtd > 0 ? total / qtd : 0;
                  const classeAtivo = ativo?.tipo_ativo || ativo?.tipo || "-";

                  return (
                    <tr
                      key={inv.id || inv.ativo_id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="p-4">
                        <div className="font-bold text-slate-900">
                          {ativo?.ticker || "ATIVO"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {ativo?.nome || inv.ativo_id}
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
                          {classeAtivo}
                        </span>
                      </td>
                      <td className="p-4 text-right font-medium text-slate-700 whitespace-nowrap">
                        {formatarQuantidade(qtd)}
                      </td>
                      <td className="p-4 text-right font-medium text-slate-700 whitespace-nowrap">
                        {formatarMoeda(precoMedio)}
                      </td>
                      <td className="p-4 text-right font-bold text-slate-900 whitespace-nowrap">
                        {formatarMoeda(total)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}