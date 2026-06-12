import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { temPermissao } from "@/lib/permissions";
import { importarItensExcel } from "@/lib/relatorio-excel";
import { importarItensPdf } from "@/lib/relatorio-pdf-import";

function ehPdf(nome: string, tipo: string): boolean {
  return (
    tipo === "application/pdf" ||
    nome.toLowerCase().endsWith(".pdf")
  );
}

function ehExcel(nome: string, tipo: string): boolean {
  return (
    tipo.includes("spreadsheet") ||
    tipo.includes("excel") ||
    nome.toLowerCase().endsWith(".xlsx") ||
    nome.toLowerCase().endsWith(".xls")
  );
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "gerenciar_relatorios_medicao")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const formData = await request.formData();
  const arquivo = formData.get("arquivo");

  if (!arquivo || !(arquivo instanceof File)) {
    return NextResponse.json({ error: "Arquivo é obrigatório (Excel ou PDF)" }, { status: 400 });
  }

  const buffer = Buffer.from(await arquivo.arrayBuffer());
  const nome = arquivo.name || "";
  const tipo = arquivo.type || "";

  try {
    let itens;
    if (ehPdf(nome, tipo)) {
      itens = await importarItensPdf(buffer);
    } else if (ehExcel(nome, tipo)) {
      itens = importarItensExcel(buffer);
    } else {
      return NextResponse.json(
        { error: "Formato não suportado. Use Excel (.xlsx) ou PDF (.pdf)" },
        { status: 400 }
      );
    }

    if (itens.length === 0) {
      return NextResponse.json(
        {
          error:
            "Nenhum serviço encontrado. Verifique se o PDF contém a tabela com Item, Descrição, Valor Total, Previsto e Realizado.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ itens, origem: ehPdf(nome, tipo) ? "pdf" : "excel" });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível ler o arquivo. Tente exportar novamente ou use o modelo Excel." },
      { status: 422 }
    );
  }
}
