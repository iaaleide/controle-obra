import { NextResponse } from "next/server";
import { Perfil } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sincronizarObrasVisitante } from "@/lib/acesso-obra";
import { temPermissao } from "@/lib/permissions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "alocar_obras_visitante")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { id } = await params;
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      login: true,
      perfil: true,
      obrasAlocadas: { select: { obraId: true } },
    },
  });

  if (!usuario || usuario.perfil !== Perfil.VISITANTE) {
    return NextResponse.json({ error: "Visitante não encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    ...usuario,
    obraIds: usuario.obrasAlocadas.map((a) => a.obraId),
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "alocar_obras_visitante")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { id } = await params;
  const { obraIds } = await request.json();

  if (!Array.isArray(obraIds)) {
    return NextResponse.json({ error: "obraIds deve ser uma lista" }, { status: 400 });
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: { id: true, perfil: true, ativo: true },
  });

  if (!usuario || usuario.perfil !== Perfil.VISITANTE || !usuario.ativo) {
    return NextResponse.json({ error: "Visitante não encontrado" }, { status: 404 });
  }

  const obrasValidas = await prisma.obra.findMany({
    where: { id: { in: obraIds }, ativa: true },
    select: { id: true },
  });

  if (obraIds.length > 0 && obrasValidas.length !== obraIds.length) {
    return NextResponse.json({ error: "Uma ou mais obras são inválidas" }, { status: 400 });
  }

  await sincronizarObrasVisitante(id, obrasValidas.map((o) => o.id));

  const atualizado = await prisma.usuario.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      login: true,
      obrasAlocadas: { select: { obra: { select: { id: true, nome: true } } } },
    },
  });

  return NextResponse.json({
    message: "Obras do visitante atualizadas",
    usuario: atualizado,
  });
}
