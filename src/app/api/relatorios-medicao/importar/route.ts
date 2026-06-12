import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { temPermissao } from "@/lib/permissions";
import { importarItensExcel } from "@/lib/relatorio-excel";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "gerenciar_relatorios_medicao")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const formData = await request.formData();
  const arquivo = formData.get("arquivo");

  if (!arquivo || !(arquivo instanceof File)) {
    return NextResponse.json({ error: "Arquivo Excel é obrigatório" }, { status: 400 });
  }

  const buffer = Buffer.from(await arquivo.arrayBuffer());
  const itens = importarItensExcel(buffer);

  if (itens.length === 0) {
    return NextResponse.json({ error: "Nenhum item válido encontrado no arquivo" }, { status: 400 });
  }

  return NextResponse.json({ itens });
}
