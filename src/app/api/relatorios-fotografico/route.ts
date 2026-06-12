import { NextResponse } from "next/server";
import { TipoRelatorio } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { exigirAcessoObra } from "@/lib/acesso-obra";
import { prisma } from "@/lib/prisma";
import { temPermissao } from "@/lib/permissions";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "gerenciar_relatorios_fotografico")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const obraId = new URL(request.url).searchParams.get("obraId");
  if (!obraId) {
    return NextResponse.json({ error: "obraId é obrigatório" }, { status: 400 });
  }

  const acesso = await exigirAcessoObra(session.id, session.perfil, obraId);
  if (!acesso.ok) {
    return NextResponse.json({ error: acesso.error }, { status: acesso.status });
  }

  const relatorios = await prisma.relatorio.findMany({
    where: { obraId, tipo: TipoRelatorio.FOTOGRAFICO },
    include: { fotos: { orderBy: { ordem: "asc" } }, obra: true },
    orderBy: { periodoInicio: "desc" },
    take: 30,
  });

  return NextResponse.json(relatorios);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "gerenciar_relatorios_fotografico")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await request.json();
  const { obraId, periodoInicio, periodoFim, clienteNome, observacoesGerais, fotos } = body;

  if (!obraId || !periodoInicio || !periodoFim) {
    return NextResponse.json(
      { error: "obraId, periodoInicio e periodoFim são obrigatórios" },
      { status: 400 }
    );
  }

  const acesso = await exigirAcessoObra(session.id, session.perfil, obraId);
  if (!acesso.ok) {
    return NextResponse.json({ error: acesso.error }, { status: acesso.status });
  }

  const obra = await prisma.obra.findUnique({ where: { id: obraId } });
  const listaFotos = Array.isArray(fotos) ? fotos.slice(0, 6) : [];

  const relatorio = await prisma.$transaction(async (tx) => {
    const criado = await tx.relatorio.create({
      data: {
        obraId,
        tipo: TipoRelatorio.FOTOGRAFICO,
        periodoInicio: new Date(periodoInicio + "T12:00:00"),
        periodoFim: new Date(periodoFim + "T12:00:00"),
        clienteNome: clienteNome || obra?.clienteNome || null,
        observacoesGerais: observacoesGerais || null,
      },
    });

    if (listaFotos.length > 0) {
      await tx.fotoRelatorio.createMany({
        data: listaFotos.map(
          (f: { ordem: number; imagemBase64?: string; legenda?: string }, index: number) => ({
            relatorioId: criado.id,
            ordem: f.ordem ?? index,
            imagemBase64: f.imagemBase64 || null,
            legenda: f.legenda || null,
          })
        ),
      });
    }

    return tx.relatorio.findUnique({
      where: { id: criado.id },
      include: { fotos: { orderBy: { ordem: "asc" } }, obra: true },
    });
  });

  return NextResponse.json(relatorio, { status: 201 });
}
