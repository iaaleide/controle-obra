import { NextResponse } from "next/server";
import { getSession, hashSenha } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { temPermissao } from "@/lib/permissions";
import { Perfil } from "@prisma/client";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "gerenciar_usuarios")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { id } = await params;
  const { nome, perfil, ativo, senha } = await request.json();

  if (perfil && !Object.values(Perfil).includes(perfil)) {
    return NextResponse.json({ error: "Perfil inválido" }, { status: 400 });
  }

  const usuario = await prisma.usuario.update({
    where: { id },
    data: {
      ...(nome !== undefined && { nome }),
      ...(perfil !== undefined && { perfil }),
      ...(ativo !== undefined && { ativo }),
      ...(senha && { senhaHash: await hashSenha(senha) }),
    },
    select: { id: true, login: true, nome: true, perfil: true, ativo: true },
  });

  return NextResponse.json(usuario);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "gerenciar_usuarios")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { id } = await params;

  if (id === session.id) {
    return NextResponse.json(
      { error: "Você não pode excluir seu próprio usuário" },
      { status: 400 }
    );
  }

  const existente = await prisma.usuario.findUnique({ where: { id } });
  if (!existente) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  if (!existente.ativo) {
    return NextResponse.json({ error: "Usuário já está inativo" }, { status: 400 });
  }

  if (existente.perfil === "ADMIN") {
    const adminsAtivos = await prisma.usuario.count({
      where: { perfil: "ADMIN", ativo: true },
    });
    if (adminsAtivos <= 1) {
      return NextResponse.json(
        { error: "Não é possível excluir o único administrador ativo" },
        { status: 400 }
      );
    }
  }

  const usuario = await prisma.usuario.update({
    where: { id },
    data: { ativo: false },
    select: { id: true, login: true, nome: true, perfil: true, ativo: true },
  });

  return NextResponse.json(usuario);
}
