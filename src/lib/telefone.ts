const CODIGO_PAIS_BR = "55";

export function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

/** Remove 55 se existir e retorna só DDD + número (máx. 11 dígitos). */
export function extrairNumeroLocal(valor: string): string {
  let d = somenteDigitos(valor);
  if (d.startsWith(CODIGO_PAIS_BR)) {
    d = d.slice(2);
  }
  return d.slice(0, 11);
}

/** Converte entrada local (11947366532) para formato internacional (5511947366532). */
export function paraArmazenamento(valor: string): string {
  const local = extrairNumeroLocal(valor);
  if (!local) return "";
  if (local.length < 10) return local;
  return `${CODIGO_PAIS_BR}${local}`;
}

/** Valida e retorna número no formato wa.me (5511...). */
export function paraWhatsApp(valor: string): string | null {
  const armazenado = paraArmazenamento(valor);
  if (/^55\d{10,11}$/.test(armazenado)) return armazenado;
  return null;
}

/** Formata para exibição: (11) 94736-6532 */
export function formatarExibicaoLocal(valor: string): string {
  const d = extrairNumeroLocal(valor);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function labelPaisBrasil(): string {
  return "Brasil (+55)";
}

export function validarTelefoneBrasil(valor: string): boolean {
  if (!valor) return true;
  return paraWhatsApp(valor) !== null;
}

export type TelefoneNormalizado =
  | { ok: true; valor: string | null }
  | { ok: false; error: string };

/** Aceita vazio; rejeita incompleto ou inválido. */
export function normalizarTelefoneOpcional(valor: unknown): TelefoneNormalizado {
  const bruto = typeof valor === "string" ? valor.trim() : "";
  if (!bruto) return { ok: true, valor: null };

  const local = extrairNumeroLocal(bruto);
  if (local.length < 10) {
    return {
      ok: false,
      error: "Telefone incompleto. Informe DDD + número (ex: 11 94736-6532).",
    };
  }

  const armazenado = paraArmazenamento(local);
  if (!paraWhatsApp(armazenado)) {
    return {
      ok: false,
      error:
        "Telefone inválido. Use DDD + número (ex: 11 94736-6532). O +55 do Brasil é aplicado automaticamente.",
    };
  }

  return { ok: true, valor: armazenado };
}
