"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Wallet,
  ArrowLeftRight,
  User,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

const ITENS_MENU = [
  { href: "/dashboard", label: "Página Inicial", icone: Home },
  { href: "/carteira", label: "Minha Carteira", icone: Wallet },
  { href: "/transacoes", label: "Transações", icone: ArrowLeftRight },
  { href: "/perfil", label: "Meu Perfil", icone: User },
];

export default function SidebarCarteira() {
  const pathname = usePathname();
  const [recolhida, setRecolhida] = useState(false);
  const [saindo, setSaindo] = useState(false);

  async function handleSair() {
    if (saindo) return;
    setSaindo(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
    } finally {
      window.location.assign("/");
    }
  }

  return (
    <aside
      className={`flex shrink-0 flex-col justify-between bg-[#070B14] py-6 text-slate-300 transition-all duration-200 ${
        recolhida ? "w-20 px-2.5" : "w-64 px-4"
      }`}
    >
      <div>
        {/* Topo com marca e botão de recuar/expandir ao lado */}
        <div
          className={`mb-8 flex items-center ${
            recolhida ? "flex-col gap-3" : "justify-between px-2"
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500 font-bold text-slate-950">
              V
            </div>
            {!recolhida && (
              <span className="truncate text-base font-bold tracking-wider text-white">
                VÉRTICE
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setRecolhida((prev) => !prev)}
            title={recolhida ? "Expandir menu" : "Recolher menu"}
            aria-label={recolhida ? "Expandir menu" : "Recolher menu"}
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 text-slate-400 transition hover:border-slate-700 hover:bg-slate-800 hover:text-white"
          >
            {recolhida ? (
              <PanelLeftOpen size={16} />
            ) : (
              <PanelLeftClose size={16} />
            )}
          </button>
        </div>

        {/* Links de navegação */}
        <nav className="space-y-1.5">
          {ITENS_MENU.map((item) => {
            const Icone = item.icone;
            const ativo =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={recolhida ? item.label : undefined}
                className={`flex items-center rounded-xl py-2.5 text-sm font-medium transition ${
                  recolhida ? "justify-center px-2" : "gap-3 px-3.5"
                } ${
                  ativo
                    ? "bg-slate-800/80 text-emerald-400"
                    : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
                }`}
              >
                <Icone size={18} className="shrink-0" />
                {!recolhida && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Botão Sair */}
      <button
        type="button"
        onClick={handleSair}
        disabled={saindo}
        title={recolhida ? "Sair" : undefined}
        className={`flex w-full cursor-pointer items-center rounded-xl py-2.5 text-sm font-medium text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-50 ${
          recolhida ? "justify-center px-2" : "gap-3 px-3.5"
        }`}
      >
        <LogOut size={18} className="shrink-0" />
        {!recolhida && (
          <span className="truncate">{saindo ? "Saindo..." : "Sair"}</span>
        )}
      </button>
    </aside>
  );
}