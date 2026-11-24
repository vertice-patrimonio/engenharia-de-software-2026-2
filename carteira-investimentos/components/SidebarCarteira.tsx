"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Wallet,
  ArrowLeftRight,
  User,
  LogOut,
} from "lucide-react";

interface SidebarCarteiraProps {
  onLogout?: () => void;
}

const MENU_ITEMS = [
  { label: "Página Inicial", href: "/dashboard", icon: Home },
  { label: "Minha Carteira", href: "/carteira", icon: Wallet },
  { label: "Transações", href: "/transacoes", icon: ArrowLeftRight },
  { label: "Meu Perfil", href: "/perfil", icon: User },
];

export default function SidebarCarteira({ onLogout }: SidebarCarteiraProps) {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 bg-[#060913] text-slate-400 min-h-screen flex flex-col justify-between px-3.5 py-6 select-none">
      <div>
        <div className="flex items-center gap-3 px-2.5 mb-8">
          <div className="w-8 h-8 rounded-lg bg-[#10b981] flex items-center justify-center text-[#060913] font-bold text-sm">
            V
          </div>
          <span className="text-white font-bold tracking-[0.14em] text-sm uppercase">
            VÉRTICE
          </span>
        </div>

        <nav className="space-y-1.5" aria-label="Navegação principal">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] font-medium transition-all ${
                  isActive
                    ? "bg-[#111827] text-[#10b981] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
                }`}
              >
                <Icon
                  size={18}
                  strokeWidth={2}
                  className={isActive ? "text-[#10b981]" : "text-slate-400"}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-6">
        {onLogout ? (
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] font-medium text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <LogOut size={18} strokeWidth={2} className="text-rose-500" />
            <span>Sair da conta</span>
          </button>
        ) : (
          <Link
            href="/"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] font-medium text-rose-500 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut size={18} strokeWidth={2} className="text-rose-500" />
            <span>Sair da conta</span>
          </Link>
        )}
      </div>
    </aside>
  );
}