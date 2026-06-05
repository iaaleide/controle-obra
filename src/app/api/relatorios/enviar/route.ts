import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { temPermissao } from "@/lib/permissions";
import { gerarRelatorioSemanal, gerarRelatorioPeriodo } from "@/lib/relatorio";
import { textoRelatorioWhatsApp } from "@/lib/pdf";
import { enviarRelatorioEmail } from "@/lib/email";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "enviar_relatorio")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { obraId, tipo, destinatario, dataInicio, dataFim } = await request.json();

  if (!obraId || !tipo) {
    return NextResponse.json({ error: "obraId e tipo são obrigatórios" }, { status: 400 });
  }

  const relatorio =
    dataInicio && dataFim
      ? await gerarRelatorioPeriodo(
          obraId,
          new Date(dataInicio + "T00:00:00"),
          new Date(dataFim + "T23:59:59")
        )
      : await gerarRelatorioSemanal(obraId);

  if (!relatorio) {
    return NextResponse.json({ error: "Obra não encontrada" }, { status: 404 });
  }

  if (tipo === "email") {
    if (!destinatario) {
      return NextResponse.json({ error: "E-mail destinatário obrigatório" }, { status: 400 });
    }

    const corpo = textoRelatorioWhatsApp(relatorio);
    const resultado = await enviarRelatorioEmail(
      destinatario,
      `Relatório de Presença — ${relatorio.obra}`,
      corpo
    );

    return NextResponse.json(resultado, { status: resultado.ok ? 200 : 500 });
  }

  if (tipo === "whatsapp") {
    const texto = textoRelatorioWhatsApp(relatorio);
    const numero = destinatario?.replace(/\D/g, "") || "";
    const url = numero
      ? `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`
      : `https://wa.me/?text=${encodeURIComponent(texto)}`;

    return NextResponse.json({ ok: true, url, message: "Link WhatsApp gerado" });
  }

  return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
}
