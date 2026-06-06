import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { temPermissao } from "@/lib/permissions";
import { gerarRelatorioCustoSemanal } from "@/lib/custo-relatorio";
import { gerarPdfRelatorioCusto } from "@/lib/custo-pdf";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "gerenciar_custos")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const obraId = new URL(request.url).searchParams.get("obraId");
  if (!obraId) {
    return NextResponse.json({ error: "obraId é obrigatório" }, { status: 400 });
  }

  const relatorio = await gerarRelatorioCustoSemanal(obraId);
  if (!relatorio) {
    return NextResponse.json({ error: "Obra não encontrada" }, { status: 404 });
  }

  const pdf = gerarPdfRelatorioCusto(relatorio);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="custos-${obraId}.pdf"`,
    },
  });
}
