import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { exigirAcessoObra } from "@/lib/acesso-obra";
import {
  calcularItemMedicao,
  formatarPeriodo,
  itemRelatorioParaCalculado,
  textoMedicaoWhatsApp,
  type ItemMedicaoInput,
} from "@/lib/relatorio-medicao";
import { enviarRelatorioPorCanal } from "@/lib/relatorio-enviar";
import { buscarRelatorioMedicao } from "@/lib/relatorio-db";
import { temPermissao } from "@/lib/permissions";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "enviar_relatorio")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await request.json();
  const {
    relatorioId,
    obraId,
    tipo,
    destinatario,
    periodoInicio,
    periodoFim,
    clienteNome,
    acumuladoTotal,
    itens,
  } = body;

  if (!tipo) {
    return NextResponse.json({ error: "tipo é obrigatório" }, { status: 400 });
  }

  if (relatorioId) {
    const relatorio = await buscarRelatorioMedicao(relatorioId);
    if (!relatorio) {
      return NextResponse.json({ error: "Relatório não encontrado" }, { status: 404 });
    }

    const acesso = await exigirAcessoObra(session.id, session.perfil, relatorio.obraId);
    if (!acesso.ok) {
      return NextResponse.json({ error: acesso.error }, { status: acesso.status });
    }

    const itensCalculados = relatorio.itens.map(itemRelatorioParaCalculado);
    const texto = textoMedicaoWhatsApp({
      obra: relatorio.obra.nome,
      periodo: formatarPeriodo(relatorio.periodoInicio, relatorio.periodoFim),
      cliente: relatorio.clienteNome || relatorio.obra.clienteNome,
      itens: itensCalculados,
      acumuladoTotal: relatorio.acumuladoTotal != null ? Number(relatorio.acumuladoTotal) : null,
    });

    const resultado = await enviarRelatorioPorCanal({
      tipo,
      destinatario,
      assuntoEmail: `Relatório de Medição — ${relatorio.obra.nome}`,
      texto,
    });

    return NextResponse.json(resultado.body, { status: resultado.status });
  }

  if (!obraId) {
    return NextResponse.json({ error: "obraId ou relatorioId é obrigatório" }, { status: 400 });
  }

  const acesso = await exigirAcessoObra(session.id, session.perfil, obraId);
  if (!acesso.ok) {
    return NextResponse.json({ error: acesso.error }, { status: acesso.status });
  }

  const listaItens: ItemMedicaoInput[] = Array.isArray(itens) ? itens : [];
  const itensCalculados = listaItens.map(calcularItemMedicao);

  const inicio = periodoInicio ? new Date(periodoInicio + "T12:00:00") : new Date();
  const fim = periodoFim ? new Date(periodoFim + "T12:00:00") : inicio;

  const texto = textoMedicaoWhatsApp({
    obra: acesso.obra.nome,
    periodo: formatarPeriodo(inicio, fim),
    cliente: clienteNome || acesso.obra.clienteNome,
    itens: itensCalculados,
    acumuladoTotal: acumuladoTotal ?? null,
  });

  const resultado = await enviarRelatorioPorCanal({
    tipo,
    destinatario,
    assuntoEmail: `Relatório de Medição — ${acesso.obra.nome}`,
    texto,
  });

  return NextResponse.json(resultado.body, { status: resultado.status });
}
