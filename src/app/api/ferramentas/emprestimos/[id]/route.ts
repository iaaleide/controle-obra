import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { temPermissao } from "@/lib/permissions";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "gerenciar_ferramentas")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { id } = await params;
  const { dataDevolvida } = await request.json();

  if (!dataDevolvida) {
    return NextResponse.json({ error: "dataDevolvida é obrigatória" }, { status: 400 });
  }

  const emprestimo = await prisma.ferramentaEmprestimo.update({
    where: { id },
    data: { dataDevolvida: new Date(dataDevolvida + "T12:00:00") },
    include: {
      ferramenta: { select: { id: true, nome: true } },
      obra: { select: { id: true, nome: true } },
    },
  });

  return NextResponse.json(emprestimo);
}
