import { NextResponse } from "next/server";
import { TipoRelatorio } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { exigirAcessoObra } from "@/lib/acesso-obra";
import { prisma } from "@/lib/prisma";
import { gerarPdfRelatorioFotografico } from "@/lib/fotografico-pdf";
import { temPermissao } from "@/lib/permissions";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "gerenciar_relatorios_fotografico")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { id } = await params;
  const relatorio = await prisma.relatorio.findFirst({
    where: { id, tipo: TipoRelatorio.FOTOGRAFICO },
    include: { fotos: { orderBy: { ordem: "asc" } }, obra: true },
  });

  if (!relatorio) {
    return NextResponse.json({ error: "Relatório não encontrado" }, { status: 404 });
  }

  const acesso = await exigirAcessoObra(session.id, session.perfil, relatorio.obraId);
  if (!acesso.ok) {
    return NextResponse.json({ error: acesso.error }, { status: acesso.status });
  }

  const pdf = gerarPdfRelatorioFotografico(relatorio);
  const nome = relatorio.obra.nome.replace(/\s+/g, "-");

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="fotografico-${nome}.pdf"`,
    },
  });
}
