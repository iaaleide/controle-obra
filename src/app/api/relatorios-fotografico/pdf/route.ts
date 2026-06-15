import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { exigirAcessoObra } from "@/lib/acesso-obra";
import { gerarPdfRelatorioFotografico } from "@/lib/fotografico-pdf";
import { montarRelatorioFotograficoParaPdf } from "@/lib/fotografico-montar";
import { temPermissao } from "@/lib/permissions";
import { respostaPdfNext } from "@/lib/resposta-pdf";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "gerenciar_relatorios_fotografico")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await request.json();
  const { obraId, periodoInicio, periodoFim, clienteNome, observacoesGerais, fotos, emitidoEm } = body;

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

  const listaFotos = Array.isArray(fotos) ? fotos : [];
  const relatorio = montarRelatorioFotograficoParaPdf(acesso.obra, {
    obraId,
    periodoInicio,
    periodoFim,
    clienteNome,
    observacoesGerais,
    fotos: listaFotos,
  });

  const pdf = gerarPdfRelatorioFotografico(relatorio, { emitidoEm });
  return respostaPdfNext(pdf, "fotografico", acesso.obra.nome);
}
