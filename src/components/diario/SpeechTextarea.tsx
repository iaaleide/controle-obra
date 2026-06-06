"use client";

import { Mic, MicOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface SpeechTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
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

export function SpeechTextarea({ label, value, onChange, rows = 2 }: SpeechTextareaProps) {
  const [ouvindo, setOuvindo] = useState(false);
  const [suportado, setSuportado] = useState(false);
  const recognitionRef = useRef<InstanceType<SpeechRecognitionCtor> | null>(null);

  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);
  onChangeRef.current = onChange;
  valueRef.current = value;

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
      onChangeRef.current(atual ? `${atual} ${texto}` : texto);
    };
    rec.onerror = () => setOuvindo(false);
    rec.onend = () => setOuvindo(false);
    recognitionRef.current = rec;
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
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">{label}</label>
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
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
      />
    </div>
  );
}
