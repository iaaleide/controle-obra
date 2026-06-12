import { jsPDF } from "jspdf";
import type { FotoRelatorio, Obra, Relatorio } from "@prisma/client";
import {
  aplicarRodapeTodasPaginas,
  desenharCabecalhoRelatorio,
  RODAPE_SOFT,
} from "@/lib/pdf-cabecalho";
import { calcularFitContain, obterDimensoesBase64 } from "@/lib/imagem-utils";
import { formatarPeriodo } from "@/lib/relatorio-medicao";

export type RelatorioFotograficoCompleto = Relatorio & {
  obra: Obra;
  fotos: FotoRelatorio[];
};

function detectarFormatoImagem(dataUrl: string): "JPEG" | "PNG" | "WEBP" {
  if (dataUrl.startsWith("data:image/png")) return "PNG";
  if (dataUrl.startsWith("data:image/webp")) return "WEBP";
  return "JPEG";
}

function desenharFotoNoQuadro(
  doc: jsPDF,
  dataUrl: string,
  x: number,
  y: number,
  boxW: number,
  boxH: number
) {
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.rect(x, y, boxW, boxH, "FD");

  try {
    const { w: imgW, h: imgH } = obterDimensoesBase64(dataUrl);
    const fit = calcularFitContain(imgW, imgH, boxW - 4, boxH - 4);
    const formato = detectarFormatoImagem(dataUrl);
    doc.addImage(dataUrl, formato, x + 2 + fit.x, y + 2 + fit.y, fit.w, fit.h);
  } catch {
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Imagem indisponível", x + boxW / 2, y + boxH / 2, { align: "center" });
  }
}

export function gerarPdfRelatorioFotografico(relatorio: RelatorioFotograficoCompleto): Buffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const periodo = formatarPeriodo(relatorio.periodoInicio, relatorio.periodoFim);

  let y = desenharCabecalhoRelatorio(doc, "Relatório Fotográfico", [
    { label: "Obra", valor: relatorio.obra.nome },
    { label: "Cliente", valor: relatorio.clienteNome || relatorio.obra.clienteNome || "—" },
    { label: "Endereço", valor: relatorio.obra.endereco || "—" },
    { label: "Período", valor: periodo },
  ]);

  const fotos = relatorio.fotos.filter((f) => f.imagemBase64).slice(0, 6);
  const cols = fotos.length <= 2 ? 1 : 2;
  const gap = 6;
  const boxW = (pageWidth - 28 - gap * (cols - 1)) / cols;
  const boxH = cols === 1 ? 90 : 70;

  let col = 0;
  let rowY = y;

  for (let i = 0; i < fotos.length; i++) {
    const foto = fotos[i];
    const x = 14 + col * (boxW + gap);

    if (rowY + boxH + 20 > pageHeight - 32) {
      doc.addPage();
      rowY = 20;
      col = 0;
    }

    desenharFotoNoQuadro(doc, foto.imagemBase64!, x, rowY, boxW, boxH);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const legenda = foto.legenda || `Foto ${i + 1}`;
    doc.text(legenda, x, rowY + boxH + 5, { maxWidth: boxW });

    col++;
    if (col >= cols) {
      col = 0;
      rowY += boxH + 18;
    }
  }

  if (relatorio.observacoesGerais) {
    const obsY = Math.max(rowY + (col > 0 ? boxH + 18 : 0), y + 10);
    const finalY = obsY > pageHeight - 40 ? 20 : obsY;
    if (obsY > pageHeight - 40) doc.addPage();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 58, 95);
    doc.text("Observações", 14, finalY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(relatorio.observacoesGerais, 14, finalY + 6, { maxWidth: pageWidth - 28 });
  }

  aplicarRodapeTodasPaginas(doc, RODAPE_SOFT);
  return Buffer.from(doc.output("arraybuffer"));
}
