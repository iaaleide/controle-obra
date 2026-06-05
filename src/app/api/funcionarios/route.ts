import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { temPermissao } from "@/lib/permissions";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "ver_funcionarios")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const obraId = searchParams.get("obraId");

  const funcionarios = await prisma.funcionario.findMany({
    where: {
      ativo: true,
      ...(obraId ? { obraId } : {}),
    },
    include: { obra: { select: { id: true, nome: true } } },
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(funcionarios);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "cadastrar_funcionario")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { nome, cargo, telefone, obraId } = await request.json();

  if (!nome || !obraId) {
    return NextResponse.json({ error: "Nome e obra são obrigatórios" }, { status: 400 });
  }

  const funcionario = await prisma.funcionario.create({
    data: { nome, cargo, telefone, obraId },
    include: { obra: { select: { id: true, nome: true } } },
  });

  return NextResponse.json(funcionario, { status: 201 });
}
