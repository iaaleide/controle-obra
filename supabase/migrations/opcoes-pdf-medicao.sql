-- Opções de exibição no PDF do relatório de medição
ALTER TABLE relatorios
ADD COLUMN IF NOT EXISTS opcoes_pdf_medicao JSONB;
