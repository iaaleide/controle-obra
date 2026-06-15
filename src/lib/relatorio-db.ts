import { TipoRelatorio } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function buscarRelatorioMedicao(id: string) {
  return prisma.relatorio.findFirst({
    where: { id, tipo: TipoRelatorio.MEDICAO },
    include: { itens: { orderBy: { ordem: "asc" } }, obra: true },
  });
}

export async function buscarRelatorioFotografico(id: string) {
  return prisma.relatorio.findFirst({
    where: { id, tipo: TipoRelatorio.FOTOGRAFICO },
    include: { fotos: { orderBy: { ordem: "asc" } }, obra: true },
  });
}
