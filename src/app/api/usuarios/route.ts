import { NextResponse } from "next/server";
import { getSession, hashSenha } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { temPermissao } from "@/lib/permissions";
import { Perfil } from "@prisma/client";

export async function GET() {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "gerenciar_usuarios")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const usuarios = await prisma.usuario.findMany({
    select: { id: true, login: true, nome: true, perfil: true, ativo: true, criadoEm: true },
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(usuarios);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "gerenciar_usuarios")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { login, senha, nome, perfil } = await request.json();

  if (!login || !senha || !nome || !perfil) {
    return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 });
  }

  if (!Object.values(Perfil).includes(perfil)) {
    return NextResponse.json({ error: "Perfil inválido" }, { status: 400 });
  }

  const existente = await prisma.usuario.findUnique({
    where: { login: login.trim().toLowerCase() },
  });

  if (existente) {
    return NextResponse.json({ error: "Login já existe" }, { status: 409 });
  }

  const usuario = await prisma.usuario.create({
    data: {
      login: login.trim().toLowerCase(),
      senhaHash: await hashSenha(senha),
      nome,
      perfil,
    },
    select: { id: true, login: true, nome: true, perfil: true, ativo: true },
  });

  return NextResponse.json(usuario, { status: 201 });
}
