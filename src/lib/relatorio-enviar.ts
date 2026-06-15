import { enviarRelatorioEmail } from "@/lib/email";
import { paraWhatsApp } from "@/lib/telefone";

const ERRO_TELEFONE_INVALIDO =
  "Telefone inválido. Use DDD + número (ex: 11 94736-6532). O código +55 do Brasil é aplicado automaticamente.";

export async function enviarRelatorioPorCanal(params: {
  tipo: string;
  destinatario?: string;
  assuntoEmail: string;
  texto: string;
}): Promise<{ status: number; body: Record<string, unknown> }> {
  const { tipo, destinatario, assuntoEmail, texto } = params;

  if (tipo === "email") {
    if (!destinatario) {
      return { status: 400, body: { error: "E-mail destinatário obrigatório" } };
    }
    const resultado = await enviarRelatorioEmail(destinatario, assuntoEmail, texto);
    return { status: resultado.ok ? 200 : 500, body: resultado };
  }

  if (tipo === "whatsapp") {
    const numero = destinatario ? paraWhatsApp(destinatario) : null;
    if (destinatario && !numero) {
      return { status: 400, body: { error: ERRO_TELEFONE_INVALIDO } };
    }
    const url = numero
      ? `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`
      : `https://wa.me/?text=${encodeURIComponent(texto)}`;
    return { status: 200, body: { ok: true, url, message: "Link WhatsApp gerado" } };
  }

  return { status: 400, body: { error: "Tipo inválido" } };
}
