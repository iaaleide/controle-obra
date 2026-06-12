import { Prisma } from "@prisma/client";
import type { ModoGraficoMedicao, Obra } from "@prisma/client";
import {
  calcularItemMedicao,
  type ItemMedicaoInput,
  type OpcoesPdfMedicao,
  type RelatorioMedicaoCompleto,
} from "@/lib/relatorio-medicao";

export type PayloadMedicaoPdf = {
  obraId: string;
  periodoInicio: string;
  periodoFim: string;
  acumuladoTotal?: number | null;
  observacoesGerais?: string | null;
  modoGrafico?: ModoGraficoMedicao;
  opcoesPdfMedicao?: OpcoesPdfMedicao;
  clienteNome?: string | null;
  itens: ItemMedicaoInput[];
};

export function montarRelatorioMedicaoParaPdf(
  obra: Obra,
  payload: PayloadMedicaoPdf
): RelatorioMedicaoCompleto {
  const itens = payload.itens.map((item, ordem) => {
    const calc = calcularItemMedicao(item);
    return {
      id: `preview-${ordem}`,
      relatorioId: "preview",
      ordem,
      item: calc.item || null,
      descricao: calc.descricao,
      valorTotal: new Prisma.Decimal(calc.valorTotal),
      valorPrevisto: new Prisma.Decimal(calc.valorPrevisto),
      valorRealizado: new Prisma.Decimal(calc.valorRealizado),
      percentualExecutado: new Prisma.Decimal(calc.percentualExecutado),
      mostrarNoRelatorio: calc.mostrarNoRelatorio !== false,
      observacao: calc.observacao || null,
    };
  });

  return {
    id: "preview",
    obraId: obra.id,
    tipo: "MEDICAO",
    periodoInicio: new Date(payload.periodoInicio + "T12:00:00"),
    periodoFim: new Date(payload.periodoFim + "T12:00:00"),
    acumuladoTotal:
      payload.acumuladoTotal != null ? new Prisma.Decimal(payload.acumuladoTotal) : null,
    observacoesGerais: payload.observacoesGerais ?? null,
    modoGrafico: payload.modoGrafico ?? "POR_SERVICO",
    opcoesPdfMedicao: payload.opcoesPdfMedicao ?? null,
    clienteNome: payload.clienteNome ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
    obra,
    itens,
  };
}
