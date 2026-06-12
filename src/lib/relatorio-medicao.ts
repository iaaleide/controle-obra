import type { ItemRelatorio, ModoGraficoMedicao, Obra, Relatorio } from "@prisma/client";

export type ItemMedicaoInput = {
  item?: string | null;
  descricao: string;
  valorTotal: number;
  valorPrevisto: number;
  valorRealizado: number;
  mostrarNoRelatorio?: boolean;
  observacao?: string | null;
};

export type ItemMedicaoCalculado = ItemMedicaoInput & {
  percentualExecutado: number;
};

export type RelatorioMedicaoCompleto = Relatorio & {
  obra: Obra;
  itens: ItemRelatorio[];
};

export function calcularPercentualExecutado(
  valorPrevisto: number,
  valorRealizado: number
): number {
  if (!valorPrevisto || valorPrevisto === 0) return 0;
  return Math.round((valorRealizado / valorPrevisto) * 10000) / 100;
}

export function calcularItemMedicao(item: ItemMedicaoInput): ItemMedicaoCalculado {
  return {
    ...item,
    percentualExecutado: calcularPercentualExecutado(item.valorPrevisto, item.valorRealizado),
  };
}

export function calcularTotaisItens(
  itens: {
    valorTotal: number | { toString(): string };
    valorPrevisto: number | { toString(): string };
    valorRealizado: number | { toString(): string };
  }[]
): { valorTotal: number; valorPrevisto: number; valorRealizado: number } {
  const inicial = { valorTotal: 0, valorPrevisto: 0, valorRealizado: 0 };
  return itens.reduce<{ valorTotal: number; valorPrevisto: number; valorRealizado: number }>(
    (acc, item) => ({
      valorTotal: acc.valorTotal + Number(item.valorTotal),
      valorPrevisto: acc.valorPrevisto + Number(item.valorPrevisto),
      valorRealizado: acc.valorRealizado + Number(item.valorRealizado),
    }),
    inicial
  );
}

export function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatarPeriodo(inicio: Date, fim: Date): string {
  const fmt = (d: Date) => d.toLocaleDateString("pt-BR");
  return `${fmt(inicio)} a ${fmt(fim)}`;
}

export function labelModoGrafico(modo: ModoGraficoMedicao): string {
  return modo === "POR_SERVICO" ? "Gráfico por serviço" : "Gráfico consolidado";
}

export function parseNumero(valor: unknown): number {
  if (typeof valor === "number" && !Number.isNaN(valor)) return valor;
  if (typeof valor === "string") {
    const limpo = valor.replace(/[^\d,.-]/g, "").replace(",", ".");
    const n = parseFloat(limpo);
    return Number.isNaN(n) ? 0 : n;
  }
  return 0;
}
