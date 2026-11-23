import { PerfilInvestidor, TipoOperacao } from "@/lib/tipos";

export function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validarSenha(senha: string): boolean {
  return senha.length >= 8;
}

export function validarNome(nome: string): boolean {
  return nome.trim().length >= 2 && nome.trim().length <= 120;
}

export function validarPerfil(perfil: unknown): perfil is PerfilInvestidor {
  return (
    perfil === "CONSERVADOR" || perfil === "MODERADO" || perfil === "AGRESSIVO"
  );
}

export function validarTipoOperacao(tipo: unknown): tipo is TipoOperacao {
  return tipo === "COMPRA" || tipo === "VENDA";
}

export function validarNumeroPositivo(valor: unknown): valor is number {
  return typeof valor === "number" && Number.isFinite(valor) && valor > 0;
}

export function validarTaxas(valor: unknown): valor is number {
  return typeof valor === "number" && Number.isFinite(valor) && valor >= 0;
}

export function validarDataOperacao(data: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return false;
  }

  const [ano, mes, dia] = data.split("-").map(Number);

  const dataTeste = new Date(Date.UTC(ano, mes - 1, dia));

  return (
    dataTeste.getUTCFullYear() === ano &&
    dataTeste.getUTCMonth() === mes - 1 &&
    dataTeste.getUTCDate() === dia
  );
}
