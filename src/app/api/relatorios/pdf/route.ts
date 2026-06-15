import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { exigirAcessoObra } from "@/lib/acesso-obra";
import { temPermissao } from "@/lib/permissions";
import {
  gerarRelatorioSemanal,
  gerarRelatorioPeriodo,
  resolverIncluirSemPresenca,
} from "@/lib/relatorio";
import { gerarPdfRelatorio } from "@/lib/pdf-gerar";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "exportar_pdf")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const obraId = searchParams.get("obraId");
  const dataInicio = searchParams.get("dataInicio");
  const dataFim = searchParams.get("dataFim");
  const incluirSemPresenca = resolverIncluirSemPresenca(
    session.perfil,
    searchParams.get("incluirSemPresenca")
  );

  if (!obraId) {
    return NextResponse.json({ error: "obraId é obrigatório" }, { status: 400 });
  }

  const acesso = await exigirAcessoObra(session.id, session.perfil, obraId);
  if (!acesso.ok) {
    return NextResponse.json({ error: acesso.error }, { status: acesso.status });
  }

  const emitidoEm = searchParams.get("emitidoEm");

  const opcoes = { incluirSemPresenca, obra: acesso.obra };

  const relatorio =
    dataInicio && dataFim
      ? await gerarRelatorioPeriodo(
          obraId,
          new Date(dataInicio + "T00:00:00"),
          new Date(dataFim + "T23:59:59"),
          opcoes
        )
      : await gerarRelatorioSemanal(obraId, undefined, opcoes);

  if (!relatorio) {
    return NextResponse.json({ error: "Obra não encontrada" }, { status: 404 });
  }

  relatorio.emitidoEm = emitidoEm;

  let pdf: Buffer;
  try {
    pdf = gerarPdfRelatorio(relatorio);
  } catch (err) {
    console.error("Erro ao gerar PDF:", err);
    return NextResponse.json({ error: "Erro ao gerar PDF" }, { status: 500 });
  }

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="relatorio-${relatorio.obra.replace(/\s+/g, "-")}.pdf"`,
    },
  });
}
