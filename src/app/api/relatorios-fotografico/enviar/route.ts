import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { exigirAcessoObra } from "@/lib/acesso-obra";
import { textoFotograficoWhatsApp } from "@/lib/fotografico-texto";
import { montarRelatorioFotograficoParaPdf } from "@/lib/fotografico-montar";
import { enviarRelatorioPorCanal } from "@/lib/relatorio-enviar";
import { buscarRelatorioFotografico } from "@/lib/relatorio-db";
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
    observacoesGerais,
    fotos,
  } = body;

  if (!tipo) {
    return NextResponse.json({ error: "tipo é obrigatório" }, { status: 400 });
  }

  if (relatorioId) {
    const relatorio = await buscarRelatorioFotografico(relatorioId);
    if (!relatorio) {
      return NextResponse.json({ error: "Relatório não encontrado" }, { status: 404 });
    }

    const acesso = await exigirAcessoObra(session.id, session.perfil, relatorio.obraId);
    if (!acesso.ok) {
      return NextResponse.json({ error: acesso.error }, { status: acesso.status });
    }

    const texto = textoFotograficoWhatsApp(relatorio);
    const resultado = await enviarRelatorioPorCanal({
      tipo,
      destinatario,
      assuntoEmail: `Relatório Fotográfico — ${relatorio.obra.nome}`,
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

  const relatorio = montarRelatorioFotograficoParaPdf(acesso.obra, {
    obraId,
    periodoInicio,
    periodoFim,
    clienteNome,
    observacoesGerais,
    fotos: Array.isArray(fotos) ? fotos : [],
  });

  const texto = textoFotograficoWhatsApp(relatorio);
  const resultado = await enviarRelatorioPorCanal({
    tipo,
    destinatario,
    assuntoEmail: `Relatório Fotográfico — ${acesso.obra.nome}`,
    texto,
  });

  return NextResponse.json(resultado.body, { status: resultado.status });
}
