interface BarraProgressoProps {
  valor: number;
  rotulo?: string;
  className?: string;
}

export function BarraProgresso({ valor, rotulo, className = "" }: BarraProgressoProps) {
  const pct = Math.min(100, Math.max(0, Math.round(valor)));

  return (
    <div className={`w-full ${className}`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="mb-1.5 flex items-center justify-between gap-2 text-xs text-slate-600">
        <span>{rotulo || "Processando…"}</span>
        <span className="font-semibold tabular-nums text-slate-800">{pct}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-blue-600 transition-[width] duration-200 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
