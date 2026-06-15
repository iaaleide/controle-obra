import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { temPermissao } from "@/lib/permissions";
import {
  gerarRelatorioSemanal,
  gerarRelatorioPeriodo,
  resolverIncluirSemPresenca,
} from "@/lib/relatorio";
import { textoRelatorioWhatsApp } from "@/lib/pdf";
import { enviarRelatorioPorCanal } from "@/lib/relatorio-enviar";
import { exigirAcessoObra } from "@/lib/acesso-obra";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "enviar_relatorio")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { obraId, tipo, destinatario, dataInicio, dataFim, incluirSemPresenca } =
    await request.json();
  const opcoesRelatorio = {
    incluirSemPresenca: resolverIncluirSemPresenca(session.perfil, incluirSemPresenca),
  };

  if (!obraId || !tipo) {
    return NextResponse.json({ error: "obraId e tipo são obrigatórios" }, { status: 400 });
  }

  const acesso = await exigirAcessoObra(session.id, session.perfil, obraId);
  if (!acesso.ok) {
    return NextResponse.json({ error: acesso.error }, { status: acesso.status });
  }

  const relatorio =
    dataInicio && dataFim
      ? await gerarRelatorioPeriodo(
          obraId,
          new Date(dataInicio + "T00:00:00"),
          new Date(dataFim + "T23:59:59"),
          { ...opcoesRelatorio, obra: acesso.obra }
        )
      : await gerarRelatorioSemanal(obraId, undefined, {
          ...opcoesRelatorio,
          obra: acesso.obra,
        });

  if (!relatorio) {
    return NextResponse.json({ error: "Obra não encontrada" }, { status: 404 });
  }

  const resultado = await enviarRelatorioPorCanal({
    tipo,
    destinatario,
    assuntoEmail: `Relatório de Presença — ${relatorio.obra}`,
    texto: textoRelatorioWhatsApp(relatorio),
  });

  return NextResponse.json(resultado.body, { status: resultado.status });
}
