import { NextResponse } from "next/server";
import { TipoRelatorio } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { exigirAcessoObra } from "@/lib/acesso-obra";
import { prisma } from "@/lib/prisma";
import { enviarRelatorioEmail } from "@/lib/email";
import { textoFotograficoWhatsApp } from "@/lib/fotografico-texto";
import { montarRelatorioFotograficoParaPdf } from "@/lib/fotografico-montar";
import { temPermissao } from "@/lib/permissions";
import { paraWhatsApp } from "@/lib/telefone";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "enviar_relatorio")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await request.json();
  const { obraId, tipo, destinatario, periodoInicio, periodoFim, clienteNome, observacoesGerais, fotos } =
    body;

  if (!obraId || !tipo) {
    return NextResponse.json({ error: "obraId e tipo são obrigatórios" }, { status: 400 });
  }

  const acesso = await exigirAcessoObra(session.id, session.perfil, obraId);
  if (!acesso.ok) {
    return NextResponse.json({ error: acesso.error }, { status: acesso.status });
  }

  const obra = await prisma.obra.findUnique({ where: { id: obraId } });
  if (!obra) {
    return NextResponse.json({ error: "Obra não encontrada" }, { status: 404 });
  }

  const relatorio = montarRelatorioFotograficoParaPdf(obra, {
    obraId,
    periodoInicio,
    periodoFim,
    clienteNome,
    observacoesGerais,
    fotos: Array.isArray(fotos) ? fotos : [],
  });

  const texto = textoFotograficoWhatsApp(relatorio);

  if (tipo === "email") {
    if (!destinatario) {
      return NextResponse.json({ error: "E-mail destinatário obrigatório" }, { status: 400 });
    }

    const resultado = await enviarRelatorioEmail(
      destinatario,
      `Relatório Fotográfico — ${obra.nome}`,
      texto
    );

    return NextResponse.json(resultado, { status: resultado.ok ? 200 : 500 });
  }

  if (tipo === "whatsapp") {
    const numero = destinatario ? paraWhatsApp(destinatario) : null;

    if (destinatario && !numero) {
      return NextResponse.json(
        {
          error:
            "Telefone inválido. Use DDD + número (ex: 11 94736-6532). O código +55 do Brasil é aplicado automaticamente.",
        },
        { status: 400 }
      );
    }

    const url = numero
      ? `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`
      : `https://wa.me/?text=${encodeURIComponent(texto)}`;

    return NextResponse.json({ ok: true, url, message: "Link WhatsApp gerado" });
  }

  return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
}
