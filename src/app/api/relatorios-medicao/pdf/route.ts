import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { exigirAcessoObra } from "@/lib/acesso-obra";
import { gerarPdfRelatorioMedicao } from "@/lib/medicao-pdf";
import { montarRelatorioMedicaoParaPdf } from "@/lib/medicao-montar";
import { temPermissao } from "@/lib/permissions";
import { respostaPdfNext } from "@/lib/resposta-pdf";
import type { ItemMedicaoInput } from "@/lib/relatorio-medicao";

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
    emitidoEm,
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
  if (listaItens.length === 0) {
    return NextResponse.json({ error: "Adicione ao menos um serviço ao relatório" }, { status: 400 });
  }

  const relatorio = montarRelatorioMedicaoParaPdf(acesso.obra, {
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

  const pdf = gerarPdfRelatorioMedicao(relatorio, { emitidoEm: body.emitidoEm });
  return respostaPdfNext(pdf, "medicao", acesso.obra.nome);
}
