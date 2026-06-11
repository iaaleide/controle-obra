import { somenteDigitos } from "@/lib/telefone";

export function formatarCpf(valor: string): string {
  const d = somenteDigitos(valor).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function cpfValido(digitos: string): boolean {
  if (digitos.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digitos)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += Number(digitos[i]) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== Number(digitos[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += Number(digitos[i]) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  return resto === Number(digitos[10]);
}

export type DocumentoNormalizado =
  | { ok: true; valor: string | null }
  | { ok: false; error: string };

export function normalizarCpfOpcional(valor: unknown): DocumentoNormalizado {
  const bruto = typeof valor === "string" ? valor.trim() : "";
  if (!bruto) return { ok: true, valor: null };

  const digitos = somenteDigitos(bruto);
  if (digitos.length !== 11) {
    return { ok: false, error: "CPF deve ter 11 dígitos." };
  }
  if (!cpfValido(digitos)) {
    return { ok: false, error: "CPF inválido." };
  }
  return { ok: true, valor: digitos };
}

export function normalizarRgOpcional(valor: unknown): DocumentoNormalizado {
  const bruto = typeof valor === "string" ? valor.trim() : "";
  if (!bruto) return { ok: true, valor: null };
  if (bruto.length > 20) {
    return { ok: false, error: "RG muito longo (máx. 20 caracteres)." };
  }
  return { ok: true, valor: bruto };
}

export function normalizarEnderecoOpcional(valor: unknown): DocumentoNormalizado {
  const bruto = typeof valor === "string" ? valor.trim() : "";
  if (!bruto) return { ok: true, valor: null };
  if (bruto.length > 300) {
    return { ok: false, error: "Endereço muito longo (máx. 300 caracteres)." };
  }
  return { ok: true, valor: bruto };
}
