import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { temPermissao } from "@/lib/permissions";

export async function GET() {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "gerenciar_ferramentas")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const ferramentas = await prisma.ferramenta.findMany({
    where: { ativa: true },
    include: {
      emprestimos: {
        where: { dataDevolvida: null },
        include: { obra: { select: { id: true, nome: true } } },
        orderBy: { dataDeixada: "desc" },
        take: 1,
      },
    },
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(ferramentas);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "gerenciar_ferramentas")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { nome, descricao } = await request.json();
  if (!nome?.trim()) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  }

  const ferramenta = await prisma.ferramenta.create({
    data: { nome: nome.trim(), descricao: descricao || null },
  });

  return NextResponse.json(ferramenta, { status: 201 });
}
