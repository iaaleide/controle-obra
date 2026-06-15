import { prisma } from "@/lib/prisma";

/** Remove alocações de funcionários inativos ou obras inativas. */
export async function limparAlocacoesInvalidas(): Promise<void> {
  await prisma.funcionarioObra.deleteMany({
    where: {
      OR: [{ funcionario: { ativo: false } }, { obra: { ativa: false } }],
    },
  });
}
