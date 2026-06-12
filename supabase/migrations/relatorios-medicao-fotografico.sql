-- Relatórios de medição e fotográficos
-- Execute no SQL Editor do Supabase se não usar prisma db push

CREATE TYPE "ModoGraficoMedicao" AS ENUM ('POR_SERVICO', 'CONSOLIDADO');
CREATE TYPE "TipoRelatorio" AS ENUM ('MEDICAO', 'FOTOGRAFICO');

CREATE TABLE IF NOT EXISTS relatorios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id TEXT NOT NULL REFERENCES "Obra"(id) ON DELETE CASCADE,
  tipo "TipoRelatorio" NOT NULL DEFAULT 'MEDICAO',
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL,
  acumulado_total NUMERIC(14, 2),
  observacoes_gerais TEXT,
  modo_grafico "ModoGraficoMedicao" NOT NULL DEFAULT 'POR_SERVICO',
  cliente_nome TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS relatorios_obra_id_periodo_inicio_idx
  ON relatorios (obra_id, periodo_inicio);

CREATE TABLE IF NOT EXISTS itens_relatorio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relatorio_id UUID NOT NULL REFERENCES relatorios(id) ON DELETE CASCADE,
  ordem INT NOT NULL,
  item TEXT,
  descricao TEXT NOT NULL,
  valor_total NUMERIC(14, 2) NOT NULL,
  valor_previsto NUMERIC(14, 2) NOT NULL,
  valor_realizado NUMERIC(14, 2) NOT NULL,
  percentual_executado NUMERIC(7, 2) NOT NULL,
  mostrar_no_relatorio BOOLEAN NOT NULL DEFAULT TRUE,
  observacao TEXT
);

CREATE INDEX IF NOT EXISTS itens_relatorio_relatorio_id_idx ON itens_relatorio (relatorio_id);

CREATE TABLE IF NOT EXISTS fotos_relatorio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relatorio_id UUID NOT NULL REFERENCES relatorios(id) ON DELETE CASCADE,
  ordem INT NOT NULL,
  imagem_base64 TEXT,
  legenda TEXT
);

CREATE INDEX IF NOT EXISTS fotos_relatorio_relatorio_id_idx ON fotos_relatorio (relatorio_id);
