import { PrismaClient, Perfil } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const senhaHash = await bcrypt.hash("atomica", 12);

  await prisma.usuario.upsert({
    where: { login: "atomica" },
    update: {},
    create: {
      login: "atomica",
      senhaHash,
      nome: "Administrador",
      perfil: Perfil.ADMIN,
    },
  });

  console.log("✅ Usuário admin criado: login=atomica, senha=atomica");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
