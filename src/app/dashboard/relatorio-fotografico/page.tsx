"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { PeriodoRelatorioSelector } from "@/components/PeriodoRelatorioSelector";
import { SpeechTextarea } from "@/components/diario/SpeechTextarea";
import { inicioSemanaAtual, fimSemanaAtual, type ModoPeriodo } from "@/lib/periodo-relatorio";
import { Download, Save, Trash2 } from "lucide-react";

interface Obra {
  id: string;
  nome: string;
  clienteNome: string | null;
  endereco: string | null;
}

interface FotoSlot {
  imagemBase64: string;
  legenda: string;
}

const MAX_FOTOS = 6;

function slotsIniciais(): FotoSlot[] {
  return Array.from({ length: MAX_FOTOS }, () => ({ imagemBase64: "", legenda: "" }));
}

function lerImagem(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function RelatorioFotograficoPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [obraId, setObraId] = useState("");
  const [relatorioId, setRelatorioId] = useState<string | null>(null);
  const [modoPeriodo, setModoPeriodo] = useState<ModoPeriodo>("personalizado");
  const [dataInicio, setDataInicio] = useState(inicioSemanaAtual());
  const [dataFim, setDataFim] = useState(fimSemanaAtual());
  const [clienteNome, setClienteNome] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [fotos, setFotos] = useState<FotoSlot[]>(slotsIniciais());
  const [salvos, setSalvos] = useState<
    { id: string; periodoInicio: string; periodoFim: string; fotos?: unknown[] }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const obra = obras.find((o) => o.id === obraId);
  const fotosPreenchidas = fotos.filter((f) => f.imagemBase64);

  useEffect(() => {
    fetch("/api/obras")
      .then((r) => r.json())
      .then(setObras);
  }, []);

  useEffect(() => {
    if (obra) setClienteNome(obra.clienteNome || "");
  }, [obraId, obra]);

  async function listarSalvos() {
    if (!obraId) {
      setSalvos([]);
      return;
    }
    const res = await fetch(`/api/relatorios-fotografico?obraId=${obraId}`);
    const data = await res.json();
    if (!res.ok) {
      setSalvos([]);
      setMensagem(data.error || "Erro ao listar relatórios salvos");
      return;
    }
    setSalvos(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    listarSalvos();
  }, [obraId]);

  function atualizarFoto(index: number, patch: Partial<FotoSlot>) {
    setFotos((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  async function onFile(index: number, file: File | null) {
    if (!file) return;
    const base64 = await lerImagem(file);
    atualizarFoto(index, { imagemBase64: base64 });
  }

  function novoRelatorio() {
    setRelatorioId(null);
    setFotos(slotsIniciais());
    setObservacoes("");
    if (obra) setClienteNome(obra.clienteNome || "");
  }

  async function carregarRelatorio(id: string) {
    setLoading(true);
    setMensagem("");
    try {
      const res = await fetch(`/api/relatorios-fotografico/${id}`);
      const r = await res.json();
      if (!res.ok) throw new Error(r.error || "Erro ao carregar relatório");

      setRelatorioId(r.id);
      setDataInicio(r.periodoInicio.slice(0, 10));
      setDataFim(r.periodoFim.slice(0, 10));
      setClienteNome(r.clienteNome || obra?.clienteNome || "");
      setObservacoes(r.observacoesGerais || "");

      const slots = slotsIniciais();
      (r.fotos || []).forEach((f: { ordem: number; imagemBase64?: string; legenda?: string }) => {
        if (f.ordem < MAX_FOTOS) {
          slots[f.ordem] = {
            imagemBase64: f.imagemBase64 || "",
            legenda: f.legenda || "",
          };
        }
      });
      setFotos(slots);
      setMensagem("Relatório carregado.");
    } catch (e) {
      setMensagem(e instanceof Error ? e.message : "Erro ao carregar relatório");
    } finally {
      setLoading(false);
    }
  }

  async function excluirRelatorio(id: string) {
    const resumo = salvos.find((s) => s.id === id);
    const periodo = resumo
      ? `${new Date(resumo.periodoInicio).toLocaleDateString("pt-BR")} — ${new Date(resumo.periodoFim).toLocaleDateString("pt-BR")}`
      : "este relatório";

    if (
      !confirm(
        `Excluir o relatório fotográfico (${periodo})?\n\nUm backup será salvo no Supabase antes da exclusão.`
      )
    ) {
      return;
    }

    setLoading(true);
    setMensagem("");
    try {
      const res = await fetch(`/api/relatorios-fotografico/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao excluir");

      if (relatorioId === id) novoRelatorio();
      setMensagem(data.message || "Relatório excluído.");
      await listarSalvos();
    } catch (e) {
      setMensagem(e instanceof Error ? e.message : "Erro ao excluir");
    } finally {
      setLoading(false);
    }
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
      observacoesGerais: observacoes,
      fotos: fotos.map((f, ordem) => ({
        ordem,
        imagemBase64: f.imagemBase64 || undefined,
        legenda: f.legenda || undefined,
      })),
    };

    const url = relatorioId
      ? `/api/relatorios-fotografico/${relatorioId}`
      : "/api/relatorios-fotografico";

    const res = await fetch(url, {
      method: relatorioId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    if (res.ok) {
      setRelatorioId(result.id);
      setMensagem("Relatório salvo!");
      await listarSalvos();
    } else {
      setMensagem(result.error || "Erro ao salvar");
    }
    setLoading(false);
  }

  function exportarPdf() {
    if (!relatorioId) {
      setMensagem("Salve o relatório antes de exportar o PDF");
      return;
    }
    window.open(`/api/relatorios-fotografico/${relatorioId}/pdf`, "_blank");
  }

  const colsGrid =
    fotosPreenchidas.length <= 2 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2";

  return (
    <div className="space-y-4">
      <Card title="Relatório Fotográfico">
        <p className="mb-4 text-sm text-slate-500">
          Selecione o período, adicione até {MAX_FOTOS} fotos com ajuste automático no quadro e
          exporte PDF com cabeçalho padronizado.
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

          {obraId && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-700">Relatórios salvos</p>
                <Button type="button" variant="ghost" onClick={novoRelatorio} className="text-xs">
                  Novo relatório
                </Button>
              </div>
              {salvos.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhum relatório salvo para esta obra.</p>
              ) : (
                <ul className="space-y-2">
                  {salvos.map((s) => (
                    <li
                      key={s.id}
                      className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-white p-3 ${
                        relatorioId === s.id ? "border-blue-300 ring-1 ring-blue-200" : "border-slate-100"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800">
                          {new Date(s.periodoInicio).toLocaleDateString("pt-BR")} —{" "}
                          {new Date(s.periodoFim).toLocaleDateString("pt-BR")}
                        </p>
                        <p className="text-xs text-slate-500">
                          {(s.fotos || []).filter(
                            (f) => typeof f === "object" && f !== null && "imagemBase64" in f && f.imagemBase64
                          ).length}{" "}
                          foto(s)
                          {relatorioId === s.id ? " · em edição" : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => carregarRelatorio(s.id)}
                          className="text-xs"
                        >
                          Abrir
                        </Button>
                        <button
                          type="button"
                          onClick={() => excluirRelatorio(s.id)}
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                          title="Excluir relatório"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <Textarea
            label="Observações gerais"
            rows={3}
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
          />
        </div>

        <p className="mb-2 text-sm font-medium text-slate-700">Fotos (até {MAX_FOTOS})</p>
        <div className={`grid gap-4 ${colsGrid}`}>
          {fotos.map((foto, i) => (
            <div key={i} className="rounded-xl border border-slate-200 p-3">
              <p className="mb-2 text-xs font-medium text-slate-500">Foto {i + 1}</p>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => onFile(i, e.target.files?.[0] ?? null)}
                className="mb-2 w-full text-xs"
              />
              <div className="mb-2 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50">
                {foto.imagemBase64 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={foto.imagemBase64}
                    alt={`Foto ${i + 1}`}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-slate-400">Quadro {i + 1}</span>
                )}
              </div>
              <SpeechTextarea
                label="Legenda"
                value={foto.legenda}
                onChange={(v) => atualizarFoto(i, { legenda: v })}
                rows={2}
              />
            </div>
          ))}
        </div>

        {obraId && (
          <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <h3 className="mb-3 text-center text-sm font-bold text-slate-800">
              Pré-visualização do cabeçalho
            </h3>
            <div className="grid gap-1 text-sm text-slate-700 sm:grid-cols-2">
              <p>
                <strong>Obra:</strong> {obra?.nome}
              </p>
              <p>
                <strong>Cliente:</strong> {clienteNome || "—"}
              </p>
              <p>
                <strong>Endereço:</strong> {obra?.endereco || "—"}
              </p>
              <p>
                <strong>Período:</strong>{" "}
                {new Date(dataInicio + "T12:00:00").toLocaleDateString("pt-BR")} a{" "}
                {new Date(dataFim + "T12:00:00").toLocaleDateString("pt-BR")}
              </p>
            </div>
            <p className="mt-4 text-center text-xs text-slate-400">
              Software desenvolvido por Atômica Engenharia®
            </p>
          </div>
        )}

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
          {relatorioId && (
            <Button
              variant="ghost"
              onClick={() => excluirRelatorio(relatorioId)}
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" /> Excluir
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
