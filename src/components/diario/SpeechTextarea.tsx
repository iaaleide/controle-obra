"use client";

import { Mic, MicOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface SpeechTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  maxLength?: number;
}

type SpeechRecognitionCtor = new () => {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export function SpeechTextarea({
  label,
  value,
  onChange,
  rows = 2,
  maxLength,
}: SpeechTextareaProps) {
  const [ouvindo, setOuvindo] = useState(false);
  const [suportado, setSuportado] = useState(false);
  const recognitionRef = useRef<InstanceType<SpeechRecognitionCtor> | null>(null);

  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);
  const maxLengthRef = useRef(maxLength);
  onChangeRef.current = onChange;
  valueRef.current = value;
  maxLengthRef.current = maxLength;

  function aplicarLimite(texto: string): string {
    const max = maxLengthRef.current;
    if (max === undefined) return texto;
    return texto.slice(0, max);
  }

  useEffect(() => {
    const w = window as Window & {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    setSuportado(!!Ctor);
    if (!Ctor) return;

    const rec = new Ctor();
    rec.lang = "pt-BR";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (event) => {
      const texto = event.results[0][0].transcript;
      const atual = valueRef.current;
      const combinado = atual ? `${atual} ${texto}` : texto;
      onChangeRef.current(aplicarLimite(combinado));
    };
    rec.onerror = () => setOuvindo(false);
    rec.onend = () => setOuvindo(false);
    recognitionRef.current = rec;

    return () => {
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try {
        rec.stop();
      } catch {
        /* já parado */
      }
      recognitionRef.current = null;
    };
  }, []);

  function toggle() {
    if (!recognitionRef.current) return;
    if (ouvindo) {
      recognitionRef.current.stop();
      setOuvindo(false);
    } else {
      recognitionRef.current.start();
      setOuvindo(true);
    }
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <div className="flex items-center gap-2">
          {maxLength !== undefined && (
            <span className="text-xs text-slate-400">
              {value.length}/{maxLength}
            </span>
          )}
          {suportado && (
            <button
              type="button"
              onClick={toggle}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs ${
                ouvindo ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"
              }`}
            >
              {ouvindo ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
              {ouvindo ? "Parar" : "Falar"}
            </button>
          )}
        </div>
      </div>
      <textarea
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(aplicarLimite(e.target.value))}
        rows={rows}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
      />
    </div>
  );
}
