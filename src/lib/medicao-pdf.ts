import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { ItemRelatorio } from "@prisma/client";
import {
  aplicarRodapeTodasPaginas,
  desenharCabecalhoRelatorio,
  desenharTextoComRodape,
  linhaCabecalhoEmitido,
  MARGEM_RODAPE_PDF,
} from "@/lib/pdf-cabecalho";
import {
  calcularPercentuaisResumoGeral,
  calcularTotaisItens,
  calcularValorMedicao,
  formatarMoeda,
  formatarPercentual,
  formatarPeriodo,
  normalizarOpcoesPdfMedicao,
  type OpcoesPdfMedicao,
  type RelatorioMedicaoCompleto,
} from "@/lib/relatorio-medicao";

type DadoGrafico = {
  label: string;
  previsto: number;
  realizado: number;
};

type VisibilidadeGrafico = {
  mostrarPrevisto: boolean;
  mostrarRealizado: boolean;
};

function desenharGraficoBarrasHorizontal(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  dados: DadoGrafico,
  visibilidade: VisibilidadeGrafico
) {
  const { mostrarPrevisto, mostrarRealizado } = visibilidade;
  if (!mostrarPrevisto && !mostrarRealizado) return 0;

  const maxValor = 100;
  const labelW = 52;
  const chartW = width - labelW - 4;
  const barH = 7;
  const gap = 3;
  const barras = (mostrarPrevisto ? 1 : 0) + (mostrarRealizado ? 1 : 0);
  const height = barH * barras + (barras > 1 ? gap : 0) + 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(dados.label.slice(0, 28), x, y + 5);

  const baseX = x + labelW;
  let row = 0;

  if (mostrarPrevisto) {
    const yPrev = y + 10 + row * (barH + gap);
    const prevW = (chartW * dados.previsto) / maxValor;
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text("% Prev.", x, yPrev + 5);
    doc.setDrawColor(226, 232, 240);
    doc.rect(baseX, yPrev, chartW, barH, "S");
    doc.setFillColor(59, 130, 246);
    doc.rect(baseX, yPrev, prevW, barH, "F");
    doc.setFontSize(6);
    doc.setTextColor(71, 85, 105);
    doc.text(formatarPercentual(dados.previsto), baseX + chartW + 2, yPrev + 5);
    row++;
  }

  if (mostrarRealizado) {
    const yReal = y + 10 + row * (barH + gap);
    const realW = (chartW * dados.realizado) / maxValor;
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text("% Real.", x, yReal + 5);
    doc.setDrawColor(226, 232, 240);
    doc.rect(baseX, yReal, chartW, barH, "S");
    doc.setFillColor(34, 197, 94);
    doc.rect(baseX, yReal, realW, barH, "F");
    doc.setFontSize(6);
    doc.setTextColor(71, 85, 105);
    doc.text(formatarPercentual(dados.realizado), baseX + chartW + 2, yReal + 5);
  }

  return height;
}

function desenharGraficoResumoTotal(
  doc: jsPDF,
  startY: number,
  previsto: number,
  realizado: number,
  visibilidade: VisibilidadeGrafico
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = startY;

  if (!visibilidade.mostrarPrevisto && !visibilidade.mostrarRealizado) return y;

  if (y > pageHeight - 55) {
    doc.addPage();
    y = 20;
  }

  const tituloPartes: string[] = [];
  if (visibilidade.mostrarPrevisto) tituloPartes.push("% Previsto");
  if (visibilidade.mostrarRealizado) tituloPartes.push("% Realizado");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(30, 58, 95);
  doc.text(`Resumo geral — ${tituloPartes.join(" x ")}`, 14, y);
  y += 8;

  const h = desenharGraficoBarrasHorizontal(
    doc,
    14,
    y,
    pageWidth - 28,
    { label: "Totais da medição", previsto, realizado },
    visibilidade
  );

  if (h > 0) return y + h + 8;

  return y;
}

function montarLinhaTabela(item: ItemRelatorio, opcoes: OpcoesPdfMedicao): string[] {
  const valorMedicao = calcularValorMedicao(
    Number(item.valorTotal),
    Number(item.percentualExecutado)
  );

  const linha: string[] = [item.item || "—", item.descricao, formatarMoeda(Number(item.valorTotal))];

  if (opcoes.tabelaPrevisto) linha.push(formatarPercentual(Number(item.valorPrevisto)));
  if (opcoes.tabelaRealizado) linha.push(formatarPercentual(Number(item.valorRealizado)));
  if (opcoes.tabelaExecutado) linha.push(`${Number(item.percentualExecutado).toFixed(1)}%`);
  if (opcoes.tabelaValorMedicao) linha.push(formatarMoeda(valorMedicao));

  linha.push(item.observacao || "—");
  return linha;
}

