import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { temPermissao } from "@/lib/permissions";

export async function GET() {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "ver_obras")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const obras = await prisma.obra.findMany({
    where: { ativa: true },
    include: { _count: { select: { funcionarios: true } } },
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(obras);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "cadastrar_obra")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { nome, endereco, descricao } = await request.json();

  if (!nome) {
    return NextResponse.json({ error: "Nome da obra é obrigatório" }, { status: 400 });
  }

  const obra = await prisma.obra.create({
    data: { nome, endereco, descricao },
  });

  return NextResponse.json(obra, { status: 201 });
}
