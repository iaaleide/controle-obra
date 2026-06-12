import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { ModoGraficoMedicao } from "@prisma/client";
import {
  aplicarRodapeTodasPaginas,
  desenharCabecalhoRelatorio,
} from "@/lib/pdf-cabecalho";
import {
  calcularTotaisItens,
  formatarMoeda,
  formatarPeriodo,
  type RelatorioMedicaoCompleto,
} from "@/lib/relatorio-medicao";

type DadoGrafico = {
  label: string;
  previsto: number;
  realizado: number;
};

function desenharGraficoBarras(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  dados: DadoGrafico,
  compacto = false
) {
  const maxValor = Math.max(dados.previsto, dados.realizado, 1);
  const barWidth = compacto ? (width - 20) / 2 : (width - 30) / 2;
  const baseY = y + height - 8;

  doc.setFontSize(compacto ? 7 : 9);
  doc.setTextColor(71, 85, 105);
  doc.text(dados.label.slice(0, compacto ? 18 : 40), x, y + 6);

  const previstoH = ((height - 20) * dados.previsto) / maxValor;
  const realizadoH = ((height - 20) * dados.realizado) / maxValor;

  doc.setFillColor(59, 130, 246);
  doc.rect(x, baseY - previstoH, barWidth, previstoH, "F");
  doc.setFillColor(34, 197, 94);
  doc.rect(x + barWidth + (compacto ? 6 : 10), baseY - realizadoH, barWidth, realizadoH, "F");

  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text("Prev.", x + barWidth / 2, baseY + 4, { align: "center" });
  doc.text("Real.", x + barWidth + (compacto ? 6 : 10) + barWidth / 2, baseY + 4, {
    align: "center",
  });
}

function desenharGraficoConsolidado(doc: jsPDF, startY: number, itens: DadoGrafico[]) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = startY;

  if (y > pageHeight - 80) {
    doc.addPage();
    y = 20;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(30, 58, 95);
  doc.text("Gráfico consolidado — Previsto x Realizado", 14, y);
  y += 10;

  const chartWidth = pageWidth - 28;
  const barAreaHeight = 50;
  const maxValor = Math.max(...itens.map((i) => Math.max(i.previsto, i.realizado)), 1);
  const slotWidth = chartWidth / Math.max(itens.length, 1);

  itens.forEach((item, index) => {
    const slotX = 14 + index * slotWidth;
    const previstoH = (barAreaHeight * item.previsto) / maxValor;
    const realizadoH = (barAreaHeight * item.realizado) / maxValor;
    const baseY = y + barAreaHeight + 10;
    const bw = Math.min(12, slotWidth / 3);

    doc.setFillColor(59, 130, 246);
    doc.rect(slotX + 2, baseY - previstoH, bw, previstoH, "F");
    doc.setFillColor(34, 197, 94);
    doc.rect(slotX + bw + 4, baseY - realizadoH, bw, realizadoH, "F");

    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text(item.label.slice(0, 8), slotX + slotWidth / 2, baseY + 8, { align: "center" });
  });

  doc.setFontSize(8);
  doc.setTextColor(59, 130, 246);
  doc.text("■ Previsto", 14, y + barAreaHeight + 28);
  doc.setTextColor(34, 197, 94);
  doc.text("■ Realizado", 50, y + barAreaHeight + 28);

  return y + barAreaHeight + 36;
}

export function gerarPdfRelatorioMedicao(relatorio: RelatorioMedicaoCompleto): Buffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const itensVisiveis = relatorio.itens.filter((i) => i.mostrarNoRelatorio);
  const totais = calcularTotaisItens(itensVisiveis);
  const periodo = formatarPeriodo(relatorio.periodoInicio, relatorio.periodoFim);

  let y = desenharCabecalhoRelatorio(doc, "Relatório de Medição", [
    { label: "Obra", valor: relatorio.obra.nome },
    { label: "Cliente", valor: relatorio.clienteNome || relatorio.obra.clienteNome || "—" },
    { label: "Período", valor: periodo },
  ]);

  if (relatorio.modoGrafico === "POR_SERVICO") {
    for (const item of itensVisiveis) {
      if (y > pageHeight - 70) {
        doc.addPage();
        y = 20;
      }

      const body = [
        [
          item.item || "—",
          item.descricao,
          formatarMoeda(Number(item.valorTotal)),
          formatarMoeda(Number(item.valorPrevisto)),
          formatarMoeda(Number(item.valorRealizado)),
          `${Number(item.percentualExecutado).toFixed(1)}%`,
          item.observacao || "—",
        ],
      ];

      autoTable(doc, {
        startY: y,
        head: [["Item", "Descrição", "V. Total", "Previsto", "Realizado", "% Exec.", "Obs."]],
        body,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [37, 99, 235], textColor: 255 },
        margin: { left: 14, right: 14, bottom: 32 },
      });

      y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;

      desenharGraficoBarras(
        doc,
        14,
        y,
        pageWidth - 28,
        36,
        {
          label: item.descricao,
          previsto: Number(item.valorPrevisto),
          realizado: Number(item.valorRealizado),
        },
        true
      );

      y += 44;
    }
  } else {
    const body =
      itensVisiveis.length > 0
        ? itensVisiveis.map((item) => [
            item.item || "—",
            item.descricao,
            formatarMoeda(Number(item.valorTotal)),
            formatarMoeda(Number(item.valorPrevisto)),
            formatarMoeda(Number(item.valorRealizado)),
            `${Number(item.percentualExecutado).toFixed(1)}%`,
            item.observacao || "—",
          ])
        : [["—", "Nenhum item", "—", "—", "—", "—", "—"]];

    autoTable(doc, {
      startY: y,
      head: [["Item", "Descrição", "V. Total", "Previsto", "Realizado", "% Exec.", "Obs."]],
      body,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14, bottom: 32 },
    });

    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

    if (itensVisiveis.length > 0) {
      y = desenharGraficoConsolidado(
        doc,
        y,
        itensVisiveis.map((item) => ({
          label: item.item || item.descricao,
          previsto: Number(item.valorPrevisto),
          realizado: Number(item.valorRealizado),
        }))
      );
    }
  }

  if (y > pageHeight - 50) {
    doc.addPage();
    y = 20;
  }

  autoTable(doc, {
    startY: y,
    body: [
      ["Total Valor Total", formatarMoeda(totais.valorTotal)],
      ["Total Previsto", formatarMoeda(totais.valorPrevisto)],
      ["Total Realizado", formatarMoeda(totais.valorRealizado)],
      [
        "Acumulado medido até o período",
        relatorio.acumuladoTotal != null
          ? formatarMoeda(Number(relatorio.acumuladoTotal))
          : "—",
      ],
    ],
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: "bold" } },
    margin: { left: 14, right: 14, bottom: 32 },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

  if (relatorio.observacoesGerais) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 58, 95);
    doc.text("Observações gerais", 14, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(relatorio.observacoesGerais, 14, y + 6, { maxWidth: pageWidth - 28 });
  }

  aplicarRodapeTodasPaginas(doc);
  return Buffer.from(doc.output("arraybuffer"));
}

export type { ModoGraficoMedicao };
