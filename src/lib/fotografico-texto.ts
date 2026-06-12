import { RODAPE_RELATORIO } from "@/lib/pdf";
import { formatarPeriodo } from "@/lib/relatorio-medicao";
import type { RelatorioFotograficoCompleto } from "@/lib/fotografico-pdf";

export function textoFotograficoWhatsApp(relatorio: RelatorioFotograficoCompleto): string {
  const periodo = formatarPeriodo(relatorio.periodoInicio, relatorio.periodoFim);
  const fotos = relatorio.fotos.filter((f) => f.imagemBase64);

  let texto = `📷 *Relatório Fotográfico*\n`;
  texto += `🏗️ Obra: ${relatorio.obra.nome}\n`;
  texto += `👤 Cliente: ${relatorio.clienteNome || relatorio.obra.clienteNome || "—"}\n`;
  texto += `📍 Endereço: ${relatorio.obra.endereco || "—"}\n`;
  texto += `📅 Período: ${periodo}\n`;
  texto += `🖼️ Fotos: ${fotos.length}\n`;

  fotos.forEach((foto, i) => {
    if (foto.legenda) texto += `\n${i + 1}. ${foto.legenda}`;
  });

  if (relatorio.observacoesGerais) {
    texto += `\n\n📝 Observações:\n${relatorio.observacoesGerais}`;
  }

  texto += `\n\n${RODAPE_RELATORIO}`;
  return texto;
}
