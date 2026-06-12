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

interface Props {
  previsto: number;
  realizado: number;
  label?: string;
  height?: number;
}

/** Gráfico horizontal % Previsto x % Realizado por atividade */
export function BarChartComparativo({
  previsto,
  realizado,
  label,
  height = 72,
}: Props) {
  const data = [
    { nome: "% Previsto", valor: previsto, fill: "#3b82f6" },
    { nome: "% Realizado", valor: realizado, fill: "#22c55e" },
  ];

  return (
    <div className="w-full">
      {label && (
        <p className="mb-1 truncate text-xs font-medium text-slate-600" title={label}>
          {label}
        </p>
      )}
      <div style={{ minHeight: height }}>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 8, left: 4, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fontSize: 9 }}
              tickFormatter={(v) => `${v}%`}
            />
            <YAxis type="category" dataKey="nome" width={80} tick={{ fontSize: 9 }} />
            <Tooltip formatter={(value) => formatarPercentual(Number(value ?? 0))} />
            <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
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
