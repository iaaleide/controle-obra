"use client";

import { memo } from "react";
import { Input, Textarea } from "@/components/ui/Input";
import { MoedaBrasilInput } from "@/components/ui/MoedaBrasilInput";
import { MiniBarrasLateral } from "@/components/medicao/BarChartComparativo";
import type { ItemMedicaoCalculado, ItemMedicaoInput, OpcoesPdfMedicao } from "@/lib/relatorio-medicao";
import { Trash2 } from "lucide-react";

export type ItemLinhaMedicao = ItemMedicaoInput & { idLocal: string };

interface LinhaItemMedicaoProps {
  item: ItemLinhaMedicao;
  calc: ItemMedicaoCalculado;
  opcoesPdf: OpcoesPdfMedicao;
  onAtualizar: (idLocal: string, patch: Partial<ItemLinhaMedicao>) => void;
  onRemover: (idLocal: string) => void;
}

function LinhaItemMedicaoComponent({
  item,
  calc,
  opcoesPdf,
  onAtualizar,
  onRemover,
}: LinhaItemMedicaoProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 lg:flex-row lg:items-stretch">
      <div className="min-w-0 flex-1 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <Input
          label="Item"
          value={item.item || ""}
          onChange={(e) => onAtualizar(item.idLocal, { item: e.target.value })}
        />
        <div className="sm:col-span-2">
          <Input
            label="Descrição"
            value={item.descricao}
            onChange={(e) => onAtualizar(item.idLocal, { descricao: e.target.value })}
          />
        </div>
        <MoedaBrasilInput
          label="Valor Total"
          value={Number(item.valorTotal) || 0}
          onChange={(valor) => onAtualizar(item.idLocal, { valorTotal: valor })}
        />
        <Input
          label="% Previsto"
          type="number"
          min={0}
          max={100}
          step="0.1"
          value={item.valorPrevisto || ""}
          onChange={(e) =>
            onAtualizar(item.idLocal, {
              valorPrevisto: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)),
            })
          }
        />
        <Input
          label="% Realizado"
          type="number"
          min={0}
          max={100}
          step="0.1"
          value={item.valorRealizado || ""}
          onChange={(e) =>
            onAtualizar(item.idLocal, {
              valorRealizado: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)),
            })
          }
        />
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
            % Executado: <strong>{calc.percentualExecutado.toFixed(1)}%</strong>
          </p>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={item.mostrarNoRelatorio !== false}
              onChange={(e) => onAtualizar(item.idLocal, { mostrarNoRelatorio: e.target.checked })}
            />
            Mostrar no relatório
          </label>
          <button
            type="button"
            onClick={() => onRemover(item.idLocal)}
            className="ml-auto rounded-lg p-2 text-red-500 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <Textarea
            label="Observação"
            rows={2}
            value={item.observacao || ""}
            onChange={(e) => onAtualizar(item.idLocal, { observacao: e.target.value })}
          />
        </div>
      </div>
      {item.mostrarNoRelatorio !== false &&
        (opcoesPdf.graficoPrevisto || opcoesPdf.graficoRealizado) && (
          <div className="flex items-center justify-center border-t border-slate-100 pt-2 lg:w-[104px] lg:shrink-0 lg:border-l lg:border-t-0 lg:pl-3 lg:pt-0">
            <MiniBarrasLateral
              previsto={calc.valorPrevisto}
              realizado={calc.valorRealizado}
              mostrarPrevisto={opcoesPdf.graficoPrevisto}
              mostrarRealizado={opcoesPdf.graficoRealizado}
            />
          </div>
        )}
    </div>
  );
}

export const LinhaItemMedicao = memo(LinhaItemMedicaoComponent);
