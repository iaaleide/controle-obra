import * as XLSX from "xlsx";
import { calcularItemMedicao, type ItemMedicaoInput } from "@/lib/relatorio-medicao";
import { mapearRegistroParaItem } from "@/lib/relatorio-import";

const COLUNAS = [
  "Item",
  "Descrição",
  "Valor Total",
  "% Previsto",
  "% Realizado",
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
      "% Previsto": item.valorPrevisto,
      "% Realizado": item.valorRealizado,
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
    .map((row, index) => mapearRegistroParaItem(row, index))
    .filter((item): item is ItemMedicaoInput => item !== null);
}

export function gerarModeloExcel(): Buffer {
  const ws = XLSX.utils.aoa_to_sheet([
    COLUNAS as unknown as string[],
    ["1", "Exemplo de serviço", 10000, 80, 45, "", "Sim"],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Medição");
  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}
