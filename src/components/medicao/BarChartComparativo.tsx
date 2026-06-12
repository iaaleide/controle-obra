"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatarPercentual } from "@/lib/relatorio-medicao";

interface MiniBarrasProps {
  previsto: number;
  realizado: number;
}

/** Barras horizontais mínimas — lateral do serviço (sem Recharts) */
export function MiniBarrasLateral({ previsto, realizado }: MiniBarrasProps) {
  const largura = (v: number) => `${Math.min(100, Math.max(0, v))}%`;

  return (
    <div
      className="flex w-[92px] shrink-0 flex-col justify-center gap-1.5"
      title={`% Previsto: ${formatarPercentual(previsto)} · % Realizado: ${formatarPercentual(realizado)}`}
    >
      <div className="flex items-center gap-1">
        <span className="w-6 shrink-0 text-[8px] font-medium text-blue-600">Prev</span>
        <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-sm bg-slate-200">
          <div
            className="h-full rounded-sm bg-blue-500 transition-all"
            style={{ width: largura(previsto) }}
          />
        </div>
      </div>
      <div className="flex items-center gap-1">
        <span className="w-6 shrink-0 text-[8px] font-medium text-green-600">Real</span>
        <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-sm bg-slate-200">
          <div
            className="h-full rounded-sm bg-green-500 transition-all"
            style={{ width: largura(realizado) }}
          />
        </div>
      </div>
    </div>
  );
}

interface Props {
  previsto: number;
  realizado: number;
  label?: string;
  height?: number;
  compacto?: boolean;
}

/** Gráfico horizontal % Previsto x % Realizado por atividade */
export function BarChartComparativo({
  previsto,
  realizado,
  label,
  height,
  compacto = false,
}: Props) {
  const altura = height ?? (compacto ? 44 : 72);
  const data = compacto
    ? [
        { nome: "Prev.", valor: previsto, fill: "#3b82f6" },
        { nome: "Real.", valor: realizado, fill: "#22c55e" },
      ]
    : [
        { nome: "% Previsto", valor: previsto, fill: "#3b82f6" },
        { nome: "% Realizado", valor: realizado, fill: "#22c55e" },
      ];

  return (
    <div className="w-full">
      {label && !compacto && (
        <p className="mb-1 truncate text-xs font-medium text-slate-600" title={label}>
          {label}
        </p>
      )}
      <div style={{ minHeight: altura }}>
        <ResponsiveContainer width="100%" height={altura}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{
              top: 0,
              right: compacto ? 4 : 8,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fontSize: compacto ? 7 : 9 }}
              tickFormatter={(v) => `${v}%`}
              hide={compacto}
            />
            <YAxis
              type="category"
              dataKey="nome"
              width={compacto ? 34 : 80}
              tick={{ fontSize: compacto ? 7 : 9 }}
            />
            <Tooltip formatter={(value) => formatarPercentual(Number(value ?? 0))} />
            <Bar dataKey="valor" barSize={compacto ? 8 : undefined} radius={[0, 3, 3, 0]}>
              {data.map((entry) => (
                <Cell key={entry.nome} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface ResumoTotalProps {
  previsto: number;
  realizado: number;
  height?: number;
}

/** Resumo geral em % — média ponderada, não por item */
export function BarChartResumoTotal({ previsto, realizado, height = 100 }: ResumoTotalProps) {
  const data = [
    { nome: "% Previsto (geral)", valor: previsto, fill: "#3b82f6" },
    { nome: "% Realizado (geral)", valor: realizado, fill: "#22c55e" },
  ];

  return (
    <div className="w-full" style={{ minHeight: height }}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: 10 }}
            tickFormatter={(v) => `${v}%`}
          />
          <YAxis type="category" dataKey="nome" width={120} tick={{ fontSize: 10 }} />
          <Tooltip formatter={(value) => formatarPercentual(Number(value ?? 0))} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="valor" name="Percentual" radius={[0, 4, 4, 0]}>
            {data.map((entry) => (
              <Cell key={entry.nome} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
