"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatarMoeda } from "@/lib/relatorio-medicao";

interface Props {
  previsto: number;
  realizado: number;
  label?: string;
  height?: number;
  compacto?: boolean;
}

export function BarChartComparativo({
  previsto,
  realizado,
  label,
  height = 160,
  compacto = false,
}: Props) {
  const data = [{ nome: label || "Serviço", Previsto: previsto, Realizado: realizado }];

  return (
    <div className="w-full" style={{ minHeight: height }}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: compacto ? -20 : 0, bottom: 0 }}>
          {!compacto && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
          <XAxis dataKey="nome" tick={{ fontSize: 10 }} hide={compacto} />
          <YAxis tick={{ fontSize: 10 }} width={compacto ? 40 : 56} />
          {!compacto && (
            <Tooltip
              formatter={(value) => formatarMoeda(Number(value ?? 0))}
              contentStyle={{ fontSize: 12 }}
            />
          )}
          {!compacto && <Legend wrapperStyle={{ fontSize: 11 }} />}
          <Bar dataKey="Previsto" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Realizado" fill="#22c55e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface ConsolidadoProps {
  itens: { label: string; previsto: number; realizado: number }[];
  height?: number;
}

export function BarChartConsolidado({ itens, height = 280 }: ConsolidadoProps) {
  const data = itens.map((item) => ({
    nome: item.label.slice(0, 16),
    Previsto: item.previsto,
    Realizado: item.realizado,
  }));

  return (
    <div className="w-full" style={{ minHeight: height }}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="nome" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip formatter={(value) => formatarMoeda(Number(value ?? 0))} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="Previsto" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Realizado" fill="#22c55e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
