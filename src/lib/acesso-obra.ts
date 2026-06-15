import type { Obra } from "@prisma/client";
import { Perfil } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function usuarioPodeAcessarObra(
  usuarioId: string,
  perfil: Perfil,
  obraId: string
): Promise<boolean> {
  if (perfil === Perfil.ADMIN || perfil === Perfil.MESTRE) return true;

  if (perfil === Perfil.VISITANTE) {
    const alocacao = await prisma.usuarioObra.findUnique({
      where: { usuarioId_obraId: { usuarioId, obraId } },
    });
    return !!alocacao;
  }

  return false;
}

export async function exigirAcessoObra(
  usuarioId: string,
  perfil: Perfil,
  obraId: string
): Promise<{ ok: true; obra: Obra } | { ok: false; status: number; error: string }> {
  const obra = await prisma.obra.findFirst({
    where: { id: obraId, ativa: true },
  });

  if (!obra) {
    return { ok: false, status: 404, error: "Obra não encontrada" };
  }

  const permitido = await usuarioPodeAcessarObra(usuarioId, perfil, obraId);
  if (!permitido) {
    return {
      ok: false,
      status: 403,
      error: "Você não tem acesso a esta obra",
    };
  }

  return { ok: true, obra };
}

export async function sincronizarObrasVisitante(
  usuarioId: string,
  obraIds: string[]
): Promise<void> {
  const ids = [...new Set(obraIds.filter(Boolean))];

  await prisma.$transaction([
    prisma.usuarioObra.deleteMany({ where: { usuarioId } }),
    ...(ids.length > 0
      ? [
          prisma.usuarioObra.createMany({
            data: ids.map((obraId) => ({ usuarioId, obraId })),
            skipDuplicates: true,
          }),
        ]
      : []),
  ]);
}
