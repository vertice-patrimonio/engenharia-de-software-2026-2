"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CarrosselAtivosProps<T> {
  itens: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  getKey: (item: T, index: number) => string;
  vazioTexto?: string;
}

export default function CarrosselAtivos<T>({
  itens,
  renderItem,
  getKey,
  vazioTexto = "Nenhum ativo encontrado.",
}: CarrosselAtivosProps<T>) {
  const trilhoRef = useRef<HTMLDivElement | null>(null);
  const [indiceAtual, setIndiceAtual] = useState(0);

  function rolarPara(direcao: "prev" | "next") {
    const trilho = trilhoRef.current;
    if (!trilho) return;

    const passo = Math.max(280, Math.round(trilho.clientWidth * 0.75));
    const delta = direcao === "next" ? passo : -passo;

    trilho.scrollBy({
      left: delta,
      behavior: "smooth",
    });

    setIndiceAtual((prev) => {
      if (direcao === "next") {
        return Math.min(Math.max(0, itens.length - 1), prev + 1);
      }
      return Math.max(0, prev - 1);
    });
  }

  if (itens.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 text-center text-sm text-slate-500">
        {vazioTexto}
      </div>
    );
  }

  return (
    <div className="relative space-y-3">
      {/* Controles de slide */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-500">
          {itens.length} {itens.length === 1 ? "ativo" : "ativos"} no slide
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => rolarPara("prev")}
            aria-label="Ativos anteriores"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-2xs transition hover:border-emerald-500 hover:text-emerald-600"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            type="button"
            onClick={() => rolarPara("next")}
            aria-label="Próximos ativos"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-2xs transition hover:border-emerald-500 hover:text-emerald-600"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Trilho horizontal responsivo (adapta quantos cards cabem na largura) */}
      <div
        ref={trilhoRef}
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {itens.map((item, index) => (
          <div
            key={getKey(item, index)}
            className="w-full shrink-0 snap-start sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.67rem)] xl:w-[calc(25%-0.75rem)]"
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      {/* Indicador discreto de posição */}
      <div className="flex items-center justify-center gap-1.5 pt-1">
        {itens.map((_, idx) => (
          <button
            key={idx}
            type="button"
            aria-label={`Ir para posição ${idx + 1}`}
            onClick={() => {
              const trilho = trilhoRef.current;
              if (!trilho) return;
              const larguraCard = trilho.firstElementChild
                ? (trilho.firstElementChild as HTMLElement).offsetWidth + 16
                : 320;
              trilho.scrollTo({
                left: idx * larguraCard,
                behavior: "smooth",
              });
              setIndiceAtual(idx);
            }}
            className={`h-1.5 cursor-pointer rounded-full transition-all ${
              indiceAtual === idx
                ? "w-6 bg-emerald-500"
                : "w-1.5 bg-slate-300 hover:bg-slate-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
}