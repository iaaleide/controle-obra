"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { PeriodoRelatorioSelector } from "@/components/PeriodoRelatorioSelector";
import { SpeechTextarea } from "@/components/diario/SpeechTextarea";
import { inicioSemanaAtual, fimSemanaAtual, hojeIso, type ModoPeriodo } from "@/lib/periodo-relatorio";
import { EnviarRelatorioContatos } from "@/components/relatorios/EnviarRelatorioContatos";
import { temPermissao } from "@/lib/permissions";
import { useObras } from "@/hooks/useObras";
import { useSessionUser } from "@/hooks/useSessionUser";
import { lerImagemComoDataUrl } from "@/lib/imagem";
import { abrirLinkExterno } from "@/lib/abrir-link";
import { baixarPdfDaUrl } from "@/lib/download-pdf";
import { Download, Plus, Save, Trash2 } from "lucide-react";
import { SelecionarImagemFoto } from "@/components/SelecionarImagemFoto";

interface FotoSlot {
  imagemBase64: string;
  legenda: string;
}

const FOTOS_POR_FOLHA = 6;

function criarSlots(quantidade: number): FotoSlot[] {
  return Array.from({ length: quantidade }, () => ({ imagemBase64: "", legenda: "" }));
}

function slotsIniciais(): FotoSlot[] {
  return criarSlots(FOTOS_POR_FOLHA);
}

function totalFolhas(totalFotos: number): number {
  return Math.max(1, Math.ceil(totalFotos / FOTOS_POR_FOLHA));
}

