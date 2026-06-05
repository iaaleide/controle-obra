import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  linhasRelatorioVisiveis,
  RODAPE_RELATORIO,
  type RelatorioSemanal,
} from "@/lib/pdf";

function desenharRodapePdf(doc: jsPDF) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text(
    `Gerado em ${new Date().toLocaleString("pt-BR")}`,
    pageWidth / 2,
    pageHeight - 18,
    { align: "center" }
  );

  doc.setFontSize(9);
  doc.setTextColor(30, 58, 95);
  doc.text(RODAPE_RELATORIO, pageWidth / 2, pageHeight - 10, { align: "center" });
}

export function gerarPdfRelatorio(dados: RelatorioSemanal): Buffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(30, 58, 95);
  doc.text("Relatorio de Presenca - Obra", pageWidth / 2, 20, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(71, 85, 105);
  doc.text(`Obra: ${dados.obra}`, 14, 32);
  doc.text(`Periodo: ${dados.periodo}`, 14, 40);
  doc.text(`Total de presencas: ${dados.totalPresencas}`, 14, 48);

  const linhasVisiveis = linhasRelatorioVisiveis(dados);
  const linhasTabela =
    linhasVisiveis.length > 0
      ? linhasVisiveis.map((l) => [
          l.funcionario,
          l.cargo || "-",
          String(l.diasTrabalhados),
          l.datas.join(", ") || "-",
        ])
      : [["Nenhum funcionario com presenca no periodo", "-", "0", "-"]];

  autoTable(doc, {
    startY: 56,
    head: [["Funcionario", "Cargo", "Dias", "Datas"]],
    body: linhasTabela,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14, bottom: 32 },
    showFoot: "never",
  });

  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);
    desenharRodapePdf(doc);
  }

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
