CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    perfil_investidor VARCHAR(50),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ativos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker VARCHAR(20) NOT NULL UNIQUE,
    nome VARCHAR(255) NOT NULL,
    tipo_ativo VARCHAR(50) NOT NULL,
    setor VARCHAR(100),
    bolsa VARCHAR(50) NOT NULL DEFAULT 'B3',
    logo_url TEXT,
    ativo_no_mercado BOOLEAN NOT NULL DEFAULT TRUE,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS carteiras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL DEFAULT 'Minha carteira',
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS investimentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    carteira_id UUID NOT NULL REFERENCES carteiras(id) ON DELETE CASCADE,
    ativo_id UUID NOT NULL REFERENCES ativos(id) ON DELETE RESTRICT,
    quantidade NUMERIC(18, 8) NOT NULL,
    valor_investido NUMERIC(18, 2) NOT NULL,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (carteira_id, ativo_id)
);

CREATE TABLE IF NOT EXISTS operacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    carteira_id UUID NOT NULL REFERENCES carteiras(id) ON DELETE CASCADE,
    ativo_id UUID NOT NULL REFERENCES ativos(id) ON DELETE RESTRICT,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('COMPRA', 'VENDA')),
    quantidade NUMERIC(18, 8) NOT NULL,
    preco_unitario NUMERIC(18, 4) NOT NULL,
    taxas NUMERIC(18, 2) NOT NULL DEFAULT 0,
    data_operacao DATE NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
