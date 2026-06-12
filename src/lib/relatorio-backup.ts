import type { Prisma, TipoRelatorio } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type RelatorioComDetalhes = Prisma.RelatorioGetPayload<{
  include: { itens: true; fotos: true; obra: true };
}>;

export async function backupRelatorioAntesExcluir(
  relatorio: RelatorioComDetalhes,
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
  excluidoPor: { id: string; nome: string }
) {
  const relatorio = await prisma.relatorio.findFirst({
    where: { id, tipo },
    include: { itens: true, fotos: true, obra: true },
  });

  if (!relatorio) return null;

  await prisma.$transaction(async (tx) => {
    await backupRelatorioAntesExcluir(relatorio, excluidoPor, tx);
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
    for (const relatorio of relatorios) {
      await backupRelatorioAntesExcluir(relatorio, excluidoPor, tx);
    }
    await tx.relatorio.deleteMany({ where: { obraId, tipo } });
  });

  return relatorios.length;
}
