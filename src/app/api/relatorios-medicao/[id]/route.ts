import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { exigirAcessoObra } from "@/lib/acesso-obra";
import { prisma } from "@/lib/prisma";
import { temPermissao } from "@/lib/permissions";
import { itensMedicaoParaCreateMany, type ItemMedicaoInput } from "@/lib/relatorio-medicao";
import { excluirRelatorioComBackup } from "@/lib/relatorio-backup";
import { buscarRelatorioMedicao } from "@/lib/relatorio-db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "gerenciar_relatorios_medicao")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { id } = await params;
  const relatorio = await buscarRelatorioMedicao(id);
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
  if (!session || !temPermissao(session.perfil, "gerenciar_relatorios_medicao")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { id } = await params;
  const existente = await buscarRelatorioMedicao(id);
  if (!existente) {
    return NextResponse.json({ error: "Relatório não encontrado" }, { status: 404 });
  }

  const acesso = await exigirAcessoObra(session.id, session.perfil, existente.obraId);
  if (!acesso.ok) {
    return NextResponse.json({ error: acesso.error }, { status: acesso.status });
  }

  const body = await request.json();
  const {
    periodoInicio,
    periodoFim,
    acumuladoTotal,
    observacoesGerais,
    modoGrafico,
    opcoesPdfMedicao,
    clienteNome,
    itens,
  } = body;

  const listaItens: ItemMedicaoInput[] | undefined = Array.isArray(itens) ? itens : undefined;

  const relatorio = await prisma.$transaction(async (tx) => {
    await tx.relatorio.update({
      where: { id },
      data: {
        ...(periodoInicio && { periodoInicio: new Date(periodoInicio + "T12:00:00") }),
        ...(periodoFim && { periodoFim: new Date(periodoFim + "T12:00:00") }),
        ...(acumuladoTotal !== undefined && {
          acumuladoTotal: acumuladoTotal != null ? acumuladoTotal : null,
        }),
        ...(observacoesGerais !== undefined && { observacoesGerais: observacoesGerais || null }),
        ...(modoGrafico && { modoGrafico }),
        ...(opcoesPdfMedicao !== undefined && { opcoesPdfMedicao }),
        ...(clienteNome !== undefined && { clienteNome: clienteNome || null }),
      },
    });

    if (listaItens) {
      await tx.itemRelatorio.deleteMany({ where: { relatorioId: id } });
      if (listaItens.length > 0) {
        await tx.itemRelatorio.createMany({
          data: itensMedicaoParaCreateMany(id, listaItens),
        });
      }
    }

    return tx.relatorio.findUnique({
      where: { id },
      include: { itens: { orderBy: { ordem: "asc" } }, obra: true },
    });
  });

  return NextResponse.json(relatorio);
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "gerenciar_relatorios_medicao")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { id } = await params;
  const existente = await buscarRelatorioMedicao(id);
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
