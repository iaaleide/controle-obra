import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  aplicarRodapeTodasPaginas,
  desenharCabecalhoRelatorio,
} from "@/lib/pdf-cabecalho";
import {
  calcularPercentuaisResumoGeral,
  calcularTotaisItens,
  calcularValorMedicao,
  formatarMoeda,
  formatarPercentual,
  formatarPeriodo,
  type RelatorioMedicaoCompleto,
} from "@/lib/relatorio-medicao";

type DadoGrafico = {
  label: string;
  previsto: number;
  realizado: number;
};

function desenharGraficoBarrasHorizontal(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  dados: DadoGrafico
) {
  const maxValor = 100;
  const labelW = 52;
  const chartW = width - labelW - 4;
  const barH = 7;
  const gap = 3;
  const height = barH * 2 + gap + 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(dados.label.slice(0, 28), x, y + 5);

  const baseX = x + labelW;
  const yPrev = y + 10;
  const yReal = yPrev + barH + gap;

  const prevW = (chartW * dados.previsto) / maxValor;
  const realW = (chartW * dados.realizado) / maxValor;

  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text("% Prev.", x, yPrev + 5);
  doc.text("% Real.", x, yReal + 5);

  doc.setDrawColor(226, 232, 240);
  doc.rect(baseX, yPrev, chartW, barH, "S");
  doc.rect(baseX, yReal, chartW, barH, "S");

  doc.setFillColor(59, 130, 246);
  doc.rect(baseX, yPrev, prevW, barH, "F");
  doc.setFillColor(34, 197, 94);
  doc.rect(baseX, yReal, realW, barH, "F");

  doc.setFontSize(6);
  doc.setTextColor(71, 85, 105);
  doc.text(formatarPercentual(dados.previsto), baseX + chartW + 2, yPrev + 5);
  doc.text(formatarPercentual(dados.realizado), baseX + chartW + 2, yReal + 5);

  return height;
}

function desenharGraficoResumoTotal(
  doc: jsPDF,
  startY: number,
  previsto: number,
  realizado: number
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = startY;

  if (y > pageHeight - 55) {
    doc.addPage();
    y = 20;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(30, 58, 95);
  doc.text("Resumo geral — % Previsto x % Realizado", 14, y);
  y += 8;

  const h = desenharGraficoBarrasHorizontal(doc, 14, y, pageWidth - 28, {
    label: "Totais da medição",
    previsto,
    realizado,
  });

  doc.setFontSize(8);
  doc.setTextColor(59, 130, 246);
  doc.text("■ Previsto", 14, y + h + 2);
  doc.setTextColor(34, 197, 94);
  doc.text("■ Realizado", 50, y + h + 2);

  return y + h + 12;
}

export function gerarPdfRelatorioMedicao(relatorio: RelatorioMedicaoCompleto): Buffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const itensVisiveis = relatorio.itens.filter((i) => i.mostrarNoRelatorio);
  const totais = calcularTotaisItens(itensVisiveis);
  const resumoPct = calcularPercentuaisResumoGeral(itensVisiveis);
  const periodo = formatarPeriodo(relatorio.periodoInicio, relatorio.periodoFim);
  const graficoPorServico = relatorio.modoGrafico !== "CONSOLIDADO";

  let y = desenharCabecalhoRelatorio(doc, "Relatório de Medição", [
    { label: "Obra", valor: relatorio.obra.nome },
    { label: "Cliente", valor: relatorio.clienteNome || relatorio.obra.clienteNome || "—" },
    { label: "Período", valor: periodo },
  ]);

  const body =
    itensVisiveis.length > 0
      ? itensVisiveis.map((item) => {
          const valorMedicao = calcularValorMedicao(
            Number(item.valorTotal),
            Number(item.percentualExecutado)
          );
          return [
            item.item || "—",
            item.descricao,
            formatarMoeda(Number(item.valorTotal)),
            formatarPercentual(Number(item.valorPrevisto)),
            formatarPercentual(Number(item.valorRealizado)),
            `${Number(item.percentualExecutado).toFixed(1)}%`,
            formatarMoeda(valorMedicao),
            item.observacao || "—",
          ];
        })
      : [["—", "Nenhum item", "—", "—", "—", "—", "—", "—"]];

  const totalValorMedicao = itensVisiveis.reduce(
    (s, item) =>
      s +
      calcularValorMedicao(Number(item.valorTotal), Number(item.percentualExecutado)),
    0
  );

  autoTable(doc, {
    startY: y,
    head: [
      ["Item", "Descrição", "V. Total", "% Prev.", "% Real.", "% Exec.", "V. Medição", "Obs."],
    ],
    body,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14, bottom: 32 },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  if (graficoPorServico && itensVisiveis.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 58, 95);
    doc.text("Gráficos por atividade", 14, y);
    y += 8;

    for (const item of itensVisiveis) {
      if (y > pageHeight - 45) {
        doc.addPage();
        y = 20;
      }

      const h = desenharGraficoBarrasHorizontal(doc, 14, y, pageWidth - 28, {
        label: item.item ? `${item.item} — ${item.descricao}` : item.descricao,
        previsto: Number(item.valorPrevisto),
        realizado: Number(item.valorRealizado),
      });

      y += h + 6;
    }
  }

  if (itensVisiveis.length > 0) {
    y = desenharGraficoResumoTotal(
      doc,
      y,
      resumoPct.percentualPrevisto,
      resumoPct.percentualRealizado
    );
  }

  if (y > pageHeight - 50) {
    doc.addPage();
    y = 20;
  }

  autoTable(doc, {
    startY: y,
    body: [
      ["Total Valor Total", formatarMoeda(totais.valorTotal)],
      ["Total Valor Medição", formatarMoeda(totalValorMedicao)],
      ["% Previsto (geral)", formatarPercentual(resumoPct.percentualPrevisto)],
      ["% Realizado (geral)", formatarPercentual(resumoPct.percentualRealizado)],
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
