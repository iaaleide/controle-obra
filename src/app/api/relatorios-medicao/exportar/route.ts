import { NextResponse } from "next/server";
import { TipoRelatorio } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { exigirAcessoObra } from "@/lib/acesso-obra";
import { prisma } from "@/lib/prisma";
import { exportarItensExcel, gerarModeloExcel } from "@/lib/relatorio-excel";
import { temPermissao } from "@/lib/permissions";
import type { ItemMedicaoInput } from "@/lib/relatorio-medicao";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "gerenciar_relatorios_medicao")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const relatorioId = searchParams.get("relatorioId");
  const modelo = searchParams.get("modelo");

  if (modelo === "1") {
    const buffer = gerarModeloExcel();
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="modelo-medicao.xlsx"',
      },
    });
  }

  if (!relatorioId) {
    return NextResponse.json({ error: "relatorioId ou modelo=1 é obrigatório" }, { status: 400 });
  }

  const relatorio = await prisma.relatorio.findFirst({
    where: { id: relatorioId, tipo: TipoRelatorio.MEDICAO },
    include: { itens: { orderBy: { ordem: "asc" } } },
  });

  if (!relatorio) {
    return NextResponse.json({ error: "Relatório não encontrado" }, { status: 404 });
  }

  const acesso = await exigirAcessoObra(session.id, session.perfil, relatorio.obraId);
  if (!acesso.ok) {
    return NextResponse.json({ error: acesso.error }, { status: acesso.status });
  }

  const itens: ItemMedicaoInput[] = relatorio.itens.map((item) => ({
    item: item.item,
    descricao: item.descricao,
    valorTotal: Number(item.valorTotal),
    valorPrevisto: Number(item.valorPrevisto),
    valorRealizado: Number(item.valorRealizado),
    mostrarNoRelatorio: item.mostrarNoRelatorio,
    observacao: item.observacao,
  }));

  const buffer = exportarItensExcel(itens);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="medicao-${relatorioId.slice(0, 8)}.xlsx"`,
    },
  });
}
