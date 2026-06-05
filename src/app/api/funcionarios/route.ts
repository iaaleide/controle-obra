import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { temPermissao } from "@/lib/permissions";

const includeObras = {
  obras: {
    include: { obra: { select: { id: true, nome: true } } },
  },
} as const;

function formatFuncionario(
  f: Awaited<ReturnType<typeof prisma.funcionario.findFirst>> & {
    obras: { obra: { id: string; nome: string } }[];
  }
) {
  return {
    id: f!.id,
    nome: f!.nome,
    cargo: f!.cargo,
    telefone: f!.telefone,
    ativo: f!.ativo,
    obras: f!.obras.map((a) => a.obra),
  };
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "ver_funcionarios")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const obraId = searchParams.get("obraId");
  const semObra = searchParams.get("semObra") === "true";

  const funcionarios = await prisma.funcionario.findMany({
    where: {
      ativo: true,
      ...(obraId ? { obras: { some: { obraId } } } : {}),
      ...(semObra ? { obras: { none: {} } } : {}),
    },
    include: includeObras,
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(funcionarios.map((f) => formatFuncionario(f as never)));
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "cadastrar_funcionario")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { nome, cargo, telefone, obraIds } = await request.json();

  if (!nome?.trim()) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  }

  const ids = Array.isArray(obraIds) ? obraIds.filter(Boolean) : [];

  const funcionario = await prisma.funcionario.create({
    data: {
      nome: nome.trim(),
      cargo: cargo || null,
      telefone: telefone || null,
      ...(ids.length > 0
        ? { obras: { create: ids.map((obraId: string) => ({ obraId })) } }
        : {}),
    },
    include: includeObras,
  });

  return NextResponse.json(formatFuncionario(funcionario as never), { status: 201 });
}
