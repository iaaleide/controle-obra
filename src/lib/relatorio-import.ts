import { parseNumero, type ItemMedicaoInput } from "@/lib/relatorio-medicao";

const REGEX_VALOR = /(?:R\$\s*)?\d{1,3}(?:\.\d{3})*(?:,\d{2})|\d+(?:,\d{2})/g;

const REGEX_PARAR =
  /^(total|totais|acumulado|observa(ç|c)(õ|o)es|gerado em|software desenvolvido|relat(ó|o)rio de medi|planilha or(ç|c)ament)/i;

const REGEX_ITEM_CODIGO = /^(\d+(?:\.\d+)+)\s+/;

export function mapearRegistroParaItem(
  row: Record<string, unknown>,
  index: number
): ItemMedicaoInput | null {
  const descricao = String(
    row["Descrição"] || row["Descricao"] || row["descricao"] || ""
  ).trim();
  if (!descricao) return null;

  const mostrarRaw = String(
    row["Mostrar no relatório"] ||
      row["Mostrar no relatorio"] ||
      row["mostrar_no_relatorio"] ||
      "Sim"
  ).toLowerCase();

  const valorTotal = parseNumero(
    row["Valor Total"] ??
      row["Valor Total (R$)"] ??
      row["valor_total"] ??
      row["V. Total"]
  );

  const valorPrevisto = parseNumero(
    row["% Previsto"] ??
      row["Valor Previsto"] ??
      row["valor_previsto"] ??
      row["Previsto"] ??
      0
  );

  const valorRealizado = parseNumero(
    row["% Realizado"] ??
      row["Valor Realizado"] ??
      row["valor_realizado"] ??
      row["Realizado"] ??
      0
  );

  const unidade = String(row["Unidade"] || row["unidade"] || "").trim();
  const quantidade = String(row["Quantidade"] || row["quantidade"] || "").trim();
  const valorUnitario = String(
    row["Valor Unitário (R$)"] ||
      row["Valor Unitario (R$)"] ||
      row["Valor Unitário"] ||
      row["valor_unitario"] ||
      ""
  ).trim();

  let observacao =
    String(row["Observação"] || row["Observacao"] || row["observacao"] || row["Obs."] || "").trim() ||
    null;

  if (!observacao && (unidade || quantidade || valorUnitario)) {
    const partes = [
      unidade && `Unidade: ${unidade}`,
      quantidade && `Qtd: ${quantidade}`,
      valorUnitario && `V. unit.: ${valorUnitario}`,
    ].filter(Boolean);
    observacao = partes.join(" | ") || null;
  }

  return {
    item: String(row["Item"] || row["item"] || String(index + 1)).trim() || null,
    descricao,
    valorTotal,
    valorPrevisto,
    valorRealizado,
    observacao,
    mostrarNoRelatorio: !["nao", "não", "false", "0", "n"].includes(mostrarRaw),
  };
}

function ehCabecalho(linha: string): boolean {
  const lower = linha.toLowerCase();
  const temDescricao = lower.includes("desc") || lower.includes("item");
  const temMedicao =
    lower.includes("previst") || lower.includes("realiz") || lower.includes("execut");
  const temOrcamento =
    lower.includes("unidade") ||
    lower.includes("quantidade") ||
    lower.includes("unit") ||
    lower.includes("orçament") ||
    lower.includes("orcament");
  const temValor = lower.includes("valor") || lower.includes("total");

  return temDescricao && (temMedicao || temOrcamento || temValor);
}

function montarObsOrcamento(unidade: string, quantidade: string, valorUnitario: string): string {
  return [
    unidade && `Unidade: ${unidade}`,
    quantidade && `Qtd: ${quantidade}`,
    valorUnitario && `V. unit.: ${valorUnitario}`,
  ]
    .filter(Boolean)
    .join(" | ");
}

