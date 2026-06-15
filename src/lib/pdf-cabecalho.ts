import { jsPDF } from "jspdf";
import { RODAPE_RELATORIO } from "@/lib/pdf";
import { formatarDataEmitido } from "@/lib/periodo-relatorio";

export const RODAPE_SOFT = RODAPE_RELATORIO;
export const MARGEM_RODAPE_PDF = 18;

export function linhaCabecalhoEmitido(emitidoEm?: string | null) {
  return { label: "Emitido em", valor: formatarDataEmitido(emitidoEm) };
}

export function desenharCabecalhoRelatorio(
  doc: jsPDF,
  titulo: string,
  linhas: { label: string; valor: string }[],
  startY = 20,
  options?: { compacto?: boolean }
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const compacto = options?.compacto === true;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(compacto ? 14 : 18);
  doc.setTextColor(30, 58, 95);
  doc.text(titulo, pageWidth / 2, startY, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(compacto ? 9 : 12);
  doc.setTextColor(71, 85, 105);

  const tituloOffset = compacto ? 9 : 12;
  const linhaStep = compacto ? 5.5 : 8;
  let y = startY + tituloOffset;
  for (const linha of linhas) {
    doc.text(`${linha.label}: ${linha.valor}`, 14, y, {
      maxWidth: pageWidth - 28,
    });
    y += linhaStep;
  }

  return y + (compacto ? 2 : 4);
}

export function desenharRodapeRelatorio(doc: jsPDF, rodape = RODAPE_RELATORIO) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(30, 58, 95);
  doc.text(rodape, pageWidth / 2, pageHeight - MARGEM_RODAPE_PDF, { align: "center" });
}

export function aplicarRodapeTodasPaginas(doc: jsPDF, rodape = RODAPE_RELATORIO) {
  const total = doc.getNumberOfPages();
  for (let page = 1; page <= total; page++) {
    doc.setPage(page);
    desenharRodapeRelatorio(doc, rodape);
  }
}

/** Evita que texto longo invada a área do rodapé. */
export function desenharTextoComRodape(
  doc: jsPDF,
  titulo: string,
  texto: string,
  yInicial: number,
  margemX = 14,
  larguraMax?: number
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = larguraMax ?? pageWidth - margemX * 2;
  const linhas = doc.splitTextToSize(texto, maxWidth);
  const alturaLinha = 5;
  const alturaTitulo = 10;
  const alturaTotal = alturaTitulo + linhas.length * alturaLinha + 4;

  let y = yInicial;
  if (y + alturaTotal > pageHeight - MARGEM_RODAPE_PDF - 4) {
    doc.addPage();
    y = 20;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 58, 95);
  doc.text(titulo, margemX, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(linhas, margemX, y + 6);

  return y + 6 + linhas.length * alturaLinha + 4;
}
