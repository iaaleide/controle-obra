import { paraWhatsApp } from "@/lib/telefone";

export const ERRO_TELEFONE_INVALIDO =
  "Telefone inválido. Use DDD + número (ex: 11 94736-6532). O código +55 do Brasil é aplicado automaticamente.";

const MAX_URL_CHARS = 2040;
const MAX_TEXTO_CHARS = 1500;

export function limitarTextoParaWhatsApp(texto: string): string {
  if (texto.length <= MAX_TEXTO_CHARS) return texto;
  return `${texto.slice(0, MAX_TEXTO_CHARS - 28)}\n\n_(texto resumido)_`;
}

export function montarUrlWhatsApp(destinatario: string | undefined, texto: string): string | null {
  if (destinatario) {
    const numero = paraWhatsApp(destinatario);
    if (!numero) return null;
    return montarUrlComLimite(`https://wa.me/${numero}?text=`, limitarTextoParaWhatsApp(texto));
  }
  return montarUrlComLimite("https://wa.me/?text=", limitarTextoParaWhatsApp(texto));
}

function montarUrlComLimite(prefixo: string, texto: string): string {
  let limite = texto.length;
  while (limite > 80) {
    const url = prefixo + encodeURIComponent(texto.slice(0, limite));
    if (url.length <= MAX_URL_CHARS) return url;
    limite = Math.floor(limite * 0.85);
  }
  return prefixo + encodeURIComponent(texto.slice(0, limite));
}
