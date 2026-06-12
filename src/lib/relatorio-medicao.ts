import type { ItemRelatorio, ModoGraficoMedicao, Obra, Relatorio } from "@prisma/client";
import { RODAPE_RELATORIO } from "@/lib/pdf";

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

export function textoMedicaoWhatsApp(dados: {
  obra: string;
  periodo: string;
  cliente?: string | null;
  itens: ItemMedicaoCalculado[];
  acumuladoTotal?: number | null;
}): string {
  const visiveis = dados.itens.filter((i) => i.mostrarNoRelatorio !== false);
  const totais = calcularTotaisItens(visiveis);

  let texto = `📊 *Relatório de Medição*\n`;
  texto += `🏗️ Obra: ${dados.obra}\n`;
  if (dados.cliente) texto += `👤 Cliente: ${dados.cliente}\n`;
  texto += `📅 Período: ${dados.periodo}\n\n`;

  if (visiveis.length === 0) {
    texto += `_Nenhum serviço no relatório._\n`;
  } else {
    for (const item of visiveis) {
      texto += `📌 ${item.item ? `${item.item} — ` : ""}${item.descricao}\n`;
      texto += `   Total: ${formatarMoeda(item.valorTotal)} | Prev: ${formatarMoeda(item.valorPrevisto)} | Real: ${formatarMoeda(item.valorRealizado)}\n`;
      texto += `   Executado: *${item.percentualExecutado.toFixed(1)}%*\n`;
      if (item.observacao) texto += `   Obs: ${item.observacao}\n`;
    }
  }

  texto += `\n*Totais*\n`;
  texto += `Valor total: ${formatarMoeda(totais.valorTotal)}\n`;
  texto += `Previsto: ${formatarMoeda(totais.valorPrevisto)}\n`;
  texto += `Realizado: ${formatarMoeda(totais.valorRealizado)}\n`;

  if (dados.acumuladoTotal != null) {
    texto += `Acumulado medido: ${formatarMoeda(Number(dados.acumuladoTotal))}\n`;
  }

  texto += `\n${RODAPE_RELATORIO}`;
  return texto;
}
