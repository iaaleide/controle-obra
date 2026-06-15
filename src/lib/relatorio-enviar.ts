import { enviarRelatorioEmail } from "@/lib/email";
import { ERRO_TELEFONE_INVALIDO, montarUrlWhatsApp } from "@/lib/whatsapp-url";

export { ERRO_TELEFONE_INVALIDO, montarUrlWhatsApp } from "@/lib/whatsapp-url";

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
    const url = montarUrlWhatsApp(destinatario, texto);
    if (destinatario && !url) {
      return { status: 400, body: { error: ERRO_TELEFONE_INVALIDO } };
    }
    return { status: 200, body: { ok: true, url, message: "Link WhatsApp gerado" } };
  }

  return { status: 400, body: { error: "Tipo inválido" } };
}
