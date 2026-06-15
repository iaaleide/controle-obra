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

export function textoFotograficoWhatsAppLocal(params: {
  obra: { nome: string; clienteNome?: string | null; endereco?: string | null };
  periodoInicio: string;
  periodoFim: string;
  clienteNome?: string | null;
  observacoesGerais?: string | null;
  fotos: { legenda?: string; temFoto: boolean }[];
}): string {
  const periodo = formatarPeriodo(
    new Date(params.periodoInicio + "T12:00:00"),
    new Date(params.periodoFim + "T12:00:00")
  );
  const comFoto = params.fotos.filter((f) => f.temFoto);

  let texto = `📷 *Relatório Fotográfico*\n`;
  texto += `🏗️ Obra: ${params.obra.nome}\n`;
  texto += `👤 Cliente: ${params.clienteNome || params.obra.clienteNome || "—"}\n`;
  texto += `📍 Endereço: ${params.obra.endereco || "—"}\n`;
  texto += `📅 Período: ${periodo}\n`;
  texto += `🖼️ Fotos: ${comFoto.length}\n`;

  comFoto.forEach((foto, i) => {
    if (foto.legenda) texto += `\n${i + 1}. ${foto.legenda}`;
  });

  if (params.observacoesGerais) {
    texto += `\n\n📝 Observações:\n${params.observacoesGerais}`;
  }

  texto += `\n\n${RODAPE_RELATORIO}`;
  return texto;
}
