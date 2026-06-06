import { NextResponse } from "next/server";
import { Perfil } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { temPermissao } from "@/lib/permissions";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const podeVerTodas = temPermissao(session.perfil, "ver_obras");
  const podeVerAlocadas =
    session.perfil === Perfil.VISITANTE && temPermissao(session.perfil, "ver_relatorios");

  if (!podeVerTodas && !podeVerAlocadas) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const incluirInativas =
    searchParams.get("incluirInativas") === "true" &&
    temPermissao(session.perfil, "excluir_obra");

  await prisma.funcionarioObra.deleteMany({
    where: {
      OR: [{ funcionario: { ativo: false } }, { obra: { ativa: false } }],
    },
  });

  const obras = await prisma.obra.findMany({
    where: {
      ...(!incluirInativas ? { ativa: true } : {}),
      ...(podeVerAlocadas && !podeVerTodas
        ? { visitantes: { some: { usuarioId: session.id } } }
        : {}),
    },
    include: {
      _count: {
        select: {
          alocacoes: { where: { funcionario: { ativo: true } } },
        },
      },
    },
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(obras);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "cadastrar_obra")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { nome, clienteNome, endereco, descricao } = await request.json();

  if (!nome) {
    return NextResponse.json({ error: "Nome da obra é obrigatório" }, { status: 400 });
  }

  const obra = await prisma.obra.create({
    data: { nome, clienteNome: clienteNome || null, endereco, descricao },
  });

  return NextResponse.json(obra, { status: 201 });
}
