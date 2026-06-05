import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { exigirAcessoObra } from "@/lib/acesso-obra";
import { temPermissao } from "@/lib/permissions";
import {
  gerarRelatorioSemanal,
  gerarRelatorioPeriodo,
  resolverIncluirSemPresenca,
} from "@/lib/relatorio";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "ver_relatorios")) {
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

  let relatorio;

  if (dataInicio && dataFim) {
    relatorio = await gerarRelatorioPeriodo(
      obraId,
      new Date(dataInicio + "T00:00:00"),
      new Date(dataFim + "T23:59:59"),
      { incluirSemPresenca }
    );
  } else {
    relatorio = await gerarRelatorioSemanal(obraId, undefined, { incluirSemPresenca });
  }

  if (!relatorio) {
    return NextResponse.json({ error: "Obra não encontrada" }, { status: 404 });
  }

  return NextResponse.json(relatorio);
}
