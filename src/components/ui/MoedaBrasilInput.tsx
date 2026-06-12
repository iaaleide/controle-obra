"use client";

import { useEffect, useState } from "react";
import { formatarMoedaDigitacao, parseMoedaBrasil } from "@/lib/relatorio-medicao";

interface MoedaBrasilInputProps {
  label?: string;
  value: number;
  onChange: (valor: number) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function MoedaBrasilInput({
  label,
  value,
  onChange,
  className = "",
  disabled,
  placeholder = "0,00",
}: MoedaBrasilInputProps) {
  const inputId = label?.toLowerCase().replace(/\s/g, "-");
  const [texto, setTexto] = useState(() => (value ? formatarMoedaDigitacao(value) : ""));
  const [focado, setFocado] = useState(false);

  useEffect(() => {
    if (!focado) {
      setTexto(value ? formatarMoedaDigitacao(value) : "");
    }
  }, [value, focado]);

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
          R$
        </span>
        <input
          id={inputId}
          type="text"
          inputMode="decimal"
          disabled={disabled}
          placeholder={placeholder}
          value={texto}
          onFocus={() => setFocado(true)}
          onBlur={() => {
            setFocado(false);
            const n = parseMoedaBrasil(texto);
            onChange(n);
            setTexto(n ? formatarMoedaDigitacao(n) : "");
          }}
          onChange={(e) => {
            setTexto(e.target.value);
            onChange(parseMoedaBrasil(e.target.value));
          }}
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
        />
      </div>
    </div>
  );
}
