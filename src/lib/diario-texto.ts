import type { DiarioObra, DiarioObraFoto, Obra } from "@prisma/client";
import { RODAPE_RELATORIO } from "@/lib/pdf";

export type DiarioObraCompleto = DiarioObra & {
  obra: Obra;
  fotos: DiarioObraFoto[];
};

export type PayloadDiarioWhatsApp = {
  obra: Obra;
  data: string;
  clienteNome?: string | null;
  clima?: string | null;
  observacoes?: string | null;
  fotos: { legenda?: string | null; imagemBase64?: string | null }[];
};

export function textoDiarioWhatsApp(dados: PayloadDiarioWhatsApp): string {
  const dataFmt = new Date(dados.data + "T12:00:00").toLocaleDateString("pt-BR");
  const fotos = dados.fotos.filter((f) => f.imagemBase64);

  let texto = `📓 *Diário de Obra*\n`;
  texto += `🏗️ Obra: ${dados.obra.nome}\n`;
  texto += `👤 Cliente: ${dados.clienteNome || dados.obra.clienteNome || "—"}\n`;
  texto += `📍 Endereço: ${dados.obra.endereco || "—"}\n`;
  texto += `📅 Data: ${dataFmt}\n`;
  if (dados.clima) texto += `🌤️ Clima: ${dados.clima}\n`;
  texto += `🖼️ Fotos: ${fotos.length}\n`;

  fotos.forEach((foto, i) => {
    if (foto.legenda) texto += `\n${i + 1}. ${foto.legenda}`;
  });

  if (dados.observacoes) {
    texto += `\n\n📝 Observações:\n${dados.observacoes}`;
  }

  texto += `\n\n${RODAPE_RELATORIO}`;
  return texto;
}

export function textoDiarioWhatsAppFromDb(diario: DiarioObraCompleto): string {
  return textoDiarioWhatsApp({
    obra: diario.obra,
    data: diario.data.toISOString().slice(0, 10),
    clienteNome: diario.clienteNome,
    clima: diario.clima,
    observacoes: diario.observacoes,
    fotos: diario.fotos,
  });
}
