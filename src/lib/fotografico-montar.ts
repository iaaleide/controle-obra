import type { FotoRelatorio, Obra } from "@prisma/client";
import type { RelatorioFotograficoCompleto } from "@/lib/fotografico-pdf";

export type PayloadFotograficoPdf = {
  obraId: string;
  periodoInicio: string;
  periodoFim: string;
  clienteNome?: string | null;
  observacoesGerais?: string | null;
  fotos: { ordem: number; imagemBase64?: string; legenda?: string }[];
};

export function montarRelatorioFotograficoParaPdf(
  obra: Obra,
  payload: PayloadFotograficoPdf
): RelatorioFotograficoCompleto {
  const fotos: FotoRelatorio[] = payload.fotos
    .filter((f) => f.imagemBase64)
    .slice(0, 6)
    .map((f, index) => ({
      id: `preview-${index}`,
      relatorioId: "preview",
      ordem: f.ordem ?? index,
      imagemBase64: f.imagemBase64 || null,
      legenda: f.legenda || null,
    }));

  return {
    id: "preview",
    obraId: obra.id,
    tipo: "FOTOGRAFICO",
    periodoInicio: new Date(payload.periodoInicio + "T12:00:00"),
    periodoFim: new Date(payload.periodoFim + "T12:00:00"),
    acumuladoTotal: null,
    observacoesGerais: payload.observacoesGerais ?? null,
    modoGrafico: "POR_SERVICO",
    clienteNome: payload.clienteNome ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
    obra,
    fotos,
  };
}
