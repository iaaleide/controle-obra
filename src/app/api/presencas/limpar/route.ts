import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { temPermissao } from "@/lib/permissions";

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "limpar_registros")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { obraId } = await request.json().catch(() => ({}));

  if (obraId) {
    const obra = await prisma.obra.findUnique({ where: { id: obraId } });
    if (!obra) {
      return NextResponse.json({ error: "Obra não encontrada" }, { status: 404 });
    }
  }

  const where = obraId ? { obraId } : {};

  const resultado = await prisma.presenca.deleteMany({ where });

  return NextResponse.json({
    ok: true,
    removidos: resultado.count,
    message:
      resultado.count === 0
        ? "Nenhum registro de presença encontrado para remover."
        : `${resultado.count} registro(s) de presença removido(s) com sucesso.`,
  });
}
