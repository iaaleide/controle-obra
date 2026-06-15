import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { temPermissao } from "@/lib/permissions";
import {
  gerarRelatorioCustoSemanal,
  gerarRelatorioCustoPeriodo,
} from "@/lib/custo-relatorio";
import { gerarPdfRelatorioCusto } from "@/lib/custo-pdf";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "gerenciar_custos")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const obraId = searchParams.get("obraId");
  const dataInicio = searchParams.get("dataInicio");
  const dataFim = searchParams.get("dataFim");
  const emitidoEm = searchParams.get("emitidoEm");

  if (!obraId) {
    return NextResponse.json({ error: "obraId é obrigatório" }, { status: 400 });
  }

  const relatorio =
    dataInicio && dataFim
      ? await gerarRelatorioCustoPeriodo(
          obraId,
          new Date(dataInicio + "T00:00:00"),
          new Date(dataFim + "T23:59:59")
        )
      : await gerarRelatorioCustoSemanal(obraId);

  if (!relatorio) {
    return NextResponse.json({ error: "Obra não encontrada" }, { status: 404 });
  }

  relatorio.emitidoEm = emitidoEm;

  const pdf = gerarPdfRelatorioCusto(relatorio);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="custos-${relatorio.obra.replace(/\s+/g, "-")}.pdf"`,
    },
  });
}
