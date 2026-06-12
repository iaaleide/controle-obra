"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { PeriodoRelatorioSelector } from "@/components/PeriodoRelatorioSelector";
import {
  BarChartComparativo,
  BarChartResumoTotal,
} from "@/components/medicao/BarChartComparativo";
import {
  calcularItemMedicao,
  calcularTotaisItens,
  formatarMoeda,
  type ItemMedicaoInput,
} from "@/lib/relatorio-medicao";
import { inicioSemanaAtual, fimSemanaAtual, type ModoPeriodo } from "@/lib/periodo-relatorio";
import type { ModoGraficoMedicao } from "@prisma/client";
import { Download, FileText, Plus, Save, Trash2 } from "lucide-react";

interface Obra {
  id: string;
  nome: string;
  clienteNome: string | null;
}

interface RelatorioSalvo {
  id: string;
  periodoInicio: string;
  periodoFim: string;
  acumuladoTotal?: number | string | null;
  observacoesGerais?: string | null;
  modoGrafico?: ModoGraficoMedicao;
  clienteNome?: string | null;
  itens: {
    item?: string | null;
    descricao: string;
    valorTotal: number | string;
    valorPrevisto: number | string;
    valorRealizado: number | string;
    mostrarNoRelatorio: boolean;
    observacao?: string | null;
  }[];
}

interface ItemLinha extends ItemMedicaoInput {
  idLocal: string;
}

function novoItem(): ItemLinha {
  return {
    idLocal: crypto.randomUUID(),
    item: "",
    descricao: "",
    valorTotal: 0,
    valorPrevisto: 0,
    valorRealizado: 0,
    mostrarNoRelatorio: true,
    observacao: "",
  };
}

