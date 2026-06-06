import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { RODAPE_RELATORIO } from "@/lib/pdf";
import type { RelatorioCustoSemanal } from "@/lib/custo-relatorio";

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function gerarPdfRelatorioCusto(dados: RelatorioCustoSemanal): Buffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(30, 58, 95);
  doc.text("Relatorio de Custos - Semanal", pageWidth / 2, 20, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(71, 85, 105);
  doc.text(`Obra: ${dados.obra}`, 14, 32);
  doc.text(`Periodo: ${dados.periodo}`, 14, 40);
  doc.text(`Total geral: ${formatarMoeda(dados.totalGeral)}`, 14, 48);

  const body =
    dados.linhas.length > 0
      ? dados.linhas.map((l) => [
          l.funcionario,
          l.cargo || "-",
          String(l.diasTrabalhados),
          formatarMoeda(l.valorDiario),
          formatarMoeda(l.valorTotal),
        ])
      : [["Nenhum custo no periodo", "-", "0", "-", "-"]];

  autoTable(doc, {
    startY: 56,
    head: [["Funcionario", "Cargo", "Dias", "Valor/dia", "Total"]],
    body,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    margin: { bottom: 28 },
  });

  const pageHeight = doc.internal.pageSize.getHeight();
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

  return Buffer.from(doc.output("arraybuffer"));
}
