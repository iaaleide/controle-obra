import { parseNumero, type ItemMedicaoInput } from "@/lib/relatorio-medicao";

export function mapearRegistroParaItem(
  row: Record<string, unknown>,
  index: number
): ItemMedicaoInput | null {
  const descricao = String(row["Descrição"] || row["Descricao"] || row["descricao"] || "").trim();
  if (!descricao) return null;

  const mostrarRaw = String(
    row["Mostrar no relatório"] ||
      row["Mostrar no relatorio"] ||
      row["mostrar_no_relatorio"] ||
      "Sim"
  ).toLowerCase();

  return {
    item: String(row["Item"] || row["item"] || String(index + 1)).trim() || null,
    descricao,
    valorTotal: parseNumero(row["Valor Total"] ?? row["valor_total"] ?? row["V. Total"]),
    valorPrevisto: parseNumero(row["Valor Previsto"] ?? row["valor_previsto"] ?? row["Previsto"]),
    valorRealizado: parseNumero(
      row["Valor Realizado"] ?? row["valor_realizado"] ?? row["Realizado"]
    ),
    observacao:
      String(row["Observação"] || row["Observacao"] || row["observacao"] || row["Obs."] || "").trim() ||
      null,
    mostrarNoRelatorio: !["nao", "não", "false", "0", "n"].includes(mostrarRaw),
  };
}

const REGEX_VALOR = /(?:R\$\s*)?\d{1,3}(?:\.\d{3})*(?:,\d{2})|\d+(?:,\d{2})/g;

const REGEX_PARAR =
  /^(total|totais|acumulado|observa(ç|c)(õ|o)es|gerado em|software desenvolvido|relat(ó|o)rio de medi)/i;

function ehCabecalho(linha: string): boolean {
  const lower = linha.toLowerCase();
  const temDescricao = lower.includes("desc") || lower.includes("servi");
  const temValores =
    lower.includes("previst") ||
    lower.includes("realiz") ||
    lower.includes("valor") ||
    lower.includes("total");
  return temDescricao && temValores;
}

function extrairValoresMonetarios(linha: string): { valores: string[]; resto: string } {
  const matches = [...linha.matchAll(REGEX_VALOR)];
  if (matches.length < 3) return { valores: [], resto: linha };

  const valores = matches.slice(0, 3).map((m) => m[0]);
  const primeiroValorIndex = matches[0].index ?? linha.length;
  const resto = linha.slice(0, primeiroValorIndex).trim();

  return { valores, resto };
}

function parseLinhaServico(linha: string, index: number): ItemMedicaoInput | null {
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
      index
    );
    if (item && item.descricao) return item;
  }

  const { valores, resto } = extrairValoresMonetarios(limpa);
  if (valores.length < 3) return null;

  let itemNum: string | null = null;
  let descricao = resto;

  const matchItem = resto.match(/^(\d+[\d.]*)\s+(.+)$/);
  if (matchItem) {
    itemNum = matchItem[1];
    descricao = matchItem[2].trim();
  }

  descricao = descricao.replace(/\s+\d{1,3}(?:[.,]\d+)?%?\s*$/, "").trim();
  if (!descricao || descricao.length < 2) return null;

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
  for (let i = inicioDados; i < linhas.length; i++) {
    if (REGEX_PARAR.test(linhas[i])) break;

    const item = parseLinhaServico(linhas[i], itens.length);
    if (item) itens.push(item);
  }

  if (itens.length === 0) {
    for (let i = 0; i < linhas.length; i++) {
      if (REGEX_PARAR.test(linhas[i])) break;
      const item = parseLinhaServico(linhas[i], itens.length);
      if (item) itens.push(item);
    }
  }

  return itens;
}
