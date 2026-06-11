-- Campos adicionais no cadastro de funcionários (RG, CPF, endereço)
-- Execute no Supabase: SQL Editor → New query → Run

ALTER TABLE "Funcionario" ADD COLUMN IF NOT EXISTS "rg" TEXT;
ALTER TABLE "Funcionario" ADD COLUMN IF NOT EXISTS "cpf" TEXT;
ALTER TABLE "Funcionario" ADD COLUMN IF NOT EXISTS "endereco" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Funcionario_cpf_key" ON "Funcionario"("cpf");
