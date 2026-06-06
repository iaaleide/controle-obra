import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { temPermissao } from "@/lib/permissions";
import { paraArmazenamento } from "@/lib/telefone";

const includeObras = {
  obras: {
    where: { obra: { ativa: true } },
    include: { obra: { select: { id: true, nome: true } } },
  },
} as const;

function formatFuncionario(
  f: {
    id: string;
    nome: string;
    cargo: string | null;
    telefone: string | null;
    ativo: boolean;
    obras: { obra: { id: string; nome: string } }[];
  }
) {
  return {
    id: f.id,
    nome: f.nome,
    cargo: f.cargo,
    telefone: f.telefone,
    ativo: f.ativo,
    obras: f.obras.map((a) => a.obra),
  };
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "editar_funcionario")) {
    return NextResponse.json({ error: "Sem permissão para alterar" }, { status: 403 });
  }

  const { id } = await params;
  const { nome, cargo, telefone, ativo, obraIds } = await request.json();

  if (ativo !== undefined && !temPermissao(session.perfil, "excluir_funcionario")) {
    return NextResponse.json({ error: "Sem permissão para alterar status" }, { status: 403 });
  }

  const ids = Array.isArray(obraIds) ? obraIds.filter(Boolean) : null;

  const funcionario = await prisma.$transaction(async (tx) => {
    if (ids !== null) {
      await tx.funcionarioObra.deleteMany({ where: { funcionarioId: id } });
      if (ids.length > 0) {
        await tx.funcionarioObra.createMany({
          data: ids.map((obraId: string) => ({ funcionarioId: id, obraId })),
        });
      }
    }

    return tx.funcionario.update({
      where: { id },
      data: {
        ...(nome !== undefined ? { nome: nome.trim() } : {}),
        ...(cargo !== undefined ? { cargo: cargo || null } : {}),
        ...(telefone !== undefined
          ? { telefone: telefone ? paraArmazenamento(telefone) || null : null }
          : {}),
        ...(ativo !== undefined ? { ativo } : {}),
      },
      include: includeObras,
    });
  });

  return NextResponse.json(formatFuncionario(funcionario));
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "excluir_funcionario")) {
    return NextResponse.json({ error: "Sem permissão para excluir" }, { status: 403 });
  }

  const { id } = await params;

  const existente = await prisma.funcionario.findUnique({ where: { id } });
  if (!existente) {
    return NextResponse.json({ error: "Funcionário não encontrado" }, { status: 404 });
  }

  if (!existente.ativo) {
    return NextResponse.json({ error: "Funcionário já está inativo" }, { status: 400 });
  }

  const funcionario = await prisma.$transaction(async (tx) => {
    await tx.funcionarioObra.deleteMany({ where: { funcionarioId: id } });
    return tx.funcionario.update({
      where: { id },
      data: { ativo: false },
      include: includeObras,
    });
  });

  return NextResponse.json(formatFuncionario(funcionario));
}
