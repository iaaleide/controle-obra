import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { temPermissao } from "@/lib/permissions";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "editar_funcionario")) {
    return NextResponse.json({ error: "Sem permissão para alterar" }, { status: 403 });
  }

  const { id } = await params;
  const { nome, cargo, telefone, ativo } = await request.json();

  const funcionario = await prisma.funcionario.update({
    where: { id },
    data: { nome, cargo, telefone, ativo },
    include: { obra: { select: { id: true, nome: true } } },
  });

  return NextResponse.json(funcionario);
}
