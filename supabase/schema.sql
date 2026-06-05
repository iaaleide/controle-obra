-- Execute este script no Supabase: SQL Editor → New query → Run
-- Projeto: controle-obra | Conta: ia.aleide@gmail.com

CREATE TYPE "Perfil" AS ENUM ('ADMIN', 'MESTRE', 'VISITANTE');
CREATE TYPE "AcaoPresencaHistorico" AS ENUM ('CRIACAO', 'ALTERACAO');

CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "perfil" "Perfil" NOT NULL DEFAULT 'VISITANTE',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Usuario_login_key" ON "Usuario"("login");

CREATE TABLE "Obra" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "endereco" TEXT,
    "descricao" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Obra_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Funcionario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cargo" TEXT,
    "telefone" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Funcionario_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FuncionarioObra" (
    "funcionarioId" TEXT NOT NULL,
    "obraId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FuncionarioObra_pkey" PRIMARY KEY ("funcionarioId", "obraId")
);

CREATE INDEX "FuncionarioObra_obraId_idx" ON "FuncionarioObra"("obraId");

CREATE TABLE "Presenca" (
    "id" TEXT NOT NULL,
    "funcionarioId" TEXT NOT NULL,
    "obraId" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "presente" BOOLEAN NOT NULL DEFAULT false,
    "observacao" VARCHAR(500),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Presenca_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Presenca_funcionarioId_data_key" ON "Presenca"("funcionarioId", "data");
CREATE INDEX "Presenca_obraId_data_idx" ON "Presenca"("obraId", "data");

CREATE TABLE "PresencaHistorico" (
    "id" TEXT NOT NULL,
    "presencaId" TEXT NOT NULL,
    "funcionarioId" TEXT NOT NULL,
    "obraId" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "presente" BOOLEAN NOT NULL,
    "observacao" VARCHAR(500),
    "acao" "AcaoPresencaHistorico" NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "usuarioNome" TEXT NOT NULL,
    "usuarioPerfil" "Perfil" NOT NULL,
    "presenteAnterior" BOOLEAN,
    "observacaoAnterior" VARCHAR(500),
    "obraIdAnterior" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PresencaHistorico_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PresencaHistorico_presencaId_idx" ON "PresencaHistorico"("presencaId");
CREATE INDEX "PresencaHistorico_funcionarioId_data_idx" ON "PresencaHistorico"("funcionarioId", "data");

CREATE TABLE "PasswordReset" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PasswordReset_token_key" ON "PasswordReset"("token");
CREATE INDEX "PasswordReset_token_idx" ON "PasswordReset"("token");

ALTER TABLE "FuncionarioObra" ADD CONSTRAINT "FuncionarioObra_funcionarioId_fkey"
    FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FuncionarioObra" ADD CONSTRAINT "FuncionarioObra_obraId_fkey"
    FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Presenca" ADD CONSTRAINT "Presenca_funcionarioId_fkey"
    FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Presenca" ADD CONSTRAINT "Presenca_obraId_fkey"
    FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PresencaHistorico" ADD CONSTRAINT "PresencaHistorico_presencaId_fkey"
    FOREIGN KEY ("presencaId") REFERENCES "Presenca"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PresencaHistorico" ADD CONSTRAINT "PresencaHistorico_usuarioId_fkey"
    FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PasswordReset" ADD CONSTRAINT "PasswordReset_usuarioId_fkey"
    FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
