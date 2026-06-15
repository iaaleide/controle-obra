"use client";

import { Input } from "@/components/ui/Input";
import {
  hojeIso,
  type ModoPeriodo,
} from "@/lib/periodo-relatorio";

interface PeriodoRelatorioSelectorProps {
  modoPeriodo: ModoPeriodo;
  onModoPeriodoChange: (modo: ModoPeriodo) => void;
  dataInicio: string;
  onDataInicioChange: (valor: string) => void;
  dataFim: string;
  onDataFimChange: (valor: string) => void;
  emitidoEm: string;
  onEmitidoEmChange: (valor: string) => void;
}

export function PeriodoRelatorioSelector({
  modoPeriodo,
  onModoPeriodoChange,
  dataInicio,
  onDataInicioChange,
  dataFim,
  onDataFimChange,
  emitidoEm,
  onEmitidoEmChange,
}: PeriodoRelatorioSelectorProps) {
  return (
    <>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Período</label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onModoPeriodoChange("semana")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              modoPeriodo === "semana"
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Semana atual
          </button>
          <button
            type="button"
            onClick={() => onModoPeriodoChange("personalizado")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              modoPeriodo === "personalizado"
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Escolher datas
          </button>
        </div>
      </div>

      {modoPeriodo === "personalizado" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Data inicial"
            type="date"
            value={dataInicio}
            max={dataFim || hojeIso()}
            onChange={(e) => onDataInicioChange(e.target.value)}
          />
          <Input
            label="Data final"
            type="date"
            value={dataFim}
            min={dataInicio}
            max={hojeIso()}
            onChange={(e) => onDataFimChange(e.target.value)}
          />
        </div>
      )}

      <Input
        label="Emitido em"
        type="date"
        value={emitidoEm}
        onChange={(e) => onEmitidoEmChange(e.target.value)}
      />
    </>
  );
}
