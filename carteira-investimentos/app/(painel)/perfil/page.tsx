"use client";

import { useEffect, useState, FormEvent } from "react";

interface DadosUsuario {
  id: string;
  nome: string;
  email: string;
  perfil_investidor: string | null;
  criado_em?: string;
}

export default function PerfilPage() {
  const [usuario, setUsuario] = useState<DadosUsuario | null>(null);
  const [nome, setNome] = useState("");
  const [perfilInvestidor, setPerfilInvestidor] = useState("Moderado");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregarPerfil() {
      try {
        const res = await fetch("/api/usuarios", { cache: "no-store" });
        if (!ativo) return;

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setErro(err.erro || "Não foi possível carregar o perfil.");
          return;
        }

        const dados: DadosUsuario = await res.json();
        setUsuario(dados);
        setNome(dados.nome || "");
        setPerfilInvestidor(dados.perfil_investidor || "Moderado");
      } catch {
        if (ativo) setErro("Erro de conexão ao carregar o perfil.");
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregarPerfil();
    return () => {
      ativo = false;
    };
  }, []);

  async function handleSalvar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMensagem("");
    setErro("");
    setSalvando(true);

    try {
      const res = await fetch("/api/usuarios", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome.trim(),
          perfil_investidor: perfilInvestidor,
        }),
      });

      const dados = await res.json();
      if (!res.ok) {
        setErro(dados.erro || "Erro ao atualizar perfil.");
        return;
      }

      setUsuario(dados);
      setMensagem("Perfil atualizado com sucesso.");
    } catch {
      setErro("Erro de conexão ao salvar perfil.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-slate-900">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Meu Perfil
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Gerencie seus dados cadastrais e seu perfil de investidor.
        </p>
      </header>

      <section className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        {carregando ? (
          <p className="text-sm text-slate-500">Carregando dados do perfil...</p>
        ) : (
          <form onSubmit={handleSalvar} className="space-y-4">
            {mensagem && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                {mensagem}
              </div>
            )}

            {erro && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">
                {erro}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                E-mail
              </label>
              <input
                type="email"
                value={usuario?.email || ""}
                disabled
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Nome completo
              </label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>

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

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={salvando}
                className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition cursor-pointer disabled:opacity-50"
              >
                {salvando ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}