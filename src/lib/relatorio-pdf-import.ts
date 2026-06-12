import { extractText, getDocumentProxy } from "unpdf";
import { parseTextoPdfParaItens } from "@/lib/relatorio-import";
import type { ItemMedicaoInput } from "@/lib/relatorio-medicao";

export async function importarItensPdf(buffer: Buffer | ArrayBuffer): Promise<ItemMedicaoInput[]> {
  const bytes = buffer instanceof Buffer ? new Uint8Array(buffer) : new Uint8Array(buffer);
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });

  const texto = Array.isArray(text) ? text.join("\n") : String(text || "");
  return parseTextoPdfParaItens(texto);
}
