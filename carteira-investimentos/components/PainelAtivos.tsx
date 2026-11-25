"use client";

import { useState, useEffect } from "react";
import { Search, Plus, X } from "lucide-react";
import CardAtivo from "@/components/CardAtivo";

interface ItemAtivoBrapi {
  symbol: string;
  longName?: string;
  shortName?: string;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketPrice?: number;
  regularMarketVolume?: number;
  regularMarketTime?: string;
  currency?: string;
  [key: string]: unknown;
}

interface ResultadoBuscaAtivo {
  id: string | null;
  ticker: string;
  nome: string;
  tipo_ativo?: string;
}

interface RespostaCotacoes {
  results?: ItemAtivoBrapi[];
}

const TICKERS_INICIAIS = [
  "PETR4",
  "VALE3",
  "ITUB4",
  "MGLU3",
  "HGLG11",
  "XPLG11",
  "WEGE3",
  "MXRF11",
];

export default function PainelAtivos() {
  const [tickers, setTickers] = useState<string[]>(TICKERS_INICIAIS);
  const [ativosExibidos, setAtivosExibidos] = useState<ItemAtivoBrapi[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Estados da barra de busca da B3
  const [termoBusca, setTermoBusca] = useState("");
  const [sugestoes, setSugestoes] = useState<ResultadoBuscaAtivo[]>([]);
  const [buscandoSugestoes, setBuscandoSugestoes] = useState(false);
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const [adicionandoTicker, setAdicionandoTicker] = useState<string | null>(
    null,
  );
  const [erroBusca, setErroBusca] = useState("");

  // Carrega os 8 ativos iniciais
  useEffect(() => {
    async function buscarCotacoesIniciais() {
      try {
        const resposta = await fetch(
          `/api/cotacao?ticker=${TICKERS_INICIAIS.join(",")}`,
        );

        if (!resposta.ok) throw new Error("Falha ao buscar cotações");

        const json: RespostaCotacoes = await resposta.json();
        setAtivosExibidos(json.results || []);
      } catch (erro) {
        console.error("Erro:", erro);
      } finally {
        setCarregando(false);
      }
    }

    buscarCotacoesIniciais();
  }, []);

  // Autocomplete na B3 via /api/ativos?search=...
  useEffect(() => {
    const termo = termoBusca.trim();
    if (!termo) return;

    let cancelado = false;
    const timer = setTimeout(async () => {
      try {
        setBuscandoSugestoes(true);
        const res = await fetch(
          `/api/ativos?search=${encodeURIComponent(termo)}`,
          { cache: "no-store" },
        );
        if (!cancelado && res.ok) {
          const lista = await res.json();
          setSugestoes(Array.isArray(lista) ? lista : []);
        }
      } catch {
        if (!cancelado) setSugestoes([]);
      } finally {
        if (!cancelado) setBuscandoSugestoes(false);
      }
    }, 300);

    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [termoBusca]);

  async function handleAdicionarTicker(tickerRaw: string) {
    const simbolo = tickerRaw.toUpperCase().trim();
    if (!simbolo) return;

    setDropdownAberto(false);
    setErroBusca("");

    // Se já está no painel, apenas limpa o campo
    if (tickers.includes(simbolo)) {
      setTermoBusca("");
      setSugestoes([]);
      return;
    }

    try {
      setAdicionandoTicker(simbolo);
      const res = await fetch(
        `/api/cotacao?ticker=${encodeURIComponent(simbolo)}`,
        { cache: "no-store" },
      );

      if (!res.ok) {
        setErroBusca(`Não foi possível obter a cotação de ${simbolo}.`);
        return;
      }

      const json: RespostaCotacoes = await res.json();
      const novoItem = json.results?.[0];

      if (!novoItem) {
        setErroBusca(`Ativo ${simbolo} não encontrado na B3.`);
        return;
      }

      setTickers((prev) => [simbolo, ...prev]);
      setAtivosExibidos((prev) => [novoItem, ...prev]);
      setTermoBusca("");
      setSugestoes([]);
    } catch {
      setErroBusca(`Erro ao consultar cotação de ${simbolo}.`);
    } finally {
      setAdicionandoTicker(null);
    }
  }

  if (carregando) {
    return (
      <div className="text-slate-400 animate-pulse">
        Carregando cotações ao vivo...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de Pesquisa de Qualquer Ativo da B3 */}
      <div className="relative max-w-md">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Buscar ticker na B3 (ex: BBAS3, ITSA4, KNRI11)..."
              value={termoBusca}
              onFocus={() => setDropdownAberto(true)}
              onChange={(e) => {
                const valor = e.target.value;
                setTermoBusca(valor);
                if (!valor.trim()) {
                  setSugestoes([]);
                }
                setDropdownAberto(true);
                setErroBusca("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAdicionarTicker(termoBusca);
                }
              }}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-8 text-sm text-slate-900 shadow-2xs outline-none transition placeholder:text-slate-400 focus:border-emerald-500"
            />
            {termoBusca && (
              <button
                type="button"
                onClick={() => {
                  setTermoBusca("");
                  setSugestoes([]);
                  setDropdownAberto(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            type="button"
            disabled={!termoBusca.trim() || Boolean(adicionandoTicker)}
            onClick={() => handleAdicionarTicker(termoBusca)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50"
          >
            <Plus size={16} />
            {adicionandoTicker ? "Buscando..." : "Adicionar"}
          </button>
        </div>

        {/* Lista de sugestões da B3 */}
        {dropdownAberto && termoBusca.trim().length > 0 && (
          <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
            {buscandoSugestoes ? (
              <div className="p-3 text-xs text-slate-500">
                Consultando ativos da B3...
              </div>
            ) : sugestoes.length === 0 ? (
              <button
                type="button"
                onClick={() => handleAdicionarTicker(termoBusca)}
                className="w-full px-3 py-2.5 text-left text-xs text-slate-600 hover:bg-slate-50"
              >
                Buscar cotação direta para{" "}
                <span className="font-bold text-slate-900">
                  {termoBusca.toUpperCase()}
                </span>
              </button>
            ) : (
              sugestoes.map((item, idx) => (
                <button
                  key={item.id || `${item.ticker}-${idx}`}
                  type="button"
                  onClick={() => handleAdicionarTicker(item.ticker)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
                >
                  <div>
                    <span className="font-bold text-slate-900">
                      {item.ticker}
                    </span>{" "}
                    <span className="text-xs text-slate-500">
                      — {item.nome}
                    </span>
                  </div>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                    {tickers.includes(item.ticker) ? "No painel" : "+ Exibir"}
                  </span>
                </button>
              ))
            )}
          </div>
        )}

        {erroBusca && (
          <p className="mt-1.5 text-xs text-rose-600">{erroBusca}</p>
        )}
      </div>

      {/* Cards de Cotação */}
      {ativosExibidos.length === 0 ? (
        <div className="text-red-400">Não foi possível carregar os ativos.</div>
      ) : (
        <div className="flex gap-6 flex-wrap mt-4">
          {ativosExibidos.map((item: ItemAtivoBrapi) => (
            <CardAtivo key={item.symbol} ativo={item} />
          ))}
        </div>
      )}
    </div>
  );
}