/** Planilha orçamentária: Item, Descrição, Unidade, Quantidade, V. Unitário, V. Total */
function parseLinhaOrcamentaria(linha: string): ItemMedicaoInput | null {
  const limpa = linha.replace(/\s{2,}/g, " ").trim();
  if (!limpa || REGEX_PARAR.test(limpa) || ehCabecalho(limpa)) return null;

  const itemMatch = limpa.match(REGEX_ITEM_CODIGO);
  if (!itemMatch) return null;

  const item = itemMatch[1];
  const resto = limpa.slice(itemMatch[0].length);

  const valores = [...resto.matchAll(REGEX_VALOR)];
  if (valores.length < 1) return null;

  const valorTotal = valores[valores.length - 1][0];
  const valorUnitario = valores.length >= 2 ? valores[valores.length - 2][0] : "";

  const corteValores =
    valores.length >= 2 ? (valores[valores.length - 2].index ?? resto.length) : resto.length;

  const antesValores = resto.slice(0, corteValores).trim();
  const partes = antesValores.split(/\s+/).filter(Boolean);

  if (partes.length < 2) return null;

  const quantidade = partes[partes.length - 1];
  const unidade = partes[partes.length - 2];
  const descricao = partes.slice(0, -2).join(" ");

  if (!descricao || descricao.length < 3) return null;

  return {
    item,
    descricao,
    valorTotal: parseNumero(valorTotal),
    valorPrevisto: 0,
    valorRealizado: 0,
    observacao: montarObsOrcamento(unidade, quantidade, valorUnitario) || null,
    mostrarNoRelatorio: true,
  };
}

function extrairValoresMonetarios(linha: string): { valores: string[]; resto: string } {
  const matches = [...linha.matchAll(REGEX_VALOR)];
  if (matches.length < 1) return { valores: [], resto: linha };

  const valores = matches.map((m) => m[0]);
  const primeiroValorIndex = matches[0].index ?? linha.length;
  const resto = linha.slice(0, primeiroValorIndex).trim();

  return { valores, resto };
}

/** Relatório de medição: Item, Descrição + 3 valores (total, previsto, realizado) */
function parseLinhaMedicao(linha: string): ItemMedicaoInput | null {
  const limpa = linha.replace(/\s{2,}/g, " ").trim();
  if (!limpa || REGEX_PARAR.test(limpa) || ehCabecalho(limpa)) return null;

  const colunas = limpa.split(/\t+/);
  if (colunas.length >= 5) {
    const item = mapearRegistroParaItem(
      {
        Item: colunas[0],
        Descrição: colunas[1],
        "Valor Total": colunas[2],
        "Valor Previsto": colunas[3],
        "Valor Realizado": colunas[4],
        Observação: colunas[6] || colunas[5] || "",
      },
      0
    );
    if (item?.descricao) return item;
  } else if (colunas.length === 4) {
    const item = mapearRegistroParaItem(
      {
        Item: colunas[0],
        Descrição: colunas[1],
        "Valor Total": colunas[2],
        "Valor Previsto": colunas[3],
      },
      0
    );
    if (item?.descricao) return item;
  }

  const { valores, resto } = extrairValoresMonetarios(limpa);
  if (valores.length < 1) return null;

  let itemNum: string | null = null;
  let descricao = resto;

  const matchItem = resto.match(/^(\d+(?:\.\d+)*)\s+(.+)$/);
  if (matchItem) {
    itemNum = matchItem[1];
    descricao = matchItem[2].trim();
  }

  descricao = descricao.replace(/\s+\d{1,3}(?:[.,]\d+)?%?\s*$/, "").trim();
  if (!descricao || descricao.length < 2) return null;

  if (valores.length >= 3) {
    return {
      item: itemNum,
      descricao,
      valorTotal: parseNumero(valores[0]),
      valorPrevisto: parseNumero(valores[1]),
      valorRealizado: parseNumero(valores[2]),
      mostrarNoRelatorio: true,
      observacao: null,
    };
  }

  if (valores.length === 2) {
    return {
      item: itemNum,
      descricao,
      valorTotal: parseNumero(valores[1]),
      valorPrevisto: 0,
      valorRealizado: 0,
      observacao: `V. unit.: ${valores[0]}`,
      mostrarNoRelatorio: true,
    };
  }

  return {
    item: itemNum,
    descricao,
    valorTotal: parseNumero(valores[0]),
    valorPrevisto: 0,
    valorRealizado: 0,
    mostrarNoRelatorio: true,
    observacao: null,
  };
}

function parseLinhaServico(linha: string): ItemMedicaoInput | null {
  return parseLinhaOrcamentaria(linha) ?? parseLinhaMedicao(linha);
}

export function parseTextoPdfParaItens(texto: string): ItemMedicaoInput[] {
  const linhas = texto
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  let inicioDados = 0;
  for (let i = 0; i < linhas.length; i++) {
    if (ehCabecalho(linhas[i])) {
      inicioDados = i + 1;
      break;
    }
  }

  const itens: ItemMedicaoInput[] = [];
  const processar = (inicio: number) => {
    for (let i = inicio; i < linhas.length; i++) {
      if (REGEX_PARAR.test(linhas[i])) break;
      const item = parseLinhaServico(linhas[i]);
      if (item) itens.push(item);
    }
  };

  processar(inicioDados);

  if (itens.length === 0) {
    processar(0);
  }

  return itens;
}
