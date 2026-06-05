import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface RelatorioLinha {
  funcionario: string;
  cargo: string;
  diasTrabalhados: number;
  datas: string[];
}

export interface RelatorioSemanal {
  obra: string;
  periodo: string;
  linhas: RelatorioLinha[];
  totalPresencas: number;
}

export const RODAPE_RELATORIO = "Sistema desenvolvido por Atômica Engenharia®";

export function gerarPdfRelatorio(dados: RelatorioSemanal): Buffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(18);
  doc.setTextColor(30, 58, 95);
  doc.text("Relatório de Presença — Obra", pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(12);
  doc.setTextColor(71, 85, 105);
  doc.text(`Obra: ${dados.obra}`, 14, 32);
  doc.text(`Período: ${dados.periodo}`, 14, 40);
  doc.text(`Total de presenças: ${dados.totalPresencas}`, 14, 48);

  autoTable(doc, {
    startY: 56,
    head: [["Funcionário", "Cargo", "Dias", "Datas"]],
    body: dados.linhas.map((l) => [
      l.funcionario,
      l.cargo || "—",
      String(l.diasTrabalhados),
      l.datas.join(", ") || "—",
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [37, 99, 235] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Gerado em ${new Date().toLocaleString("pt-BR")}`,
    pageWidth / 2,
    pageHeight - 16,
    { align: "center" }
  );
  doc.text(RODAPE_RELATORIO, pageWidth / 2, pageHeight - 10, { align: "center" });

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}

export function textoRelatorioWhatsApp(dados: RelatorioSemanal): string {
  let texto = `📋 *Relatório de Presença*\n`;
  texto += `🏗️ Obra: ${dados.obra}\n`;
  texto += `📅 Período: ${dados.periodo}\n\n`;

  for (const linha of dados.linhas) {
    texto += `👷 ${linha.funcionario}: *${linha.diasTrabalhados} dia(s)*\n`;
    if (linha.datas.length > 0) {
      texto += `   ${linha.datas.join(", ")}\n`;
    }
  }

  texto += `\nTotal: ${dados.totalPresencas} presença(s)`;
  texto += `\n\n${RODAPE_RELATORIO}`;
  return texto;
}
