"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Key,
  Eye,
  EyeOff,
  ShieldCheck,
  User,
  FileText,
} from "lucide-react";

export default function CadastroPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const resposta = await fetch("/api/auth/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados.erro || "Erro ao realizar cadastro.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setErro("Erro de conexão com o servidor.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200 font-sans">
      {/* Lado Esquerdo - Reutilizado do Login */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center p-16 bg-slate-900 border-r border-slate-800">
        <h1 className="text-4xl font-bold tracking-tight mb-2 text-white">
          V VÉRTICE <span className="font-light">PATRIMÔNIO</span>
        </h1>
        <h2 className="text-2xl font-semibold mb-4 text-emerald-400">
          REVOLUÇÃO FINTECH
        </h2>
        <p className="text-3xl font-medium mb-6 leading-tight text-white">
          Sua vida financeira, <br /> consolidada e sob controle.
        </p>
        <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 w-max px-4 py-2 rounded-full border border-emerald-500/20 mt-8">
          <ShieldCheck size={20} />
          <span className="text-sm font-medium">
            Criptografia 256-bit LGPD Compliant
          </span>
        </div>
      </div>

      {/* Lado Direito - Formulário de Cadastro */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md">
          <h3 className="text-3xl font-semibold text-white mb-2">
            Crie sua conta
          </h3>
          <p className="text-slate-400 mb-8">
            Preencha seus dados para iniciar a consolidação do seu patrimônio.
          </p>

          {erro && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {erro}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="relative">
              <User
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                size={20}
              />
              <input
                type="text"
                placeholder="Nome Completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-12 pr-4 text-white focus:border-emerald-500 outline-none"
                required
              />
            </div>

            <div className="relative">
              <FileText
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                size={20}
              />
              <input
                type="text"
                placeholder="CPF"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-12 pr-4 text-white focus:border-emerald-500 outline-none"
                required
              />
            </div>

            <div className="relative">
              <Mail
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                size={20}
              />
              <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-12 pr-4 text-white focus:border-emerald-500 outline-none"
                required
              />
            </div>

            <div className="relative">
              <Key
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                size={20}
              />
              <input
                type={mostrarSenha ? "text" : "password"}
                placeholder="Crie uma Senha (mín. 8 caracteres)"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                minLength={8}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-12 pr-12 text-white focus:border-emerald-500 outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {mostrarSenha ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold text-lg py-4 rounded-lg flex items-center justify-center gap-2 mt-6 cursor-pointer"
            >
              {carregando ? "Cadastrando..." : "Cadastrar"} <span>→</span>
            </button>
          </form>

          <p className="text-center mt-6 text-slate-400">
            Já possui conta?{" "}
            <Link href="/login" className="text-emerald-400 hover:underline">
              Faça Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
