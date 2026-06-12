import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { exigirAcessoObra } from "@/lib/acesso-obra";
import { prisma } from "@/lib/prisma";
import { gerarPdfRelatorioMedicao } from "@/lib/medicao-pdf";
import { montarRelatorioMedicaoParaPdf } from "@/lib/medicao-montar";
import { temPermissao } from "@/lib/permissions";
import type { ItemMedicaoInput } from "@/lib/relatorio-medicao";

function respostaPdf(pdf: Buffer, nomeObra: string) {
  const nome = nomeObra.replace(/\s+/g, "-").replace(/[^\w-]/g, "");
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="medicao-${nome || "obra"}.pdf"`,
    },
  });
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

  const obra = await prisma.obra.findUnique({ where: { id: obraId } });
  if (!obra) {
    return NextResponse.json({ error: "Obra não encontrada" }, { status: 404 });
  }

  const listaItens: ItemMedicaoInput[] = Array.isArray(itens) ? itens : [];
  if (listaItens.length === 0) {
    return NextResponse.json({ error: "Adicione ao menos um serviço ao relatório" }, { status: 400 });
  }

  const relatorio = montarRelatorioMedicaoParaPdf(obra, {
    obraId,
    periodoInicio,
    periodoFim,
    acumuladoTotal,
    observacoesGerais,
    modoGrafico,
    opcoesPdfMedicao,
    clienteNome,
    itens: listaItens,
  });

  const pdf = gerarPdfRelatorioMedicao(relatorio);
  return respostaPdf(pdf, obra.nome);
}
