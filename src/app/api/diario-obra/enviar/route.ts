import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { exigirAcessoObra } from "@/lib/acesso-obra";
import { textoDiarioWhatsApp, textoDiarioWhatsAppFromDb } from "@/lib/diario-texto";
import { enviarRelatorioPorCanal } from "@/lib/relatorio-enviar";
import { prisma } from "@/lib/prisma";
import { temPermissao } from "@/lib/permissions";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "enviar_relatorio")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await request.json();
  const { diarioId, obraId, tipo, destinatario, data, clienteNome, clima, observacoes, fotos } =
    body;

  if (!tipo) {
    return NextResponse.json({ error: "tipo é obrigatório" }, { status: 400 });
  }

  if (diarioId) {
    const diario = await prisma.diarioObra.findUnique({
      where: { id: diarioId },
      include: { fotos: { orderBy: [{ pagina: "asc" }, { ordem: "asc" }] }, obra: true },
    });

    if (!diario) {
      return NextResponse.json({ error: "Diário não encontrado" }, { status: 404 });
    }

    const acesso = await exigirAcessoObra(session.id, session.perfil, diario.obraId);
    if (!acesso.ok) {
      return NextResponse.json({ error: acesso.error }, { status: acesso.status });
    }

    const texto = textoDiarioWhatsAppFromDb(diario);

    const resultado = await enviarRelatorioPorCanal({
      tipo,
      destinatario,
      assuntoEmail: `Diário de Obra — ${diario.obra.nome}`,
      texto,
    });

    return NextResponse.json(resultado.body, { status: resultado.status });
  }

  if (!obraId || !data) {
    return NextResponse.json({ error: "obraId e data são obrigatórios" }, { status: 400 });
  }

  const acesso = await exigirAcessoObra(session.id, session.perfil, obraId);
  if (!acesso.ok) {
    return NextResponse.json({ error: acesso.error }, { status: acesso.status });
  }

  const texto = textoDiarioWhatsApp({
    obra: acesso.obra,
    data,
    clienteNome,
    clima,
    observacoes,
    fotos: Array.isArray(fotos) ? fotos : [],
  });

  const resultado = await enviarRelatorioPorCanal({
    tipo,
    destinatario,
    assuntoEmail: `Diário de Obra — ${acesso.obra.nome}`,
    texto,
  });

  return NextResponse.json(resultado.body, { status: resultado.status });
}
