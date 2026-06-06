import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { temPermissao } from "@/lib/permissions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "gerenciar_diario_obra")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { id } = await params;
  const diario = await prisma.diarioObra.findUnique({
    where: { id },
    include: {
      fotos: { orderBy: [{ pagina: "asc" }, { ordem: "asc" }] },
      obra: { select: { id: true, nome: true, clienteNome: true, endereco: true } },
    },
  });

  if (!diario) {
    return NextResponse.json({ error: "Diário não encontrado" }, { status: 404 });
  }

  return NextResponse.json(diario);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "gerenciar_diario_obra")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.diarioObra.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
