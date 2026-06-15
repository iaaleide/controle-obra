import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  aplicarRodapeTodasPaginas,
  desenharCabecalhoRelatorio,
  linhaCabecalhoEmitido,
  MARGEM_RODAPE_PDF,
} from "@/lib/pdf-cabecalho";
import type { RelatorioCustoSemanal } from "@/lib/custo-relatorio";

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function gerarPdfRelatorioCusto(dados: RelatorioCustoSemanal): Buffer {
  const doc = new jsPDF();

  const y = desenharCabecalhoRelatorio(doc, "Relatório de Custos", [
    { label: "Obra", valor: dados.obra },
    { label: "Período", valor: dados.periodo },
    { label: "Total geral", valor: formatarMoeda(dados.totalGeral) },
    linhaCabecalhoEmitido(dados.emitidoEm),
  ]);

  const body =
    dados.linhas.length > 0
      ? dados.linhas.map((l) => [
          l.funcionario,
          l.cargo || "-",
          String(l.diasTrabalhados),
          formatarMoeda(l.valorDiario),
          formatarMoeda(l.valorTotal),
        ])
      : [["Nenhum custo no período", "-", "0", "-", "-"]];

  autoTable(doc, {
    startY: y,
    head: [["Funcionário", "Cargo", "Dias", "Valor/dia", "Total"]],
    body,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    margin: { left: 14, right: 14, bottom: MARGEM_RODAPE_PDF + 6 },
  });

  aplicarRodapeTodasPaginas(doc);

  return Buffer.from(doc.output("arraybuffer"));
}
