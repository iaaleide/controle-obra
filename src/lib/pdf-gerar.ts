import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  aplicarRodapeTodasPaginas,
  desenharCabecalhoRelatorio,
  linhaCabecalhoEmitido,
  MARGEM_RODAPE_PDF,
} from "@/lib/pdf-cabecalho";
import { linhasRelatorioVisiveis, type RelatorioSemanal } from "@/lib/pdf";

export function gerarPdfRelatorio(dados: RelatorioSemanal): Buffer {
  const doc = new jsPDF();

  const y = desenharCabecalhoRelatorio(doc, "Relatório de Presença — Obra", [
    { label: "Obra", valor: dados.obra },
    { label: "Período", valor: dados.periodo },
    { label: "Total de presenças", valor: String(dados.totalPresencas) },
    linhaCabecalhoEmitido(dados.emitidoEm),
  ]);

  const linhasVisiveis = linhasRelatorioVisiveis(dados);
  const linhasTabela =
    linhasVisiveis.length > 0
      ? linhasVisiveis.map((l) => [
          l.funcionario,
          l.cargo || "-",
          String(l.diasTrabalhados),
          l.datas.join(", ") || "-",
        ])
      : [["Nenhum funcionário com presença no período", "-", "0", "-"]];

  autoTable(doc, {
    startY: y,
    head: [["Funcionário", "Cargo", "Dias", "Datas"]],
    body: linhasTabela,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14, bottom: MARGEM_RODAPE_PDF + 6 },
    showFoot: "never",
  });

  aplicarRodapeTodasPaginas(doc);

  return Buffer.from(doc.output("arraybuffer"));
}
