-- Migração: histórico de alterações de presença
-- Execute no Supabase SQL Editor se não usar `npm run db:push`

DO $$ BEGIN
    CREATE TYPE "AcaoPresencaHistorico" AS ENUM ('CRIACAO', 'ALTERACAO');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "PresencaHistorico" (
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

CREATE INDEX IF NOT EXISTS "PresencaHistorico_presencaId_idx"
    ON "PresencaHistorico"("presencaId");

CREATE INDEX IF NOT EXISTS "PresencaHistorico_funcionarioId_data_idx"
    ON "PresencaHistorico"("funcionarioId", "data");

DO $$ BEGIN
    ALTER TABLE "PresencaHistorico" ADD CONSTRAINT "PresencaHistorico_presencaId_fkey"
        FOREIGN KEY ("presencaId") REFERENCES "Presenca"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "PresencaHistorico" ADD CONSTRAINT "PresencaHistorico_usuarioId_fkey"
        FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
