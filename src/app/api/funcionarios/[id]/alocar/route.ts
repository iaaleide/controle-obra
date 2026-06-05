import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { temPermissao } from "@/lib/permissions";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  const podeAlocar =
    session &&
    (temPermissao(session.perfil, "cadastrar_presenca") ||
      temPermissao(session.perfil, "cadastrar_funcionario") ||
      temPermissao(session.perfil, "editar_funcionario"));

  if (!podeAlocar) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { id } = await params;
  const { obraId } = await request.json();

  if (!obraId) {
    return NextResponse.json({ error: "obraId é obrigatório" }, { status: 400 });
  }

  const funcionario = await prisma.funcionario.findUnique({ where: { id, ativo: true } });
  if (!funcionario) {
    return NextResponse.json({ error: "Funcionário não encontrado" }, { status: 404 });
  }

  const obra = await prisma.obra.findUnique({ where: { id: obraId, ativa: true } });
  if (!obra) {
    return NextResponse.json({ error: "Obra não encontrada" }, { status: 404 });
  }

  await prisma.funcionarioObra.upsert({
    where: { funcionarioId_obraId: { funcionarioId: id, obraId } },
    create: { funcionarioId: id, obraId },
    update: {},
  });

  return NextResponse.json({ ok: true, funcionarioId: id, obraId, obraNome: obra.nome });
}
