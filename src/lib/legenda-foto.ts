export const LEGENDA_FOTO_MAX = 500;

export function limitarLegenda(valor: string): string {
  return valor.slice(0, LEGENDA_FOTO_MAX);
}
