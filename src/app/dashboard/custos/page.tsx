"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PeriodoRelatorioSelector } from "@/components/PeriodoRelatorioSelector";
import { Download, Plus, Trash2 } from "lucide-react";
import type { RelatorioCustoSemanal } from "@/lib/custo-relatorio";
import {
  aplicarParamsPeriodo,
  fimSemanaAtual,
  inicioSemanaAtual,
  type ModoPeriodo,
  validarPeriodo,
} from "@/lib/periodo-relatorio";

interface Obra {
  id: string;
  nome: string;
}

interface Funcionario {
  id: string;
  nome: string;
  cargo: string | null;
}

interface Custo {
  id: string;
  tipo: "CARGO" | "PESSOA";
  cargo: string | null;
  funcionarioId: string | null;
  valorDiario: number;
  funcionario?: { nome: string; cargo: string | null } | null;
}

export default function CustosPage() {
  const [custos, setCustos] = useState<Custo[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [tipo, setTipo] = useState<"CARGO" | "PESSOA">("CARGO");
  const [cargo, setCargo] = useState("");
  const [funcionarioId, setFuncionarioId] = useState("");
  const [valorDiario, setValorDiario] = useState("");
  const [obraRelatorio, setObraRelatorio] = useState("");
  const [relatorio, setRelatorio] = useState<RelatorioCustoSemanal | null>(null);
  const [modoPeriodo, setModoPeriodo] = useState<ModoPeriodo>("semana");
  const [dataInicio, setDataInicio] = useState(inicioSemanaAtual);
  const [dataFim, setDataFim] = useState(fimSemanaAtual);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function carregar() {
    const [resCustos, resObras, resFunc] = await Promise.all([
      fetch("/api/custos"),
      fetch("/api/obras"),
      fetch("/api/funcionarios"),
    ]);
    if (resCustos.ok) setCustos(await resCustos.json());
    if (resObras.ok) setObras(await resObras.json());
    if (resFunc.ok) setFuncionarios(await resFunc.json());
  }

  useEffect(() => {
    carregar();
  }, []);

  async function cadastrar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro("");

    const res = await fetch("/api/custos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo,
        cargo: tipo === "CARGO" ? cargo : undefined,
        funcionarioId: tipo === "PESSOA" ? funcionarioId : undefined,
        valorDiario,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      setCargo("");
      setFuncionarioId("");
      setValorDiario("");
      carregar();
    } else {
      setErro(data.error || "Erro ao cadastrar");
    }
    setLoading(false);
  }

  async function excluir(id: string) {
    if (!window.confirm("Remover este custo?")) return;
    await fetch(`/api/custos/${id}`, { method: "DELETE" });
    carregar();
  }

  function montarParamsRelatorio(): URLSearchParams {
    const params = new URLSearchParams({ obraId: obraRelatorio });
    aplicarParamsPeriodo(params, modoPeriodo, dataInicio, dataFim);
    return params;
  }

  async function gerarRelatorio() {
    if (!obraRelatorio) return;
    const erroPeriodo = validarPeriodo(modoPeriodo, dataInicio, dataFim);
    if (erroPeriodo) {
      setErro(erroPeriodo);
      return;
    }

    setLoading(true);
    setErro("");
    const res = await fetch(`/api/custos/relatorio/semanal?${montarParamsRelatorio()}`);
    const data = await res.json();
    if (res.ok) setRelatorio(data);
    else setErro(data.error || "Erro ao gerar relatório");
    setLoading(false);
  }

  function exportarPdf() {
    if (!obraRelatorio) return;
    const erroPeriodo = validarPeriodo(modoPeriodo, dataInicio, dataFim);
    if (erroPeriodo) {
      setErro(erroPeriodo);
      return;
    }
    window.open(`/api/custos/relatorio/pdf?${montarParamsRelatorio()}`, "_blank");
  }

  const moeda = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-4">
      <Card title="Custos de funcionários">
        <p className="mb-4 text-sm text-slate-500">
          Defina valor diário por <strong>cargo</strong> ou por <strong>pessoa</strong>.
          Pessoa tem prioridade sobre cargo no relatório de custos.
        </p>

        <form onSubmit={cadastrar} className="mb-4 space-y-3 rounded-xl bg-slate-50 p-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Tipo</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as "CARGO" | "PESSOA")}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            >
              <option value="CARGO">Por cargo</option>
              <option value="PESSOA">Por pessoa</option>
            </select>
          </div>

          {tipo === "CARGO" ? (
            <Input label="Cargo" value={cargo} onChange={(e) => setCargo(e.target.value)} required />
          ) : (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Funcionário</label>
              <select
                value={funcionarioId}
                onChange={(e) => setFuncionarioId(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
              >
                <option value="">Selecione</option>
                {funcionarios.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nome}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Input
            label="Valor diário (R$)"
            type="number"
            min="0"
            step="0.01"
            value={valorDiario}
            onChange={(e) => setValorDiario(e.target.value)}
            required
          />

          {erro && <p className="text-sm text-red-600">{erro}</p>}

          <Button type="submit" loading={loading}>
            <Plus className="h-4 w-4" /> Cadastrar custo
          </Button>
        </form>

        <div className="space-y-2">
          {custos.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-xl border border-slate-100 p-3"
            >
              <div>
                <p className="font-medium text-slate-800">
                  {c.tipo === "PESSOA" ? c.funcionario?.nome : c.cargo}
                </p>
                <p className="text-xs text-slate-500">
                  {c.tipo === "PESSOA" ? "Por pessoa" : "Por cargo"} · {moeda(c.valorDiario)}/dia
                </p>
              </div>
              <button
                onClick={() => excluir(c.id)}
                className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {custos.length === 0 && (
            <p className="py-4 text-center text-sm text-slate-400">Nenhum custo cadastrado</p>
          )}
        </div>
      </Card>

      <Card title="Relatório de custos">
        <div className="mb-4 space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Obra</label>
            <select
              value={obraRelatorio}
              onChange={(e) => setObraRelatorio(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            >
              <option value="">Selecione a obra</option>
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
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={gerarRelatorio} loading={loading} disabled={!obraRelatorio}>
            {modoPeriodo === "semana" ? "Gerar relatório da semana" : "Gerar relatório do período"}
          </Button>
          {relatorio && (
            <Button variant="secondary" onClick={exportarPdf}>
              <Download className="h-4 w-4" /> Exportar PDF
            </Button>
          )}
        </div>

        {relatorio && (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-slate-600">
              <strong>{relatorio.obra}</strong> — {relatorio.periodo}
            </p>
            <p className="text-sm font-medium text-slate-800">
              Total: {moeda(relatorio.totalGeral)}
            </p>
            {relatorio.linhas.map((l) => (
              <div key={l.funcionario} className="rounded-xl bg-slate-50 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">{l.funcionario}</span>
                  <span>{moeda(l.valorTotal)}</span>
                </div>
                <p className="text-xs text-slate-500">
                  {l.diasTrabalhados} dia(s) × {moeda(l.valorDiario)}
                  {l.origemCusto === "SEM_CUSTO" && " · sem custo cadastrado"}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