export default function MedicaoPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [obraId, setObraId] = useState("");
  const [relatorioId, setRelatorioId] = useState<string | null>(null);
  const [modoPeriodo, setModoPeriodo] = useState<ModoPeriodo>("semana");
  const [dataInicio, setDataInicio] = useState(inicioSemanaAtual());
  const [dataFim, setDataFim] = useState(fimSemanaAtual());
  const [clienteNome, setClienteNome] = useState("");
  const [acumuladoTotal, setAcumuladoTotal] = useState("");
  const [observacoesGerais, setObservacoesGerais] = useState("");
  const [modoGrafico, setModoGrafico] = useState<ModoGraficoMedicao>("POR_SERVICO");
  const [itens, setItens] = useState<ItemLinha[]>([novoItem()]);
  const [salvos, setSalvos] = useState<RelatorioSalvo[]>([]);
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const obra = obras.find((o) => o.id === obraId);

  const itensCalculados = useMemo(
    () => itens.map((item) => calcularItemMedicao(item)),
    [itens]
  );

  const totais = useMemo(
    () =>
      calcularTotaisItens(
        itensCalculados.filter((i) => i.mostrarNoRelatorio !== false)
      ),
    [itensCalculados]
  );

  useEffect(() => {
    fetch("/api/obras")
      .then((r) => r.json())
      .then(setObras);
  }, []);

  useEffect(() => {
    if (obra) setClienteNome(obra.clienteNome || "");
  }, [obraId, obra]);

  useEffect(() => {
    if (!obraId) {
      setSalvos([]);
      return;
    }
    fetch(`/api/relatorios-medicao?obraId=${obraId}`)
      .then((r) => r.json())
      .then((data) => (Array.isArray(data) ? setSalvos(data) : setSalvos([])));
  }, [obraId, mensagem]);

  function atualizarItem(idLocal: string, patch: Partial<ItemLinha>) {
    setItens((prev) => prev.map((i) => (i.idLocal === idLocal ? { ...i, ...patch } : i)));
  }

  function removerItem(idLocal: string) {
    setItens((prev) => (prev.length <= 1 ? prev : prev.filter((i) => i.idLocal !== idLocal)));
  }

  function carregarRelatorio(r: RelatorioSalvo) {
    setRelatorioId(r.id);
    setDataInicio(r.periodoInicio.slice(0, 10));
    setDataFim(r.periodoFim.slice(0, 10));
    setModoPeriodo("personalizado");
    setAcumuladoTotal(r.acumuladoTotal != null ? String(r.acumuladoTotal) : "");
    setObservacoesGerais(r.observacoesGerais || "");
    setModoGrafico(r.modoGrafico || "POR_SERVICO");
    if (r.clienteNome) setClienteNome(r.clienteNome);
    setItens(
      r.itens.map((item) => ({
        idLocal: crypto.randomUUID(),
        item: item.item || "",
        descricao: item.descricao,
        valorTotal: Number(item.valorTotal),
        valorPrevisto: Number(item.valorPrevisto),
        valorRealizado: Number(item.valorRealizado),
        mostrarNoRelatorio: item.mostrarNoRelatorio,
        observacao: item.observacao || "",
      }))
    );
  }

  function novoRelatorio() {
    setRelatorioId(null);
    setItens([novoItem()]);
    setAcumuladoTotal("");
    setObservacoesGerais("");
    setModoGrafico("POR_SERVICO");
    if (obra) setClienteNome(obra.clienteNome || "");
  }

  async function salvar() {
    if (!obraId) return;
    setLoading(true);
    setMensagem("");

    const payload = {
      obraId,
      periodoInicio: dataInicio,
      periodoFim: dataFim,
      clienteNome,
      acumuladoTotal: acumuladoTotal ? parseFloat(acumuladoTotal.replace(",", ".")) : null,
      observacoesGerais,
      modoGrafico,
      itens: itensCalculados,
    };

    const url = relatorioId ? `/api/relatorios-medicao/${relatorioId}` : "/api/relatorios-medicao";
    const res = await fetch(url, {
      method: relatorioId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    if (res.ok) {
      setRelatorioId(result.id);
      setMensagem("Relatório salvo!");
    } else {
      setMensagem(result.error || "Erro ao salvar");
    }
    setLoading(false);
  }

  async function importarArquivo(file: File) {
    const formData = new FormData();
    formData.append("arquivo", file);
    const res = await fetch("/api/relatorios-medicao/importar", { method: "POST", body: formData });
    const result = await res.json();
    if (res.ok && result.itens) {
      setItens(
        result.itens.map((item: ItemMedicaoInput) => ({
          ...item,
          idLocal: crypto.randomUUID(),
        }))
      );
      const origem = result.origem === "pdf" ? "PDF" : "Excel";
      setMensagem(`${result.itens.length} item(ns) importado(s) do ${origem}`);
    } else {
      setMensagem(result.error || "Erro na importação");
    }
  }

  function exportarPdf() {
    if (!relatorioId) {
      setMensagem("Salve o relatório antes de exportar o PDF");
      return;
    }
    window.open(`/api/relatorios-medicao/${relatorioId}/pdf`, "_blank");
  }

  const itensGrafico = itensCalculados.filter((i) => i.mostrarNoRelatorio !== false);

  return (
    <div className="space-y-4">
      <Card title="Relatório de Medição">
        <p className="mb-4 text-sm text-slate-500">
          Importe do Supabase, Excel ou PDF com tabela de serviços, edite e exporte com gráficos
          Previsto x Realizado.
        </p>

        <div className="mb-4 space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Obra</label>
            <select
              value={obraId}
              onChange={(e) => {
                setObraId(e.target.value);
                novoRelatorio();
              }}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            >
              <option value="">Selecione</option>
              {obras.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nome}
                </option>
              ))}
            </select>
          </div>

          <PeriodoRelatorioSelector
            modoPeriodo={modoPeriodo}
            onModoPeriodoChange={setModoPeriodo}
            dataInicio={dataInicio}
            onDataInicioChange={setDataInicio}
            dataFim={dataFim}
            onDataFimChange={setDataFim}
          />

          <Input
            label="Cliente"
            value={clienteNome}
            onChange={(e) => setClienteNome(e.target.value)}
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Gráficos no PDF
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setModoGrafico("POR_SERVICO")}
                className={`rounded-xl px-4 py-2 text-sm font-medium ${
                  modoGrafico === "POR_SERVICO"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                Por atividade + resumo total
              </button>
              <button
                type="button"
                onClick={() => setModoGrafico("CONSOLIDADO")}
                className={`rounded-xl px-4 py-2 text-sm font-medium ${
                  modoGrafico === "CONSOLIDADO"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                Somente resumo total
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Na tela: gráfico horizontal por atividade e resumo geral no final.
            </p>
          </div>

          {salvos.length > 0 && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Carregar do Supabase
              </label>
              <select
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                value={relatorioId || ""}
                onChange={(e) => {
                  const r = salvos.find((s) => s.id === e.target.value);
                  if (r) carregarRelatorio(r);
                  else novoRelatorio();
                }}
              >
                <option value="">Novo relatório</option>
                {salvos.map((s) => (
                  <option key={s.id} value={s.id}>
                    {new Date(s.periodoInicio).toLocaleDateString("pt-BR")} —{" "}
                    {new Date(s.periodoFim).toLocaleDateString("pt-BR")} ({s.itens.length} itens)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setItens((prev) => [...prev, novoItem()])}>
            <Plus className="h-4 w-4" /> Linha
          </Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            <FileText className="h-4 w-4" /> Importar Excel ou PDF
          </Button>
          <Button
            variant="secondary"
            onClick={() => window.open("/api/relatorios-medicao/exportar?modelo=1", "_blank")}
          >
            Modelo Excel
          </Button>
          {relatorioId && (
            <Button
              variant="secondary"
              onClick={() =>
                window.open(
                  `/api/relatorios-medicao/exportar?relatorioId=${relatorioId}`,
                  "_blank"
                )
              }
            >
              <Download className="h-4 w-4" /> Exportar Excel
            </Button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importarArquivo(file);
              e.target.value = "";
            }}
          />
        </div>

        <div className="space-y-4">
          {itens.map((item) => {
            const calc = calcularItemMedicao(item);
            return (
              <div
                key={item.idLocal}
                className="rounded-xl border border-slate-200 p-3 lg:grid lg:grid-cols-[1fr_220px] lg:gap-4"
              >
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  <Input
                    label="Item"
                    value={item.item || ""}
                    onChange={(e) => atualizarItem(item.idLocal, { item: e.target.value })}
                  />
                  <div className="sm:col-span-2">
                    <Input
                      label="Descrição"
                      value={item.descricao}
                      onChange={(e) => atualizarItem(item.idLocal, { descricao: e.target.value })}
                    />
                  </div>
                  <Input
                    label="Valor Total"
                    type="number"
                    step="0.01"
                    value={item.valorTotal || ""}
                    onChange={(e) =>
                      atualizarItem(item.idLocal, { valorTotal: parseFloat(e.target.value) || 0 })
                    }
                  />
                  <Input
                    label="Valor Previsto"
                    type="number"
                    step="0.01"
                    value={item.valorPrevisto || ""}
                    onChange={(e) =>
                      atualizarItem(item.idLocal, {
                        valorPrevisto: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                  <Input
                    label="Valor Realizado"
                    type="number"
                    step="0.01"
                    value={item.valorRealizado || ""}
                    onChange={(e) =>
                      atualizarItem(item.idLocal, {
                        valorRealizado: parseFloat(e.target.value) || 0,
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
                        onChange={(e) =>
                          atualizarItem(item.idLocal, { mostrarNoRelatorio: e.target.checked })
                        }
                      />
                      Mostrar no relatório
                    </label>
                    <button
                      type="button"
                      onClick={() => removerItem(item.idLocal)}
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
                      onChange={(e) =>
                        atualizarItem(item.idLocal, { observacao: e.target.value })
                      }
                    />
                  </div>
                </div>
                {item.mostrarNoRelatorio !== false && (
                  <div className="mt-3 rounded-lg bg-slate-50 p-2 lg:mt-0">
                    <BarChartComparativo
                      previsto={calc.valorPrevisto}
                      realizado={calc.valorRealizado}
                      label={item.descricao || item.item || "Serviço"}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {itensGrafico.length > 0 && (
          <div className="mt-4 rounded-xl border border-slate-200 p-4">
            <p className="mb-2 text-sm font-medium text-slate-700">
              Resumo geral — Previsto x Realizado (total)
            </p>
            <BarChartResumoTotal
              previsto={totais.valorPrevisto}
              realizado={totais.valorRealizado}
              height={120}
            />
          </div>
        )}

        <div className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-3">
          <p className="text-sm">
            <span className="text-slate-500">Total Valor Total:</span>{" "}
            <strong>{formatarMoeda(totais.valorTotal)}</strong>
          </p>
          <p className="text-sm">
            <span className="text-slate-500">Total Previsto:</span>{" "}
            <strong>{formatarMoeda(totais.valorPrevisto)}</strong>
          </p>
          <p className="text-sm">
            <span className="text-slate-500">Total Realizado:</span>{" "}
            <strong>{formatarMoeda(totais.valorRealizado)}</strong>
          </p>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Input
            label="Acumulado medido até o período"
            type="number"
            step="0.01"
            value={acumuladoTotal}
            onChange={(e) => setAcumuladoTotal(e.target.value)}
          />
          <Textarea
            label="Observações gerais"
            rows={2}
            value={observacoesGerais}
            onChange={(e) => setObservacoesGerais(e.target.value)}
          />
        </div>

        {mensagem && (
          <p className="mt-4 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">{mensagem}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={salvar} loading={loading} disabled={!obraId}>
            <Save className="h-4 w-4" /> Salvar
          </Button>
          <Button variant="secondary" onClick={exportarPdf} disabled={!relatorioId}>
            <Download className="h-4 w-4" /> Exportar PDF
          </Button>
        </div>
      </Card>
    </div>
  );
}
