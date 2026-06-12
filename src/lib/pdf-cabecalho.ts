import { jsPDF } from "jspdf";
import { RODAPE_RELATORIO } from "@/lib/pdf";

export const RODAPE_SOFT = RODAPE_RELATORIO;

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
  doc.text(rodape, pageWidth / 2, pageHeight - 10, { align: "center" });
}

export function aplicarRodapeTodasPaginas(doc: jsPDF, rodape = RODAPE_RELATORIO) {
  const total = doc.getNumberOfPages();
  for (let page = 1; page <= total; page++) {
    doc.setPage(page);
    desenharRodapeRelatorio(doc, rodape);
  }
}
