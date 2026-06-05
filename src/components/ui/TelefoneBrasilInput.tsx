"use client";

import {
  extrairNumeroLocal,
  formatarExibicaoLocal,
  labelPaisBrasil,
  paraArmazenamento,
} from "@/lib/telefone";

interface TelefoneBrasilInputProps {
  label?: string;
  value: string;
  onChange: (valorCompleto: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  hint?: string;
}

export function TelefoneBrasilInput({
  label,
  value,
  onChange,
  placeholder = "11 94736-6532",
  className = "",
  disabled,
  hint = "Digite DDD (2 dígitos) + número. O +55 do Brasil é adicionado automaticamente.",
}: TelefoneBrasilInputProps) {
  const exibicao = formatarExibicaoLocal(value);

  function handleChange(texto: string) {
    const local = extrairNumeroLocal(texto);
    onChange(local.length >= 10 ? paraArmazenamento(local) : local);
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <p className="block text-sm font-medium text-slate-700">{label}</p>}
      <div className="flex gap-2">
        <div
          className="flex shrink-0 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-600"
          title={labelPaisBrasil()}
        >
          🇧🇷 +55
        </div>
        <input
          type="tel"
          inputMode="numeric"
          disabled={disabled}
          value={exibicao}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
        />
      </div>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
