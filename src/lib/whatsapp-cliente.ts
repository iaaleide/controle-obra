import { abrirLinkExterno } from "@/lib/abrir-link";
import { ERRO_TELEFONE_INVALIDO, montarUrlWhatsApp } from "@/lib/whatsapp-url";

export function abrirWhatsAppComTexto(
  destinatario: string | undefined,
  texto: string
): { ok: true } | { ok: false; error: string } {
  const url = montarUrlWhatsApp(destinatario, texto);
  if (destinatario && !url) {
    return { ok: false, error: ERRO_TELEFONE_INVALIDO };
  }
  if (!url) {
    return { ok: false, error: "Não foi possível gerar o link do WhatsApp." };
  }
  abrirLinkExterno(url);
  return { ok: true };
}
