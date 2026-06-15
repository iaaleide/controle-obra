import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  aplicarRodapeTodasPaginas,
  desenharCabecalhoRelatorio,
  linhaCabecalhoEmitido,
  MARGEM_RODAPE_PDF,
} from "@/lib/pdf-cabecalho";
import type { RelatorioFerramentas } from "@/lib/ferramenta-relatorio";

export function gerarPdfRelatorioFerramentas(dados: RelatorioFerramentas): Buffer {
  const doc = new jsPDF();

  const y = desenharCabecalhoRelatorio(doc, "Relatório de Ferramentas", [
    { label: "Obra", valor: dados.obra },
    { label: "Período", valor: dados.periodo },
    { label: "Empréstimos no período", valor: String(dados.linhas.length) },
    linhaCabecalhoEmitido(dados.emitidoEm),
  ]);

  const body =
    dados.linhas.length > 0
      ? dados.linhas.map((l) => [
          l.ferramenta,
          l.descricao || "-",
          l.dataDeixada,
          l.dataDevolvida || "-",
          l.status,
        ])
      : [["Nenhum empréstimo no período", "-", "-", "-", "-"]];

  autoTable(doc, {
    startY: y,
    head: [["Ferramenta", "Descrição", "Deixada em", "Devolvida em", "Status"]],
    body,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    margin: { left: 14, right: 14, bottom: MARGEM_RODAPE_PDF + 6 },
  });

  aplicarRodapeTodasPaginas(doc);

  return Buffer.from(doc.output("arraybuffer"));
}