function montarCabecalhoTabela(opcoes: OpcoesPdfMedicao): string[] {
  const head = ["Item", "Descrição", "V. Total"];
  if (opcoes.tabelaPrevisto) head.push("% Prev.");
  if (opcoes.tabelaRealizado) head.push("% Real.");
  if (opcoes.tabelaExecutado) head.push("% Exec.");
  if (opcoes.tabelaValorMedicao) head.push("V. Medição");
  head.push("Obs.");
  return head;
}

export function gerarPdfRelatorioMedicao(
  relatorio: RelatorioMedicaoCompleto,
  opcoesEmissao?: { emitidoEm?: string | null }
): Buffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const opcoes = normalizarOpcoesPdfMedicao(relatorio.opcoesPdfMedicao);
  const itensVisiveis = relatorio.itens.filter((i) => i.mostrarNoRelatorio);
  const totais = calcularTotaisItens(itensVisiveis);
  const resumoPct = calcularPercentuaisResumoGeral(itensVisiveis);
  const periodo = formatarPeriodo(relatorio.periodoInicio, relatorio.periodoFim);
  const graficoPorServico = relatorio.modoGrafico !== "CONSOLIDADO";
  const visGrafico: VisibilidadeGrafico = {
    mostrarPrevisto: opcoes.graficoPrevisto,
    mostrarRealizado: opcoes.graficoRealizado,
  };
  const visResumo: VisibilidadeGrafico = {
    mostrarPrevisto: opcoes.resumoPrevisto,
    mostrarRealizado: opcoes.resumoRealizado,
  };

  const totalValorMedicao = itensVisiveis.reduce(
    (s, item) =>
      s + calcularValorMedicao(Number(item.valorTotal), Number(item.percentualExecutado)),
    0
  );

  const cabecalhoTabela = montarCabecalhoTabela(opcoes);
  const colunasVazias = cabecalhoTabela.length;

  let y = desenharCabecalhoRelatorio(doc, "Relatório de Medição", [
    { label: "Obra", valor: relatorio.obra.nome },
    { label: "Cliente", valor: relatorio.clienteNome || relatorio.obra.clienteNome || "—" },
    { label: "Período", valor: periodo },
    linhaCabecalhoEmitido(opcoesEmissao?.emitidoEm),
  ]);

  const body =
    itensVisiveis.length > 0
      ? itensVisiveis.map((item) => montarLinhaTabela(item, opcoes))
      : [Array.from({ length: colunasVazias }, (_, i) => (i === 1 ? "Nenhum item" : "—"))];

  autoTable(doc, {
    startY: y,
    head: [cabecalhoTabela],
    body,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14, bottom: MARGEM_RODAPE_PDF + 6 },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  if (
    graficoPorServico &&
    itensVisiveis.length > 0 &&
    (visGrafico.mostrarPrevisto || visGrafico.mostrarRealizado)
  ) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 58, 95);
    doc.text("Gráficos por atividade", 14, y);
    y += 8;

    for (const item of itensVisiveis) {
      if (y > pageHeight - MARGEM_RODAPE_PDF - 30) {
        doc.addPage();
        y = 20;
      }

      const h = desenharGraficoBarrasHorizontal(
        doc,
        14,
        y,
        pageWidth - 28,
        {
          label: item.item ? `${item.item} — ${item.descricao}` : item.descricao,
          previsto: Number(item.valorPrevisto),
          realizado: Number(item.valorRealizado),
        },
        visGrafico
      );

      y += h + 6;
    }
  }

  if (itensVisiveis.length > 0) {
    y = desenharGraficoResumoTotal(doc, y, resumoPct.percentualPrevisto, resumoPct.percentualRealizado, visResumo);
  }

  if (y > pageHeight - MARGEM_RODAPE_PDF - 30) {
    doc.addPage();
    y = 20;
  }

  const linhasResumo: string[][] = [["Total Valor Total", formatarMoeda(totais.valorTotal)]];
  if (opcoes.tabelaValorMedicao) {
    linhasResumo.push(["Total Valor Medição", formatarMoeda(totalValorMedicao)]);
  }
  if (opcoes.resumoPrevisto) {
    linhasResumo.push(["% Previsto (geral)", formatarPercentual(resumoPct.percentualPrevisto)]);
  }
  if (opcoes.resumoRealizado) {
    linhasResumo.push(["% Realizado (geral)", formatarPercentual(resumoPct.percentualRealizado)]);
  }
  linhasResumo.push([
    "Acumulado medido até o período",
    relatorio.acumuladoTotal != null ? formatarMoeda(Number(relatorio.acumuladoTotal)) : "—",
  ]);

  autoTable(doc, {
    startY: y,
    body: linhasResumo,
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: "bold" } },
    margin: { left: 14, right: 14, bottom: MARGEM_RODAPE_PDF + 6 },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

  if (relatorio.observacoesGerais) {
    desenharTextoComRodape(doc, "Observações gerais", relatorio.observacoesGerais, y);
  }

  aplicarRodapeTodasPaginas(doc);
  return Buffer.from(doc.output("arraybuffer"));
}
