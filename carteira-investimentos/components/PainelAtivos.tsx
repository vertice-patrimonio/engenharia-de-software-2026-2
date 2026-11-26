"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
} from "lucide-react";
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

interface PainelAtivosProps {
  tickersExtras?: string[];
}

const TICKERS_INICIAIS = [
  "PETR4",
  "VALE3",
  "ITUB4",
  "BBDC4",
  "BBAS3",
  "WEGE3",
  "ABEV3",
  "RENT3",
  "PRIO3",
  "MGLU3",
  "HGLG11",
  "XPLG11",
  "KNRI11",
  "MXRF11",
];

export default function PainelAtivos({
  tickersExtras = [],
}: PainelAtivosProps) {
  const [tickersManuais, setTickersManuais] = useState<string[]>([]);
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

  // Estados do slide horizontal automático (4 em 4 segundos)
  const [ordenarPorMercado, setOrdenarPorMercado] = useState(true);
  const [pausado, setPausado] = useState(false);
  const [indiceSlide, setIndiceSlide] = useState(0);
  const trilhoRef = useRef<HTMLDivElement | null>(null);

  const tickersConsolidados = useMemo(() => {
    const lista = [...tickersManuais, ...tickersExtras, ...TICKERS_INICIAIS]
      .map((t) => t.toUpperCase().trim())
      .filter(Boolean);
    return Array.from(new Set(lista));
  }, [tickersManuais, tickersExtras]);

  // Carrega os ativos iniciais + ativos extras da carteira do usuário
  useEffect(() => {
    let ativo = true;

    async function buscarCotacoesIniciais() {
      try {
        const resposta = await fetch(
          `/api/cotacao?ticker=${encodeURIComponent(tickersConsolidados.join(","))}`,
          { cache: "no-store" },
        );

        if (!ativo) return;
        if (!resposta.ok) throw new Error("Falha ao buscar cotações");

        const json: RespostaCotacoes = await resposta.json();
        const resultados = Array.isArray(json.results) ? json.results : [];

        setAtivosExibidos((anteriores) => {
          const mapa = new Map<string, ItemAtivoBrapi>();
          anteriores.forEach((item) => mapa.set(item.symbol, item));
          resultados.forEach((item) => mapa.set(item.symbol, item));
          return Array.from(mapa.values());
        });
      } catch (erro) {
        console.error("Erro ao carregar cotações:", erro);
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    buscarCotacoesIniciais();

    return () => {
      ativo = false;
    };
  }, [tickersConsolidados]);

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

  const ativosParaSlide = useMemo(() => {
    const lista = [...ativosExibidos];
    if (ordenarPorMercado) {
      lista.sort((a, b) => {
        const varA = Math.abs(Number(a.regularMarketChangePercent || 0));
        const varB = Math.abs(Number(b.regularMarketChangePercent || 0));
        return varB - varA;
      });
    }
    return lista;
  }, [ativosExibidos, ordenarPorMercado]);

  const irParaIndice = useCallback((idx: number) => {
    const trilho = trilhoRef.current;
    if (!trilho) return;
    const primeiroCard = trilho.firstElementChild as HTMLElement | null;
    const larguraCard = primeiroCard ? primeiroCard.offsetWidth + 16 : 300;
    trilho.scrollTo({
      left: idx * larguraCard,
      behavior: "smooth",
    });
    setIndiceSlide(idx);
  }, []);

  const avancarSlide = useCallback(() => {
    const trilho = trilhoRef.current;
    const total = ativosParaSlide.length;
    if (!trilho || total <= 1) return;

    const primeiroCard = trilho.firstElementChild as HTMLElement | null;
    const larguraCard = primeiroCard ? primeiroCard.offsetWidth + 16 : 300;
    const visiveisPorTela = Math.max(
      1,
      Math.round(trilho.clientWidth / larguraCard),
    );
    const maxIndice = Math.max(0, total - visiveisPorTela);

    setIndiceSlide((atual) => {
      const proximo = atual >= maxIndice ? 0 : atual + 1;
      trilho.scrollTo({
        left: proximo * larguraCard,
        behavior: "smooth",
      });
      return proximo;
    });
  }, [ativosParaSlide.length]);

  const voltarSlide = useCallback(() => {
    const trilho = trilhoRef.current;
    const total = ativosParaSlide.length;
    if (!trilho || total <= 1) return;

    const primeiroCard = trilho.firstElementChild as HTMLElement | null;
    const larguraCard = primeiroCard ? primeiroCard.offsetWidth + 16 : 300;
    const visiveisPorTela = Math.max(
      1,
      Math.round(trilho.clientWidth / larguraCard),
    );
    const maxIndice = Math.max(0, total - visiveisPorTela);

    setIndiceSlide((atual) => {
      const anterior = atual <= 0 ? maxIndice : atual - 1;
      trilho.scrollTo({
        left: anterior * larguraCard,
        behavior: "smooth",
      });
      return anterior;
    });
  }, [ativosParaSlide.length]);

  // Passa o slide automaticamente de 4 em 4 segundos
  useEffect(() => {
    if (
      carregando ||
      pausado ||
      dropdownAberto ||
      termoBusca.trim() !== "" ||
      ativosParaSlide.length <= 1
    ) {
      return;
    }

    const intervalo = setInterval(() => {
      avancarSlide();
    }, 4000);

    return () => clearInterval(intervalo);
  }, [
    carregando,
    pausado,
    dropdownAberto,
    termoBusca,
    ativosParaSlide.length,
    avancarSlide,
  ]);

  async function handleAdicionarTicker(tickerRaw: string) {
    const simbolo = tickerRaw.toUpperCase().trim();
    if (!simbolo) return;

    setDropdownAberto(false);
    setErroBusca("");

    if (tickersConsolidados.includes(simbolo)) {
      setTermoBusca("");
      setSugestoes([]);
      const idxExistente = ativosParaSlide.findIndex(
        (item) => item.symbol === simbolo,
      );
      if (idxExistente >= 0) irParaIndice(idxExistente);
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

      setTickersManuais((prev) => [simbolo, ...prev]);
      setAtivosExibidos((prev) => [
        novoItem,
        ...prev.filter((item) => item.symbol !== simbolo),
      ]);
      setTermoBusca("");
      setSugestoes([]);
      irParaIndice(0);
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
    <div
      className="space-y-4"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Acompanhamento de Mercado
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {ativosParaSlide.length} ativos •{" "}
            {ordenarPorMercado
              ? "Destaques de oscilação do mercado"
              : "Ordem adicionada"}{" "}
            • {pausado || termoBusca ? "Slide pausado" : "Passando a cada 4s"}
          </p>
        </div>

        {/* Barra de Pesquisa da B3 + Controles do Slide */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-72">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Buscar ticker na B3 (ex: BBAS3)..."
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
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm text-slate-900 shadow-2xs outline-none transition placeholder:text-slate-400 focus:border-emerald-500"
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
                className="inline-flex cursor-pointer items-center gap-1 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50"
              >
                <Plus size={16} />
                {adicionandoTicker ? "..." : "Adicionar"}
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
                        {tickersConsolidados.includes(item.ticker)
                          ? "No painel"
                          : "+ Exibir"}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setOrdenarPorMercado((prev) => !prev);
              irParaIndice(0);
            }}
            className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-600"
          >
            {ordenarPorMercado ? "Destaques B3" : "Ordem padrão"}
          </button>

          <button
            type="button"
            onClick={() => setPausado((prev) => !prev)}
            title={pausado ? "Retomar slide" : "Pausar slide"}
            aria-label={pausado ? "Retomar slide" : "Pausar slide"}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-emerald-500 hover:text-emerald-600"
          >
            {pausado ? <Play size={15} /> : <Pause size={15} />}
          </button>

          <button
            type="button"
            onClick={voltarSlide}
            aria-label="Cotações anteriores"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-emerald-500 hover:text-emerald-600"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            type="button"
            onClick={avancarSlide}
            aria-label="Próximas cotações"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-emerald-500 hover:text-emerald-600"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {erroBusca && <p className="text-xs text-rose-600">{erroBusca}</p>}

      {/* Slide Horizontal Responsivo de Cards de Cotação */}
      {ativosParaSlide.length === 0 ? (
        <div className="text-red-400">Não foi possível carregar os ativos.</div>
      ) : (
        <>
          <div
            ref={trilhoRef}
            className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {ativosParaSlide.map((item: ItemAtivoBrapi) => (
              <div
                key={item.symbol}
                className="w-full shrink-0 snap-start sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.67rem)] xl:w-[calc(25%-0.75rem)]"
              >
                <CardAtivo ativo={item} />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-1.5 pt-1">
            {ativosParaSlide.slice(0, 14).map((item, idx) => (
              <button
                key={item.symbol}
                type="button"
                aria-label={`Ir para ${item.symbol}`}
                onClick={() => irParaIndice(idx)}
                className={`h-1.5 cursor-pointer rounded-full transition-all ${
                  indiceSlide === idx
                    ? "w-5 bg-emerald-500"
                    : "w-1.5 bg-slate-300 hover:bg-slate-400"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}