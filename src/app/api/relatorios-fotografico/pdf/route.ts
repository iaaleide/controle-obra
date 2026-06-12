import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { exigirAcessoObra } from "@/lib/acesso-obra";
import { prisma } from "@/lib/prisma";
import { gerarPdfRelatorioFotografico } from "@/lib/fotografico-pdf";
import { montarRelatorioFotograficoParaPdf } from "@/lib/fotografico-montar";
import { temPermissao } from "@/lib/permissions";

function respostaPdf(pdf: Buffer, nomeObra: string) {
  const nome = nomeObra.replace(/\s+/g, "-").replace(/[^\w-]/g, "");
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="fotografico-${nome || "obra"}.pdf"`,
    },
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "gerenciar_relatorios_fotografico")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await request.json();
  const { obraId, periodoInicio, periodoFim, clienteNome, observacoesGerais, fotos } = body;

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

  const listaFotos = Array.isArray(fotos) ? fotos : [];
  const relatorio = montarRelatorioFotograficoParaPdf(obra, {
    obraId,
    periodoInicio,
    periodoFim,
    clienteNome,
    observacoesGerais,
    fotos: listaFotos,
  });

  const pdf = gerarPdfRelatorioFotografico(relatorio);
  return respostaPdf(pdf, obra.nome);
}
