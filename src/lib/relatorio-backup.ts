import type { Obra, Prisma, TipoRelatorio } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type RelatorioParaBackup = {
  id: string;
  obraId: string;
  tipo: TipoRelatorio;
  obra: Obra;
  itens?: unknown[];
  fotos?: unknown[];
  [key: string]: unknown;
};

export async function backupRelatorioAntesExcluir(
  relatorio: RelatorioParaBackup,
  excluidoPor: { id: string; nome: string },
  tx?: Prisma.TransactionClient
) {
  const client = tx ?? prisma;

  await client.relatorioBackup.create({
    data: {
      relatorioId: relatorio.id,
      obraId: relatorio.obraId,
      tipo: relatorio.tipo,
      dados: JSON.parse(JSON.stringify(relatorio)) as Prisma.InputJsonValue,
      excluidoPorId: excluidoPor.id,
      excluidoPorNome: excluidoPor.nome,
    },
  });
}

export async function excluirRelatorioComBackup(
  id: string,
  tipo: TipoRelatorio,
  excluidoPor: { id: string; nome: string },
  relatorioCarregado?: RelatorioParaBackup | null
) {
  const relatorio =
    relatorioCarregado ??
    (await prisma.relatorio.findFirst({
      where: { id, tipo },
      include: { itens: true, fotos: true, obra: true },
    }));

  if (!relatorio) return null;

  await prisma.$transaction(async (tx) => {
    await backupRelatorioAntesExcluir(relatorio as RelatorioParaBackup, excluidoPor, tx);
    await tx.relatorio.delete({ where: { id } });
  });

  return relatorio;
}

export async function limparRelatoriosObraComBackup(
  obraId: string,
  tipo: TipoRelatorio,
  excluidoPor: { id: string; nome: string }
) {
  const relatorios = await prisma.relatorio.findMany({
    where: { obraId, tipo },
    include: { itens: true, fotos: true, obra: true },
  });

  if (relatorios.length === 0) return 0;

  await prisma.$transaction(async (tx) => {
    await tx.relatorioBackup.createMany({
      data: relatorios.map((relatorio) => ({
        relatorioId: relatorio.id,
        obraId: relatorio.obraId,
        tipo: relatorio.tipo,
        dados: JSON.parse(JSON.stringify(relatorio)) as Prisma.InputJsonValue,
        excluidoPorId: excluidoPor.id,
        excluidoPorNome: excluidoPor.nome,
      })),
    });
    await tx.relatorio.deleteMany({ where: { obraId, tipo } });
  });

  return relatorios.length;
}
