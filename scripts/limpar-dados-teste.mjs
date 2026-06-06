/**
 * Remove dados operacionais de teste, mantendo usuários do sistema.
 * Uso: node scripts/limpar-dados-teste.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const counts = {
    presencaHistorico: await prisma.presencaHistorico.deleteMany(),
    presencas: await prisma.presenca.deleteMany(),
    funcionarioObra: await prisma.funcionarioObra.deleteMany(),
    funcionarios: await prisma.funcionario.deleteMany(),
    usuarioObra: await prisma.usuarioObra.deleteMany(),
    diarioFotos: await prisma.diarioObraFoto.deleteMany(),
    diarios: await prisma.diarioObra.deleteMany(),
    emprestimos: await prisma.ferramentaEmprestimo.deleteMany(),
    ferramentas: await prisma.ferramenta.deleteMany(),
    custos: await prisma.custoFuncionario.deleteMany(),
    obras: await prisma.obra.deleteMany(),
    passwordReset: await prisma.passwordReset.deleteMany(),
  };

  console.log("Dados de teste removidos:");
  for (const [tabela, { count }] of Object.entries(counts)) {
    console.log(`  ${tabela}: ${count}`);
  }
  console.log("\nUsuários mantidos. Login admin: atomica / atomica");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
