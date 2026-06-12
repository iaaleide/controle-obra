import { NextResponse } from "next/server";
import { TipoRelatorio } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { exigirAcessoObra } from "@/lib/acesso-obra";
import { prisma } from "@/lib/prisma";
import { temPermissao } from "@/lib/permissions";
import { calcularItemMedicao, type ItemMedicaoInput } from "@/lib/relatorio-medicao";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "gerenciar_relatorios_medicao")) {
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
    where: { obraId, tipo: TipoRelatorio.MEDICAO },
    include: { itens: { orderBy: { ordem: "asc" } }, obra: true },
    orderBy: { periodoInicio: "desc" },
    take: 30,
  });

  return NextResponse.json(relatorios);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "gerenciar_relatorios_medicao")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await request.json();
  const {
    obraId,
    periodoInicio,
    periodoFim,
    acumuladoTotal,
    observacoesGerais,
    modoGrafico,
    opcoesPdfMedicao,
    clienteNome,
    itens,
  } = body;

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

  const listaItens: ItemMedicaoInput[] = Array.isArray(itens) ? itens : [];

  const relatorio = await prisma.$transaction(async (tx) => {
    const criado = await tx.relatorio.create({
      data: {
        obraId,
        tipo: TipoRelatorio.MEDICAO,
        periodoInicio: new Date(periodoInicio + "T12:00:00"),
        periodoFim: new Date(periodoFim + "T12:00:00"),
        acumuladoTotal: acumuladoTotal != null ? acumuladoTotal : null,
        observacoesGerais: observacoesGerais || null,
        modoGrafico: modoGrafico || "POR_SERVICO",
        opcoesPdfMedicao: opcoesPdfMedicao ?? undefined,
        clienteNome: clienteNome || null,
      },
    });

    if (listaItens.length > 0) {
      await tx.itemRelatorio.createMany({
        data: listaItens.map((item, ordem) => {
          const calc = calcularItemMedicao(item);
          return {
            relatorioId: criado.id,
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

    return tx.relatorio.findUnique({
      where: { id: criado.id },
      include: { itens: { orderBy: { ordem: "asc" } }, obra: true },
    });
  });

  return NextResponse.json(relatorio, { status: 201 });
}
