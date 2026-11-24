"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

type ModoAuth = "login" | "cadastro";

export default function HomeAuthPage() {
  const router = useRouter();
  const [modo, setModo] = useState<ModoAuth>("login");

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [perfilInvestidor, setPerfilInvestidor] = useState("Moderado");

  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setEnviando(true);

    try {
      const endpoint =
        modo === "cadastro" ? "/api/auth/cadastro" : "/api/auth/login";

      const payload =
        modo === "cadastro"
          ? {
              nome,
              email,
              senha,
              perfil_investidor: perfilInvestidor,
            }
          : {
              email,
              senha,
            };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const dados = await res.json();

      if (!res.ok) {
        setErro(dados.erro || "Não foi possível concluir a solicitação.");
        return;
      }

      if (dados.usuario) {
        localStorage.setItem("vertice_usuario", JSON.stringify(dados.usuario));
      }
      if (dados.carteira) {
        localStorage.setItem("vertice_carteira", JSON.stringify(dados.carteira));
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setErro("Erro de conexão com o servidor.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-[#f8fafc] text-slate-900">
      {/* Painel lateral escuro */}
      <aside className="hidden lg:flex lg:w-96 bg-[#060913] text-white flex-col justify-between p-8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#10b981] flex items-center justify-center text-[#060913] font-bold">
            V
          </div>
          <span className="font-bold tracking-[0.14em] text-sm uppercase">
            VÉRTICE
          </span>
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-bold leading-snug">
            Acompanhe sua carteira e patrimônio em um só lugar.
          </h2>
          <p className="text-sm text-slate-400">
            Ao criar sua conta, sua carteira inicial é preparada
            automaticamente para você registrar aportes e acompanhar posições.
          </p>
        </div>

        <p className="text-xs text-slate-500">
          Vértice • Controle de Investimentos
        </p>
      </aside>

      {/* Área do formulário */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-2xl p-7 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-2.5 lg:hidden mb-6">
            <div className="w-8 h-8 rounded-lg bg-[#10b981] flex items-center justify-center text-[#060913] font-bold text-sm">
              V
            </div>
            <span className="font-bold tracking-[0.14em] text-sm uppercase text-slate-900">
              VÉRTICE
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setModo("login");
                setErro("");
              }}
              className={`py-2 text-sm font-semibold rounded-lg transition cursor-pointer ${
                modo === "login"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setModo("cadastro");
                setErro("");
              }}
              className={`py-2 text-sm font-semibold rounded-lg transition cursor-pointer ${
                modo === "cadastro"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Criar conta
            </button>
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            {modo === "login" ? "Acessar conta" : "Criar nova conta"}
          </h1>
          <p className="text-sm text-slate-500 mt-1 mb-6">
            {modo === "login"
              ? "Entre com seu e-mail e senha para abrir o painel."
              : "Preencha seus dados para cadastrar e criar sua carteira."}
          </p>

          {erro && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {modo === "cadastro" && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nome completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Vitor Gabriel"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                E-mail
              </label>
              <input
                type="email"
                required
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Senha
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Mínimo de 6 caracteres"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>

            {modo === "cadastro" && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Perfil de investidor
                </label>
                <select
                  value={perfilInvestidor}
                  onChange={(e) => setPerfilInvestidor(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white"
                >
                  <option value="Conservador">Conservador</option>
                  <option value="Moderado">Moderado</option>
                  <option value="Arrojado">Arrojado</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="w-full mt-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition cursor-pointer disabled:opacity-50"
            >
              {enviando
                ? "Processando..."
                : modo === "login"
                  ? "Entrar"
                  : "Cadastrar e criar carteira"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}