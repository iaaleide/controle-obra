import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { exigirAcessoObra } from "@/lib/acesso-obra";
import { prisma } from "@/lib/prisma";
import { temPermissao } from "@/lib/permissions";
import { fotosParaCreateMany } from "@/lib/fotografico-montar";
import { excluirRelatorioComBackup } from "@/lib/relatorio-backup";
import { buscarRelatorioFotografico } from "@/lib/relatorio-db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "gerenciar_relatorios_fotografico")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { id } = await params;
  const relatorio = await buscarRelatorioFotografico(id);
  if (!relatorio) {
    return NextResponse.json({ error: "Relatório não encontrado" }, { status: 404 });
  }

  const acesso = await exigirAcessoObra(session.id, session.perfil, relatorio.obraId);
  if (!acesso.ok) {
    return NextResponse.json({ error: acesso.error }, { status: acesso.status });
  }

  return NextResponse.json(relatorio);
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "gerenciar_relatorios_fotografico")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { id } = await params;
  const existente = await buscarRelatorioFotografico(id);
  if (!existente) {
    return NextResponse.json({ error: "Relatório não encontrado" }, { status: 404 });
  }

  const acesso = await exigirAcessoObra(session.id, session.perfil, existente.obraId);
  if (!acesso.ok) {
    return NextResponse.json({ error: acesso.error }, { status: acesso.status });
  }

  const body = await request.json();
  const { periodoInicio, periodoFim, clienteNome, observacoesGerais, fotos } = body;

  const relatorio = await prisma.$transaction(async (tx) => {
    await tx.relatorio.update({
      where: { id },
      data: {
        ...(periodoInicio && { periodoInicio: new Date(periodoInicio + "T12:00:00") }),
        ...(periodoFim && { periodoFim: new Date(periodoFim + "T12:00:00") }),
        ...(clienteNome !== undefined && { clienteNome: clienteNome || null }),
        ...(observacoesGerais !== undefined && { observacoesGerais: observacoesGerais || null }),
      },
    });

    if (Array.isArray(fotos)) {
      await tx.fotoRelatorio.deleteMany({ where: { relatorioId: id } });
      if (fotos.length > 0) {
        await tx.fotoRelatorio.createMany({
          data: fotosParaCreateMany(id, fotos),
        });
      }
    }

    return tx.relatorio.findUnique({
      where: { id },
      include: { fotos: { orderBy: { ordem: "asc" } }, obra: true },
    });
  });

  return NextResponse.json(relatorio);
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "gerenciar_relatorios_fotografico")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { id } = await params;
  const existente = await buscarRelatorioFotografico(id);
  if (!existente) {
    return NextResponse.json({ error: "Relatório não encontrado" }, { status: 404 });
  }

  const acesso = await exigirAcessoObra(session.id, session.perfil, existente.obraId);
  if (!acesso.ok) {
    return NextResponse.json({ error: acesso.error }, { status: acesso.status });
  }

  const excluido = await excluirRelatorioComBackup(
    id,
    existente.tipo,
    { id: session.id, nome: session.nome },
    existente
  );

  if (!excluido) {
    return NextResponse.json({ error: "Relatório não encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    message: "Relatório excluído. Backup salvo no Supabase.",
  });
}
