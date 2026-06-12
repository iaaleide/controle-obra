import { NextResponse } from "next/server";
import { TipoRelatorio } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { exigirAcessoObra } from "@/lib/acesso-obra";
import { prisma } from "@/lib/prisma";
import { temPermissao } from "@/lib/permissions";
import { calcularItemMedicao, type ItemMedicaoInput } from "@/lib/relatorio-medicao";
import { excluirRelatorioComBackup } from "@/lib/relatorio-backup";

type Params = { params: Promise<{ id: string }> };

async function buscarRelatorio(id: string) {
  return prisma.relatorio.findFirst({
    where: { id, tipo: TipoRelatorio.MEDICAO },
    include: { itens: { orderBy: { ordem: "asc" } }, obra: true },
  });
}

export async function GET(_request: Request, { params }: Params) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "gerenciar_relatorios_medicao")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { id } = await params;
  const relatorio = await buscarRelatorio(id);
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
  const existente = await buscarRelatorio(id);
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
          data: listaItens.map((item, ordem) => {
            const calc = calcularItemMedicao(item);
            return {
              relatorioId: id,
              ordem,
              item: calc.item || null,
              descricao: calc.descricao,
              valorTotal: calc.valorTotal,
              valorPrevisto: calc.valorPrevisto,
              valorRealizado: calc.valorRealizado,
              percentualExecutado: calc.percentualExecutado,
              mostrarNoRelatorio: calc.mostrarNoRelatorio !== false,
              observacao: calc.observacao || null,
            };
          }),
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
  const existente = await buscarRelatorio(id);
  if (!existente) {
    return NextResponse.json({ error: "Relatório não encontrado" }, { status: 404 });
  }

  const acesso = await exigirAcessoObra(session.id, session.perfil, existente.obraId);
  if (!acesso.ok) {
    return NextResponse.json({ error: acesso.error }, { status: acesso.status });
  }

  const excluido = await excluirRelatorioComBackup(id, TipoRelatorio.MEDICAO, {
    id: session.id,
    nome: session.nome,
  });

  if (!excluido) {
    return NextResponse.json({ error: "Relatório não encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    message: "Relatório excluído. Backup salvo no Supabase.",
  });
}
