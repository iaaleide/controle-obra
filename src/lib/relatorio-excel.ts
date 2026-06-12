import * as XLSX from "xlsx";
import { calcularItemMedicao, parseNumero, type ItemMedicaoInput } from "@/lib/relatorio-medicao";

const COLUNAS = [
  "Item",
  "Descrição",
  "Valor Total",
  "Valor Previsto",
  "Valor Realizado",
  "Observação",
  "Mostrar no relatório",
] as const;

export function exportarItensExcel(itens: ItemMedicaoInput[]): Buffer {
  const linhas = itens.map((item) => {
    const calc = calcularItemMedicao(item);
    return {
      Item: item.item || "",
      Descrição: item.descricao,
      "Valor Total": item.valorTotal,
      "Valor Previsto": item.valorPrevisto,
      "Valor Realizado": item.valorRealizado,
      "% Executado": calc.percentualExecutado,
      Observação: item.observacao || "",
      "Mostrar no relatório": item.mostrarNoRelatorio !== false ? "Sim" : "Não",
    };
  });

  const ws = XLSX.utils.json_to_sheet(linhas);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Medição");
  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}

export function importarItensExcel(buffer: Buffer | ArrayBuffer): ItemMedicaoInput[] {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  return rows
    .map((row, index) => {
      const descricao = String(row["Descrição"] || row["Descricao"] || row["descricao"] || "").trim();
      if (!descricao) return null;

      const mostrarRaw = String(
        row["Mostrar no relatório"] || row["Mostrar no relatorio"] || row["mostrar_no_relatorio"] || "Sim"
      ).toLowerCase();

      const item: ItemMedicaoInput = {
        item: String(row["Item"] || row["item"] || String(index + 1)).trim() || null,
        descricao,
        valorTotal: parseNumero(row["Valor Total"] ?? row["valor_total"]),
        valorPrevisto: parseNumero(row["Valor Previsto"] ?? row["valor_previsto"]),
        valorRealizado: parseNumero(row["Valor Realizado"] ?? row["valor_realizado"]),
        observacao: String(row["Observação"] || row["Observacao"] || row["observacao"] || "").trim() || null,
        mostrarNoRelatorio: !["nao", "não", "false", "0", "n"].includes(mostrarRaw),
      };
      return item;
    })
    .filter((item): item is ItemMedicaoInput => item !== null);
}

export function gerarModeloExcel(): Buffer {
  const ws = XLSX.utils.aoa_to_sheet([
    COLUNAS as unknown as string[],
    ["1", "Exemplo de serviço", 10000, 8000, 4000, "", "Sim"],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Medição");
  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}
