import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { exigirAcessoObra } from "@/lib/acesso-obra";
import { gerarPdfRelatorioMedicao } from "@/lib/medicao-pdf";
import { temPermissao } from "@/lib/permissions";
import { buscarRelatorioMedicao } from "@/lib/relatorio-db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "gerenciar_relatorios_medicao")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { id } = await params;
  const emitidoEm = new URL(_request.url).searchParams.get("emitidoEm");
  const relatorio = await buscarRelatorioMedicao(id);

  if (!relatorio) {
    return NextResponse.json({ error: "Relatório não encontrado" }, { status: 404 });
  }

  const acesso = await exigirAcessoObra(session.id, session.perfil, relatorio.obraId);
  if (!acesso.ok) {
    return NextResponse.json({ error: acesso.error }, { status: acesso.status });
  }

  const pdf = gerarPdfRelatorioMedicao(relatorio, { emitidoEm });
  const nome = relatorio.obra.nome.replace(/\s+/g, "-");

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="medicao-${nome}.pdf"`,
    },
  });
}
