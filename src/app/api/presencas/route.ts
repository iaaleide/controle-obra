import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { temPermissao } from "@/lib/permissions";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "ver_presenca")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const obraId = searchParams.get("obraId");
  const data = searchParams.get("data");

  if (!obraId || !data) {
    return NextResponse.json({ error: "obraId e data são obrigatórios" }, { status: 400 });
  }

  const dataRef = new Date(data + "T12:00:00");

  const funcionarios = await prisma.funcionario.findMany({
    where: { obraId, ativo: true },
    include: {
      presencas: {
        where: { data: dataRef },
        take: 1,
      },
    },
    orderBy: { nome: "asc" },
  });

  const resultado = funcionarios.map((f) => ({
    funcionarioId: f.id,
    nome: f.nome,
    cargo: f.cargo,
    presenca: f.presencas[0] || null,
  }));

  return NextResponse.json(resultado);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "cadastrar_presenca")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { funcionarioId, obraId, data, presente, observacao } = await request.json();

  if (!funcionarioId || !obraId || !data) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  if (observacao && observacao.length > 500) {
    return NextResponse.json({ error: "Observação máximo 500 caracteres" }, { status: 400 });
  }

  const dataRef = new Date(data + "T12:00:00");

  const existente = await prisma.presenca.findUnique({
    where: {
      funcionarioId_data: { funcionarioId, data: dataRef },
    },
  });

  if (existente) {
    if (!temPermissao(session.perfil, "editar_presenca")) {
      return NextResponse.json(
        { error: "Registro já existe. Apenas administrador pode alterar." },
        { status: 403 }
      );
    }

    const atualizada = await prisma.presenca.update({
      where: { id: existente.id },
      data: { presente: !!presente, observacao: observacao || null },
    });
    return NextResponse.json(atualizada);
  }

  const presenca = await prisma.presenca.create({
    data: {
      funcionarioId,
      obraId,
      data: dataRef,
      presente: !!presente,
      observacao: observacao || null,
    },
  });

  return NextResponse.json(presenca, { status: 201 });
}
