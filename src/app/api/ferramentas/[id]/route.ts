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
  const { nome, descricao } = await request.json();

  const ferramenta = await prisma.ferramenta.update({
    where: { id },
    data: {
      ...(nome !== undefined ? { nome: nome.trim() } : {}),
      ...(descricao !== undefined ? { descricao: descricao || null } : {}),
    },
  });

  return NextResponse.json(ferramenta);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "gerenciar_ferramentas")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { id } = await params;
  const emprestimoAtivo = await prisma.ferramentaEmprestimo.findFirst({
    where: { ferramentaId: id, dataDevolvida: null },
  });
  if (emprestimoAtivo) {
    return NextResponse.json(
      { error: "Ferramenta emprestada — registre a devolução antes de excluir" },
      { status: 400 }
    );
  }

  const ferramenta = await prisma.ferramenta.update({
    where: { id },
    data: { ativa: false },
  });

  return NextResponse.json(ferramenta);
}
