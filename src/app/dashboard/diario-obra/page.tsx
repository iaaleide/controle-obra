"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { SpeechTextarea } from "@/components/diario/SpeechTextarea";
import { EnviarRelatorioContatos } from "@/components/relatorios/EnviarRelatorioContatos";
import { lerImagemComoDataUrl } from "@/lib/imagem";
import { abrirWhatsAppComTexto } from "@/lib/whatsapp-cliente";
import { textoDiarioWhatsApp } from "@/lib/diario-texto";
import { SelecionarImagemFoto } from "@/components/SelecionarImagemFoto";
import { temPermissao } from "@/lib/permissions";
import { useObras } from "@/hooks/useObras";
import { useSessionUser } from "@/hooks/useSessionUser";
import { Printer, Save } from "lucide-react";

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

const SLOTS = [0, 1, 2, 3];

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function DiarioObraPage() {
  const { obras } = useObras();
  const { user } = useSessionUser();
  const [obraId, setObraId] = useState("");
  const [data, setData] = useState(hojeISO());
  const [clienteNome, setClienteNome] = useState("");
  const [clima, setClima] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [fotos, setFotos] = useState<FotoSlot[]>(
    SLOTS.map(() => ({ imagemBase64: "", legenda: "" }))
  );
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingWhatsApp, setLoadingWhatsApp] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const obra = obras.find((o) => o.id === obraId);
  const podeEnviar = user ? temPermissao(user.perfil, "enviar_relatorio") : false;

  useEffect(() => {
    if (user?.email) setEmail(user.email);
    if (user?.telefone) setWhatsapp(user.telefone);
  }, [user]);

  useEffect(() => {
    if (obra) {
      setClienteNome(obra.clienteNome || "");
    }
  }, [obraId, obra]);

  function atualizarFoto(index: number, patch: Partial<FotoSlot>) {
    setFotos((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  async function onArquivos(inicio: number, files: File[]) {
    if (!files.length) return;
    setLoading(true);
    try {
      const limite = Math.min(files.length, fotos.length - inicio);
      const bases = await Promise.all(files.slice(0, limite).map((f) => lerImagemComoDataUrl(f)));
      setFotos((prev) => {
        const next = [...prev];
        bases.forEach((base64, j) => {
          next[inicio + j] = { ...next[inicio + j], imagemBase64: base64 };
        });
        return next;
      });
    } finally {
      setLoading(false);
    }
  }

  async function salvar() {
    if (!obraId) return;
    setLoading(true);
    setMensagem("");

    const res = await fetch("/api/diario-obra", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        obraId,
        data,
        clienteNome,
        clima,
        observacoes,
        fotos: fotos.map((f, ordem) => ({
          pagina: 0,
          ordem,
          imagemBase64: f.imagemBase64 || undefined,
          legenda: f.legenda || undefined,
        })),
      }),
    });

    const result = await res.json();
    if (res.ok) setMensagem("Diário salvo!");
    else setMensagem(result.error || "Erro ao salvar");
    setLoading(false);
  }

  function payloadEnvio() {
    return {
      obraId,
      data,
      clienteNome,
      clima,
      observacoes,
      fotos: fotos.map((f, ordem) => ({
        ordem,
        imagemBase64: f.imagemBase64 || undefined,
        legenda: f.legenda || undefined,
      })),
    };
  }

  async function enviarEmail() {
    if (!obraId || !email) return;
    setLoading(true);
    setMensagem("");
    const res = await fetch("/api/diario-obra/enviar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payloadEnvio(), tipo: "email", destinatario: email }),
    });
    const dataRes = await res.json();
    setMensagem(dataRes.message || dataRes.error || (res.ok ? "E-mail enviado" : "Erro ao enviar"));
    setLoading(false);
  }

  async function enviarWhatsApp() {
    if (!obraId || !obra) return;
    setLoadingWhatsApp(true);
    setMensagem("");
    try {
      const texto = textoDiarioWhatsApp({
        obra,
        data,
        clienteNome,
        clima,
        observacoes,
        fotos: fotos.map((f) => ({
          legenda: f.legenda,
          imagemBase64: f.imagemBase64 ? "1" : null,
        })),
      });
      const resultado = abrirWhatsAppComTexto(whatsapp, texto);
      setMensagem(resultado.ok ? "Abrindo WhatsApp…" : resultado.error);
    } catch {
      setMensagem("Não foi possível abrir o WhatsApp.");
    } finally {
      setLoadingWhatsApp(false);
    }
  }

  function imprimir() {
    window.print();
  }

  return (
    <div className="space-y-4">
      <Card title="Diário de obra">
        <p className="mb-4 text-sm text-slate-500 no-print">
          Preencha os dados, adicione até 4 fotos por folha e use fala ou texto em cada legenda.
        </p>

        <div className="no-print mb-4 space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Obra</label>
            <select
              value={obraId}
              onChange={(e) => setObraId(e.target.value)}
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
          <Input label="Data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
          <Input
            label="Nome do cliente"
            value={clienteNome}
            onChange={(e) => setClienteNome(e.target.value)}
          />
          <Input label="Clima do dia" value={clima} onChange={(e) => setClima(e.target.value)} />
          <Textarea
            label="Observações gerais"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={3}
          />

          <p className="text-sm font-medium text-slate-700">Fotos (4 por folha)</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {fotos.map((foto, i) => (
              <div key={i} className="rounded-xl border border-slate-200 p-3">
                <p className="mb-2 text-xs font-medium text-slate-500">Foto {i + 1}</p>
                <SelecionarImagemFoto
                  maxSelecao={fotos.length - i}
                  onSelect={(files) => onArquivos(i, files)}
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
                    <span className="text-xs text-slate-400">Foto {i + 1}</span>
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

          {mensagem && (
            <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">{mensagem}</p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={salvar} loading={loading} disabled={!obraId}>
              <Save className="h-4 w-4" /> Salvar
            </Button>
            <Button variant="secondary" onClick={imprimir} disabled={!obraId}>
              <Printer className="h-4 w-4" /> Imprimir
            </Button>
          </div>

          {podeEnviar && obraId && (
            <EnviarRelatorioContatos
              email={email}
              onEmailChange={setEmail}
              whatsapp={whatsapp}
              onWhatsappChange={setWhatsapp}
              onEnviarEmail={enviarEmail}
              onEnviarWhatsApp={enviarWhatsApp}
              loadingEmail={loading}
              loadingWhatsApp={loadingWhatsApp}
              disabled={!obraId}
            />
          )}
        </div>

        {/* Folha para impressão */}
        {obraId && (
          <div
            id="diario-impressao"
            className="mt-4 rounded-xl border border-slate-200 bg-white p-6 print:border-0 print:p-0"
          >
            <h2 className="mb-4 text-center text-lg font-bold text-slate-800">
              Diário de Obra
            </h2>
            <div className="mb-6 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
              <p>
                <strong>Cliente:</strong> {clienteNome || "—"}
              </p>
              <p>
                <strong>Obra:</strong> {obra?.nome}
              </p>
              <p>
                <strong>Endereço:</strong> {obra?.endereco || "—"}
              </p>
              <p>
                <strong>Data:</strong>{" "}
                {new Date(data + "T12:00:00").toLocaleDateString("pt-BR")}
              </p>
              <p>
                <strong>Clima:</strong> {clima || "—"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 print:gap-6">
              {fotos.map((foto, i) => (
                <div key={i} className="break-inside-avoid">
                  <div className="flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 print:aspect-auto print:min-h-[10rem]">
                    {foto.imagemBase64 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={foto.imagemBase64}
                        alt={`Foto ${i + 1}`}
                        className="max-h-full max-w-full object-contain print:max-h-44"
                      />
                    ) : (
                      <span className="text-xs text-slate-400">Foto {i + 1}</span>
                    )}
                  </div>
                  <p className="mt-2 min-h-[2.5rem] text-xs text-slate-600">
                    {foto.legenda || " "}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-slate-200 pt-4">
              <p className="text-sm font-medium text-slate-700">Observações</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                {observacoes || "—"}
              </p>
            </div>

            <p className="mt-8 text-center text-xs text-slate-400">
              Software desenvolvido por Atômica Engenharia®
            </p>
          </div>
        )}
      </Card>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #diario-impressao,
          #diario-impressao * {
            visibility: visible;
          }
          #diario-impressao {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
          header,
          nav,
          footer {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
