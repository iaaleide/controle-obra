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

export type OpcoesPdfMedicao = {
  tabelaPrevisto: boolean;
  tabelaRealizado: boolean;
  tabelaExecutado: boolean;
  tabelaValorMedicao: boolean;
  graficoPrevisto: boolean;
  graficoRealizado: boolean;
  resumoPrevisto: boolean;
  resumoRealizado: boolean;
};

export const OPCOES_PDF_MEDICAO_PADRAO: OpcoesPdfMedicao = {
  tabelaPrevisto: true,
  tabelaRealizado: true,
  tabelaExecutado: true,
  tabelaValorMedicao: true,
  graficoPrevisto: true,
  graficoRealizado: true,
  resumoPrevisto: true,
  resumoRealizado: true,
};

export function normalizarOpcoesPdfMedicao(raw: unknown): OpcoesPdfMedicao {
  if (!raw || typeof raw !== "object") return { ...OPCOES_PDF_MEDICAO_PADRAO };
  const o = raw as Partial<OpcoesPdfMedicao>;
  return {
    tabelaPrevisto: o.tabelaPrevisto ?? OPCOES_PDF_MEDICAO_PADRAO.tabelaPrevisto,
    tabelaRealizado: o.tabelaRealizado ?? OPCOES_PDF_MEDICAO_PADRAO.tabelaRealizado,
    tabelaExecutado: o.tabelaExecutado ?? OPCOES_PDF_MEDICAO_PADRAO.tabelaExecutado,
    tabelaValorMedicao: o.tabelaValorMedicao ?? OPCOES_PDF_MEDICAO_PADRAO.tabelaValorMedicao,
    graficoPrevisto: o.graficoPrevisto ?? OPCOES_PDF_MEDICAO_PADRAO.graficoPrevisto,
    graficoRealizado: o.graficoRealizado ?? OPCOES_PDF_MEDICAO_PADRAO.graficoRealizado,
    resumoPrevisto: o.resumoPrevisto ?? OPCOES_PDF_MEDICAO_PADRAO.resumoPrevisto,
    resumoRealizado: o.resumoRealizado ?? OPCOES_PDF_MEDICAO_PADRAO.resumoRealizado,
  };
}

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

export function calcularValorMedicao(
  valorTotal: number,
  percentualExecutado: number
): number {
  return Math.round(valorTotal * (percentualExecutado / 100) * 100) / 100;
}

export function calcularItemMedicao(item: ItemMedicaoInput): ItemMedicaoCalculado {
  return {
    ...item,
    percentualExecutado: calcularPercentualExecutado(item.valorPrevisto, item.valorRealizado),
  };
}

export function itemRelatorioParaCalculado(item: ItemRelatorio): ItemMedicaoCalculado {
  return {
    item: item.item,
    descricao: item.descricao,
    valorTotal: Number(item.valorTotal),
    valorPrevisto: Number(item.valorPrevisto),
    valorRealizado: Number(item.valorRealizado),
    percentualExecutado: Number(item.percentualExecutado),
    mostrarNoRelatorio: item.mostrarNoRelatorio,
    observacao: item.observacao,
  };
}

export function itensMedicaoParaCreateMany(relatorioId: string, listaItens: ItemMedicaoInput[]) {
  return listaItens.map((item, ordem) => {
    const calc = calcularItemMedicao(item);
    return {
      relatorioId,
      ordem,
      item: calc.item || null,
      descricao: calc.descricao,
      valorTotal: calc.valorTotal,
      valorPrevisto: calc.valorPrevisto,
      valorRealizado: calc.valorRealizado,
      percentualExecutado: calc.percentualExecutado,
      mostrarNoRelatorio: calc.mostrarNoRelatorio !== false,
      observacao: calc.observacao || null,
    };
  });
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
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Exibição em input — 13.875,00 (sem símbolo R$) */
export function formatarMoedaDigitacao(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function parseMoedaBrasil(valor: string): number {
  const limpo = valor.replace(/[^\d,.-]/g, "").trim();
  if (!limpo) return 0;

  if (limpo.includes(",")) {
    const semMilhar = limpo.replace(/\./g, "");
    const n = parseFloat(semMilhar.replace(",", "."));
    return Number.isNaN(n) ? 0 : Math.round(n * 100) / 100;
  }

  const n = parseFloat(limpo);
  return Number.isNaN(n) ? 0 : Math.round(n * 100) / 100;
}

export function formatarPercentual(valor: number): string {
  return `${valor.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

/** Média ponderada pelo Valor Total — para gráfico resumo geral em % */
export function calcularPercentuaisResumoGeral(
  itens: {
    valorTotal: number | { toString(): string };
    valorPrevisto: number | { toString(): string };
    valorRealizado: number | { toString(): string };
  }[]
): { percentualPrevisto: number; percentualRealizado: number } {
  if (itens.length === 0) return { percentualPrevisto: 0, percentualRealizado: 0 };

  const pesoTotal = itens.reduce((s, i) => s + Number(i.valorTotal), 0);

  if (pesoTotal <= 0) {
    const n = itens.length;
    return {
      percentualPrevisto:
        itens.reduce((s, i) => s + Number(i.valorPrevisto), 0) / n,
      percentualRealizado:
        itens.reduce((s, i) => s + Number(i.valorRealizado), 0) / n,
    };
  }

  return {
    percentualPrevisto:
      itens.reduce((s, i) => s + Number(i.valorTotal) * Number(i.valorPrevisto), 0) / pesoTotal,
    percentualRealizado:
      itens.reduce((s, i) => s + Number(i.valorTotal) * Number(i.valorRealizado), 0) / pesoTotal,
  };
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
      texto += `   Total: ${formatarMoeda(item.valorTotal)} | Prev: ${formatarPercentual(item.valorPrevisto)} | Real: ${formatarPercentual(item.valorRealizado)}\n`;
      texto += `   Executado: *${item.percentualExecutado.toFixed(1)}%*\n`;
      if (item.observacao) texto += `   Obs: ${item.observacao}\n`;
    }
  }

  texto += `\n*Totais*\n`;
  const resumoPct = calcularPercentuaisResumoGeral(visiveis);
  texto += `Valor total: ${formatarMoeda(totais.valorTotal)}\n`;
  texto += `% Previsto (geral): ${formatarPercentual(resumoPct.percentualPrevisto)}\n`;
  texto += `% Realizado (geral): ${formatarPercentual(resumoPct.percentualRealizado)}\n`;

  if (dados.acumuladoTotal != null) {
    texto += `Acumulado medido: ${formatarMoeda(Number(dados.acumuladoTotal))}\n`;
  }

  texto += `\n${RODAPE_RELATORIO}`;
  return texto;
}
