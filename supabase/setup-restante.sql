-- Execute ESTE arquivo (o tipo Perfil já existe no seu banco)
-- SQL Editor → cole tudo → Run

-- Tabelas (ignora se já existirem)
CREATE TABLE IF NOT EXISTS "Usuario" (
    "id" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "perfil" "Perfil" NOT NULL DEFAULT 'VISITANTE',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Usuario_login_key" ON "Usuario"("login");

CREATE TABLE IF NOT EXISTS "Obra" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "endereco" TEXT,
    "descricao" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Obra_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Funcionario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cargo" TEXT,
    "telefone" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "obraId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Funcionario_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Presenca" (
    "id" TEXT NOT NULL,
    "funcionarioId" TEXT NOT NULL,
    "obraId" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "presente" BOOLEAN NOT NULL DEFAULT false,
    "observacao" VARCHAR(500),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Presenca_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PasswordReset" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

-- Admin inicial (login: atomica / senha: atomica)
INSERT INTO "Usuario" ("id", "login", "senhaHash", "nome", "perfil", "ativo", "criadoEm", "atualizadoEm")
VALUES (
  'admin-inicial-001',
  'atomica',
  '$2b$12$yEe13RjRqiChhpC0xyTfLOHwA90Zhdl.qh.ulUGJMFPKQodHKQRJK',
  'Administrador',
  'ADMIN',
  true,
  NOW(),
  NOW()
)
ON CONFLICT ("login") DO NOTHING;
