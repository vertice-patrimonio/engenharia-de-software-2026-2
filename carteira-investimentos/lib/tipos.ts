export type PerfilInvestidor = "CONSERVADOR" | "MODERADO" | "AGRESSIVO";

export type TipoOperacao = "COMPRA" | "VENDA";

export type TipoAtivo = "ACAO" | "FII" | "ETF" | "BDR" | "OUTRO";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil_investidor: PerfilInvestidor | null;
  criado_em: Date;
}

export interface UsuarioComSenha extends Usuario {
  senha_hash: string;
}

export interface Carteira {
  id: string;
  usuario_id: string;
  nome: string;
  criado_em: Date;
}

export interface Ativo {
  id: string;
  ticker: string;
  nome: string;
  tipo_ativo: TipoAtivo;
  setor: string | null;
  bolsa: string;
  logo_url: string | null;
  ativo_no_mercado: boolean;
  atualizado_em: Date;
}

export interface Investimento {
  id: string;
  carteira_id: string;
  ativo_id: string;
  quantidade: string;
  valor_investido: string;
  criado_em: Date;
  atualizado_em: Date;
}

export interface InvestimentoComAtivo {
  id: string;
  ativo_id: string;
  ticker: string;
  nome: string;
  tipo_ativo: TipoAtivo;
  logo_url: string | null;
  quantidade: string;
  valor_investido: string;
  preco_medio: string;
}

export interface Operacao {
  id: string;
  carteira_id: string;
  ativo_id: string;
  tipo: TipoOperacao;
  quantidade: string;
  preco_unitario: string;
  taxas: string;
  data_operacao: Date;
  criado_em: Date;
}

export interface NovaOperacao {
  ativoId: string;
  tipo: TipoOperacao;
  quantidade: number;
  precoUnitario: number;
  taxas?: number;
  dataOperacao: string;
}

export interface Cotacao {
  ticker: string;
  preco: number;
  horario: string | null;
}
