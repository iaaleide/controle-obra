import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { temPermissao } from "@/lib/permissions";

export async function GET() {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "gerenciar_ferramentas")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const emprestimos = await prisma.ferramentaEmprestimo.findMany({
    include: {
      ferramenta: { select: { id: true, nome: true } },
      obra: { select: { id: true, nome: true } },
    },
    orderBy: { dataDeixada: "desc" },
    take: 50,
  });

  return NextResponse.json(emprestimos);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "gerenciar_ferramentas")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { ferramentaId, obraId, dataDeixada, observacao } = await request.json();

  if (!ferramentaId || !obraId || !dataDeixada) {
    return NextResponse.json(
      { error: "ferramentaId, obraId e dataDeixada são obrigatórios" },
      { status: 400 }
    );
  }

  const ativo = await prisma.ferramentaEmprestimo.findFirst({
    where: { ferramentaId, dataDevolvida: null },
  });
  if (ativo) {
    return NextResponse.json(
      { error: "Ferramenta já está emprestada em outra obra" },
      { status: 400 }
    );
  }

  const emprestimo = await prisma.ferramentaEmprestimo.create({
    data: {
      ferramentaId,
      obraId,
      dataDeixada: new Date(dataDeixada + "T12:00:00"),
      observacao: observacao || null,
    },
    include: {
      ferramenta: { select: { id: true, nome: true } },
      obra: { select: { id: true, nome: true } },
    },
  });

  return NextResponse.json(emprestimo, { status: 201 });
}
