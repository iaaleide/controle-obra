import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { temPermissao } from "@/lib/permissions";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "editar_obra")) {
    return NextResponse.json({ error: "Sem permissão para alterar" }, { status: 403 });
  }

  const { id } = await params;
  const { nome, endereco, descricao, ativa } = await request.json();

  const obra = await prisma.obra.update({
    where: { id },
    data: { nome, endereco, descricao, ativa },
  });

  return NextResponse.json(obra);
}
