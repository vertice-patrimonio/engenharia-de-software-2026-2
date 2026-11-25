import { TrendingDown, TrendingUp, Clock, BarChart2 } from "lucide-react";

interface DadosAtivoBrapi {
  symbol?: string;
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

interface AtivoProps extends DadosAtivoBrapi {
  data?: DadosAtivoBrapi;
}

export default function CardAtivo({ ativo }: { ativo: AtivoProps }) {
  // 1. Garante que os dados sejam lidos quer venham dentro de "data" ou na raiz do objeto
  const info = ativo.data ? ativo.data : ativo;
  const symbol = ativo.symbol || info.symbol;

  // 2. Tenta usar o nome completo da empresa (longName). Se não existir, usa o curto.
  const nomeDaEmpresa = info.longName || info.shortName || symbol;

  const isPositivo = (info.regularMarketChange || 0) >= 0;
  const CorVariacao = isPositivo ? "text-emerald-600" : "text-rose-600";
  const IconeVariacao = isPositivo ? TrendingUp : TrendingDown;

  const formatarMoeda = (valor?: number) => {
    if (typeof valor !== "number") return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: info.currency || "BRL",
    }).format(valor);
  };

  const formatarVolume = (valor?: number) => {
    if (!valor) return "0";
    return new Intl.NumberFormat("pt-BR").format(valor);
  };

  const formatarData = (dataIso?: string) => {
    if (!dataIso) return "--:--";
    const dataObj = new Date(dataIso);
    if (Number.isNaN(dataObj.getTime())) return "--:--";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(dataObj);
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 w-full max-w-sm hover:border-slate-300 transition-colors shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="flex justify-between items-start gap-2 mb-4">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-slate-900 tracking-wide">
            {symbol}
          </h2>
          <p className="text-sm text-slate-500 truncate" title={nomeDaEmpresa}>
            {nomeDaEmpresa}
          </p>
        </div>
        <div className="bg-slate-100 text-slate-600 text-xs font-medium px-2.5 py-1 rounded-md shrink-0">
          {info.currency || "BRL"}
        </div>
      </div>

      <div className="mb-6">
        <span className="text-3xl font-bold text-slate-900">
          {formatarMoeda(info.regularMarketPrice)}
        </span>
        <div
          className={`flex items-center gap-1 mt-2 text-sm font-semibold ${CorVariacao}`}
        >
          <IconeVariacao size={16} />
          <span>
            {isPositivo ? "+" : ""}
            {formatarMoeda(info.regularMarketChange)} ({isPositivo ? "+" : ""}
            {(info.regularMarketChangePercent || 0).toFixed(2)}%)
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center gap-2 pt-4 border-t border-slate-100">
        <div
          className="flex items-center gap-1.5 text-slate-500 text-xs"
          title="Volume de negociações"
        >
          <BarChart2 size={14} className="text-slate-400" />
          <span>Vol: {formatarVolume(info.regularMarketVolume)}</span>
        </div>
        <div
          className="flex items-center gap-1.5 text-slate-500 text-xs"
          title="Última atualização"
        >
          <Clock size={14} className="text-slate-400" />
          <span suppressHydrationWarning>
            {formatarData(info.regularMarketTime)}
          </span>
        </div>
      </div>
    </div>
  );
}
