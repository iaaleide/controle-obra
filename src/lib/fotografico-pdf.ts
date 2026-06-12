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

export const FOTOS_POR_FOLHA_PDF = 6;
const COLS = 2;
const MARGIN_X = 14;
const COL_GAP = 5;
const ROW_GAP = 3;
const LEGENDA_H = 5;
const FOOTER_MARGIN = 32;

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
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text("Imagem indisponível", x + boxW / 2, y + boxH / 2, { align: "center" });
  }
}

function chunkFotos<T>(lista: T[], tamanho: number): T[][] {
  if (lista.length === 0) return [[]];
  const paginas: T[][] = [];
  for (let i = 0; i < lista.length; i += tamanho) {
    paginas.push(lista.slice(i, i + tamanho));
  }
  return paginas;
}

export function gerarPdfRelatorioFotografico(relatorio: RelatorioFotograficoCompleto): Buffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const periodo = formatarPeriodo(relatorio.periodoInicio, relatorio.periodoFim);

  const fotos = relatorio.fotos
    .filter((f) => f.imagemBase64)
    .sort((a, b) => a.ordem - b.ordem);
  const paginas = chunkFotos(fotos, FOTOS_POR_FOLHA_PDF);

  const boxW = (pageWidth - MARGIN_X * 2 - COL_GAP * (COLS - 1)) / COLS;
  const rows = FOTOS_POR_FOLHA_PDF / COLS;

  for (let pagina = 0; pagina < paginas.length; pagina++) {
    if (pagina > 0) doc.addPage();

    const fotosPagina = paginas[pagina];
    let y: number;

    if (pagina === 0) {
      y = desenharCabecalhoRelatorio(
        doc,
        "Relatório Fotográfico",
        [
          { label: "Obra", valor: relatorio.obra.nome },
          { label: "Cliente", valor: relatorio.clienteNome || relatorio.obra.clienteNome || "—" },
          { label: "Endereço", valor: relatorio.obra.endereco || "—" },
          { label: "Período", valor: periodo },
        ],
        16,
        { compacto: true }
      );
    } else {
      y = 16;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(30, 58, 95);
      doc.text(`Relatório Fotográfico — folha ${pagina + 1}`, MARGIN_X, y);
      y += 7;
    }

    const pageBottom = pageHeight - FOOTER_MARGIN;
    const available = pageBottom - y;
    const boxH = Math.floor(
      (available - rows * LEGENDA_H - (rows - 1) * ROW_GAP) / rows
    );

    for (let i = 0; i < fotosPagina.length; i++) {
      const foto = fotosPagina[i];
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = MARGIN_X + col * (boxW + COL_GAP);
      const rowY = y + row * (boxH + LEGENDA_H + ROW_GAP);

      desenharFotoNoQuadro(doc, foto.imagemBase64!, x, rowY, boxW, boxH);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      const legenda = foto.legenda || `Foto ${pagina * FOTOS_POR_FOLHA_PDF + i + 1}`;
      doc.text(legenda, x, rowY + boxH + 4, { maxWidth: boxW });
    }
  }

  if (relatorio.observacoesGerais) {
    doc.addPage();
    const obsY = 20;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 58, 95);
    doc.text("Observações", MARGIN_X, obsY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(relatorio.observacoesGerais, MARGIN_X, obsY + 6, { maxWidth: pageWidth - 28 });
  }

  aplicarRodapeTodasPaginas(doc, RODAPE_SOFT);
  return Buffer.from(doc.output("arraybuffer"));
}