export default function RelatorioFotograficoPage() {
  const { obras } = useObras();
  const { user } = useSessionUser();
  const [obraId, setObraId] = useState("");
  const [relatorioId, setRelatorioId] = useState<string | null>(null);
  const [modoPeriodo, setModoPeriodo] = useState<ModoPeriodo>("personalizado");
  const [dataInicio, setDataInicio] = useState(inicioSemanaAtual());
  const [dataFim, setDataFim] = useState(fimSemanaAtual());
  const [emitidoEm, setEmitidoEm] = useState(hojeIso());
  const [clienteNome, setClienteNome] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [fotos, setFotos] = useState<FotoSlot[]>(slotsIniciais());
  const [salvos, setSalvos] = useState<
    { id: string; periodoInicio: string; periodoFim: string; fotos?: unknown[] }[]
  >([]);
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const obra = obras.find((o) => o.id === obraId);
  const fotosPreenchidas = fotos.filter((f) => f.imagemBase64);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
    if (user?.telefone) setWhatsapp(user.telefone);
  }, [user]);

  const podeEnviar = user ? temPermissao(user.perfil, "enviar_relatorio") : false;

  useEffect(() => {
    if (obra) setClienteNome(obra.clienteNome || "");
  }, [obraId, obra]);

  useEffect(() => {
    if (!obraId) {
      setSalvos([]);
      return;
    }

    const controller = new AbortController();

    fetch(`/api/relatorios-fotografico?obraId=${obraId}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSalvos(data);
        } else {
          setSalvos([]);
          setMensagem(data.error || "Erro ao listar relatórios salvos");
        }
      })
      .catch((e) => {
        if (e.name !== "AbortError") setSalvos([]);
      });

    return () => controller.abort();
  }, [obraId]);

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

  function atualizarFoto(index: number, patch: Partial<FotoSlot>) {
    setFotos((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  function adicionarFolha() {
    setFotos((prev) => [...prev, ...criarSlots(FOTOS_POR_FOLHA)]);
  }

  function excluirFolha(indiceFolha: number) {
    if (totalFolhas(fotos.length) <= 1) return;

    const inicio = indiceFolha * FOTOS_POR_FOLHA;
    const folha = fotos.slice(inicio, inicio + FOTOS_POR_FOLHA);
    const temConteudo = folha.some((f) => f.imagemBase64 || f.legenda.trim());

    if (temConteudo) {
      const ok = confirm(
        `Excluir a folha ${indiceFolha + 1}? As ${FOTOS_POR_FOLHA} fotos desta página serão removidas.`
      );
      if (!ok) return;
    }

    setFotos((prev) => [
      ...prev.slice(0, inicio),
      ...prev.slice(inicio + FOTOS_POR_FOLHA),
    ]);
  }

  async function onFile(index: number, file: File | null) {
    if (!file) return;
    const base64 = await lerImagemComoDataUrl(file);
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

      const fotosSalvas = [...(r.fotos || [])].sort(
        (a: { ordem: number }, b: { ordem: number }) => a.ordem - b.ordem
      );
      const porOrdem = new Map(
        fotosSalvas.map((f: { ordem: number; imagemBase64?: string; legenda?: string }) => [
          f.ordem,
          f,
        ])
      );
      const totalSlots = Math.max(
        FOTOS_POR_FOLHA,
        Math.ceil(fotosSalvas.length / FOTOS_POR_FOLHA) * FOTOS_POR_FOLHA
      );
      const slots = Array.from({ length: totalSlots }, (_, ordem) => {
        const f = porOrdem.get(ordem);
        return {
          imagemBase64: f?.imagemBase64 || "",
          legenda: f?.legenda || "",
        };
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

  async function persistirRelatorio(): Promise<string | null> {
    if (!obraId) return null;

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
    if (!res.ok) {
      setMensagem(result.error || "Erro ao salvar");
      return null;
    }

    setRelatorioId(result.id);
    await listarSalvos();
    return result.id as string;
  }

  async function salvar() {
    if (!obraId) return;
    setLoading(true);
    setMensagem("");
    const id = await persistirRelatorio();
    if (id) setMensagem("Relatório salvo!");
    setLoading(false);
  }

  async function exportarPdf() {
    if (!obraId) return;
    setLoading(true);
    setMensagem("");
    const id = await persistirRelatorio();
    if (id) {
      const nome = (obra?.nome || "fotografico").replace(/\s+/g, "-");
      const resultado = await baixarPdfDaUrl(
        `/api/relatorios-fotografico/${id}/pdf?emitidoEm=${encodeURIComponent(emitidoEm)}`,
        `fotografico-${nome}.pdf`
      );
      setMensagem(
        resultado.ok
          ? "PDF exportado. Relatório salvo no histórico da obra."
          : resultado.error
      );
    }
    setLoading(false);
  }

  async function enviarEmail() {
    if (!obraId || !email) return;
    setLoading(true);
    setMensagem("");
    const id = await persistirRelatorio();
    if (!id) {
      setLoading(false);
      return;
    }
    const res = await fetch("/api/relatorios-fotografico/enviar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ relatorioId: id, tipo: "email", destinatario: email }),
    });
    const data = await res.json();
    setMensagem(data.message || data.error || (res.ok ? "E-mail enviado" : "Erro ao enviar"));
    setLoading(false);
  }

  async function enviarWhatsApp() {
    if (!obraId) return;
    setLoading(true);
    setMensagem("");
    const id = await persistirRelatorio();
    if (!id) {
      setLoading(false);
      return;
    }
    const res = await fetch("/api/relatorios-fotografico/enviar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        relatorioId: id,
        tipo: "whatsapp",
        destinatario: whatsapp,
      }),
    });
    const data = await res.json();
    if (data.url) abrirLinkExterno(data.url);
    setMensagem(data.message || data.error || (data.url ? "Abrindo WhatsApp…" : "Erro ao enviar"));
    setLoading(false);
  }

  const numFolhas = totalFolhas(fotos.length);

  return (
    <div className="space-y-4">
      <Card title="Relatório Fotográfico">
        <p className="mb-4 text-sm text-slate-500">
          Selecione o período e adicione fotos em folhas de {FOTOS_POR_FOLHA}. O PDF usa cabeçalho
          compacto para caber 6 fotos por página; use &quot;Adicionar folha&quot; para incluir mais
          imagens em páginas seguintes.
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
            emitidoEm={emitidoEm}
            onEmitidoEmChange={setEmitidoEm}
          />

          <Input
            label="Cliente"
            value={clienteNome}
            onChange={(e) => setClienteNome(e.target.value)}
          />

          {obraId && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-700">Histórico da obra</p>
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

        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-slate-700">
            Fotos — {numFolhas} folha(s) · {fotosPreenchidas.length} preenchida(s)
          </p>
          <Button type="button" variant="secondary" onClick={adicionarFolha}>
            <Plus className="h-4 w-4" /> Adicionar folha
          </Button>
        </div>

        <div className="space-y-6">
          {Array.from({ length: numFolhas }, (_, folha) => (
            <div key={folha} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Folha {folha + 1} — até {FOTOS_POR_FOLHA} fotos no PDF
                </p>
                {numFolhas > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => excluirFolha(folha)}
                    className="text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Excluir folha
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {fotos
                  .slice(folha * FOTOS_POR_FOLHA, (folha + 1) * FOTOS_POR_FOLHA)
                  .map((foto, j) => {
                    const i = folha * FOTOS_POR_FOLHA + j;
                    return (
                      <div key={i} className="rounded-xl border border-slate-200 bg-white p-3">
                        <p className="mb-2 text-xs font-medium text-slate-500">Foto {i + 1}</p>
                        <SelecionarImagemFoto onSelect={(file) => onFile(i, file)} />
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
                    );
                  })}
              </div>
            </div>
          ))}
        </div>

        {obraId && (
          <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <h3 className="mb-3 text-center text-sm font-bold text-slate-800">
              Pré-visualização do cabeçalho
            </h3>
            <div className="grid gap-0.5 text-xs text-slate-700 sm:grid-cols-2">
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
          <Button variant="secondary" onClick={exportarPdf} loading={loading} disabled={!obraId}>
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

        {podeEnviar && obraId && (
          <EnviarRelatorioContatos
            email={email}
            onEmailChange={setEmail}
            whatsapp={whatsapp}
            onWhatsappChange={setWhatsapp}
            onEnviarEmail={enviarEmail}
            onEnviarWhatsApp={enviarWhatsApp}
            loading={loading}
            disabled={!obraId}
          />
        )}
      </Card>
    </div>
  );
}
