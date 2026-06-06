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

  const existente = await prisma.obra.findUnique({ where: { id } });
  if (!existente) {
    return NextResponse.json({ error: "Obra não encontrada" }, { status: 404 });
  }

  const obra = await prisma.obra.update({
    where: { id },
    data: {
      ...(nome !== undefined ? { nome: nome.trim() } : {}),
      ...(endereco !== undefined ? { endereco: endereco || null } : {}),
      ...(descricao !== undefined ? { descricao: descricao || null } : {}),
      ...(ativa !== undefined ? { ativa } : {}),
    },
    include: { _count: { select: { alocacoes: true } } },
  });

  return NextResponse.json(obra);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "excluir_obra")) {
    return NextResponse.json({ error: "Sem permissão para excluir" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const permanente = body?.permanente === true;

  const existente = await prisma.obra.findUnique({
    where: { id },
    include: { _count: { select: { presencas: true } } },
  });

  if (!existente) {
    return NextResponse.json({ error: "Obra não encontrada" }, { status: 404 });
  }

  if (permanente) {
    await prisma.obra.delete({ where: { id } });
    return NextResponse.json({ id, excluidaPermanentemente: true });
  }

  if (!existente.ativa) {
    return NextResponse.json({ error: "Obra já está inativa" }, { status: 400 });
  }

  const obra = await prisma.obra.update({
    where: { id },
    data: { ativa: false },
    include: { _count: { select: { alocacoes: true, presencas: true } } },
  });

  return NextResponse.json(obra);
}
