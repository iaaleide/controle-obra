import { validarEmail } from "@/lib/email";
import { normalizarTelefoneOpcional } from "@/lib/telefone";

export type ContatoNormalizado =
  | { ok: true; email: string | null; telefone: string | null }
  | { ok: false; error: string };

export function normalizarContatoUsuario(
  email: unknown,
  telefone: unknown
): ContatoNormalizado {
  const emailTrim = typeof email === "string" ? email.trim() : "";
  if (emailTrim && !validarEmail(emailTrim)) {
    return { ok: false, error: "E-mail inválido" };
  }

  const tel = normalizarTelefoneOpcional(telefone);
  if (!tel.ok) return tel;

  return {
    ok: true,
    email: emailTrim || null,
    telefone: tel.valor,
  };
}
