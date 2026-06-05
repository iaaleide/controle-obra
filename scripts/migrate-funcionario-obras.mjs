import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "FuncionarioObra" (
      "funcionarioId" TEXT NOT NULL,
      "obraId" TEXT NOT NULL,
      "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "FuncionarioObra_pkey" PRIMARY KEY ("funcionarioId", "obraId")
    );
  `);

  const hasObraId = await prisma.$queryRawUnsafe(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'Funcionario' AND column_name = 'obraId';
  `);

  if (Array.isArray(hasObraId) && hasObraId.length > 0) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "FuncionarioObra" ("funcionarioId", "obraId", "criadoEm")
      SELECT "id", "obraId", "criadoEm" FROM "Funcionario"
      WHERE "obraId" IS NOT NULL
      ON CONFLICT ("funcionarioId", "obraId") DO NOTHING;
    `);
    console.log("Dados migrados de Funcionario.obraId para FuncionarioObra");
  } else {
    console.log("Coluna obraId já removida — nada a migrar");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
