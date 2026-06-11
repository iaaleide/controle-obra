"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { PeriodoRelatorioSelector } from "@/components/PeriodoRelatorioSelector";
import { Download, Plus, Trash2, Wrench } from "lucide-react";
import type { RelatorioFerramentas } from "@/lib/ferramenta-relatorio";
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

interface EmprestimoAtivo {
  id: string;
  obra: { id: string; nome: string };
  dataDeixada: string;
}

interface Ferramenta {
  id: string;
  nome: string;
  descricao: string | null;
  emprestimos: EmprestimoAtivo[];
}

export default function FerramentasPage() {
  const [ferramentas, setFerramentas] = useState<Ferramenta[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [emprestarId, setEmprestarId] = useState<string | null>(null);
  const [obraId, setObraId] = useState("");
  const [dataDeixada, setDataDeixada] = useState(new Date().toISOString().slice(0, 10));
  const [obraRelatorio, setObraRelatorio] = useState("");
  const [relatorio, setRelatorio] = useState<RelatorioFerramentas | null>(null);
  const [modoPeriodo, setModoPeriodo] = useState<ModoPeriodo>("semana");
  const [dataInicio, setDataInicio] = useState(inicioSemanaAtual);
  const [dataFim, setDataFim] = useState(fimSemanaAtual);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function carregar() {
    const [resFerr, resObras] = await Promise.all([
      fetch("/api/ferramentas"),
      fetch("/api/obras"),
    ]);
    if (resFerr.ok) setFerramentas(await resFerr.json());
    if (resObras.ok) setObras(await resObras.json());
  }

  useEffect(() => {
    carregar();
  }, []);

  async function cadastrar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro("");

    const res = await fetch("/api/ferramentas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, descricao }),
    });

    const data = await res.json();
    if (res.ok) {
      setNome("");
      setDescricao("");
      carregar();
    } else {
      setErro(data.error || "Erro ao cadastrar");
    }
    setLoading(false);
  }

  async function excluir(id: string) {
    if (!window.confirm("Excluir ferramenta?")) return;
    const res = await fetch(`/api/ferramentas/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setErro(data.error || "Erro ao excluir");
    } else {
      carregar();
    }
  }

  async function confirmarEmprestimo() {
    if (!emprestarId || !obraId) return;
    setLoading(true);
    setErro("");

    const res = await fetch("/api/ferramentas/emprestimos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ferramentaId: emprestarId, obraId, dataDeixada }),
    });

    const data = await res.json();
    if (res.ok) {
      setEmprestarId(null);
      setObraId("");
      carregar();
    } else {
      setErro(data.error || "Erro ao emprestar");
    }
    setLoading(false);
  }

  async function devolver(emprestimoId: string) {
    const hoje = new Date().toISOString().slice(0, 10);
    const res = await fetch(`/api/ferramentas/emprestimos/${emprestimoId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataDevolvida: hoje }),
    });
    if (res.ok) carregar();
    else {
      const data = await res.json();
      setErro(data.error || "Erro ao devolver");
    }
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
    const res = await fetch(`/api/ferramentas/relatorio?${montarParamsRelatorio()}`);
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
    window.open(`/api/ferramentas/relatorio/pdf?${montarParamsRelatorio()}`, "_blank");
  }

  return (
    <div className="space-y-4">
      <Card title="Ferramentas">
        <form onSubmit={cadastrar} className="mb-4 space-y-3 rounded-xl bg-slate-50 p-4">
          <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
          <Input
            label="Descrição"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <Button type="submit" loading={loading}>
            <Plus className="h-4 w-4" /> Cadastrar
          </Button>
        </form>

        <div className="space-y-2">
          {ferramentas.map((f) => {
            const ativo = f.emprestimos[0];
            return (
              <div
                key={f.id}
                className="rounded-xl border border-slate-100 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-slate-400" />
                      <p className="font-medium text-slate-800">{f.nome}</p>
                      {ativo ? (
                        <Badge className="bg-amber-100 text-amber-800">Emprestada</Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800">Disponível</Badge>
                      )}
                    </div>
                    {f.descricao && (
                      <p className="mt-1 text-sm text-slate-500">{f.descricao}</p>
                    )}
                    {ativo && (
                      <p className="mt-2 text-xs text-slate-500">
                        Em {ativo.obra.nome} desde{" "}
                        {new Date(ativo.dataDeixada).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {!ativo && (
                      <Button
                        variant="secondary"
                        onClick={() => setEmprestarId(f.id)}
                        className="!px-2 !py-1 text-xs"
                      >
                        Emprestar
                      </Button>
                    )}
                    {ativo && (
                      <Button
                        variant="ghost"
                        onClick={() => devolver(ativo.id)}
                        className="!px-2 !py-1 text-xs"
                      >
                        Devolver
                      </Button>
                    )}
                    <button
                      onClick={() => excluir(f.id)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {emprestarId === f.id && (
                  <div className="mt-3 space-y-2 rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <select
                      value={obraId}
                      onChange={(e) => setObraId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    >
                      <option value="">Obra de destino</option>
                      {obras.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.nome}
                        </option>
                      ))}
                    </select>
                    <Input
                      label="Data deixada no local"
                      type="date"
                      value={dataDeixada}
                      onChange={(e) => setDataDeixada(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button onClick={confirmarEmprestimo} loading={loading} disabled={!obraId}>
                        Confirmar
                      </Button>
                      <Button variant="ghost" onClick={() => setEmprestarId(null)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {ferramentas.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-400">
              Nenhuma ferramenta cadastrada
            </p>
          )}
        </div>
      </Card>

      <Card title="Relatório de ferramentas">
        <p className="mb-4 text-sm text-slate-500">
          Empréstimos de ferramentas na obra no período selecionado (inclui as ainda em uso).
        </p>

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
            <p className="text-sm text-slate-500">
              {relatorio.linhas.length} empréstimo(s) no período
            </p>
            {relatorio.linhas.length === 0 && (
              <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">
                Nenhum empréstimo neste período.
              </p>
            )}
            {relatorio.linhas.map((l, i) => (
              <div key={`${l.ferramenta}-${l.dataDeixada}-${i}`} className="rounded-xl bg-slate-50 p-3 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="font-medium">{l.ferramenta}</span>
                  <Badge
                    className={
                      l.status === "Em uso"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-green-100 text-green-800"
                    }
                  >
                    {l.status}
                  </Badge>
                </div>
                {l.descricao && <p className="mt-1 text-xs text-slate-500">{l.descricao}</p>}
                <p className="mt-1 text-xs text-slate-500">
                  Deixada em {l.dataDeixada}
                  {l.dataDevolvida ? ` · Devolvida em ${l.dataDevolvida}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
