"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { SpeechTextarea } from "@/components/diario/SpeechTextarea";
import { lerImagemComoDataUrl } from "@/lib/imagem";
import { SelecionarImagemFoto } from "@/components/SelecionarImagemFoto";
import { useObras } from "@/hooks/useObras";
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
  const [obraId, setObraId] = useState("");
  const [data, setData] = useState(hojeISO());
  const [clienteNome, setClienteNome] = useState("");
  const [clima, setClima] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [fotos, setFotos] = useState<FotoSlot[]>(
    SLOTS.map(() => ({ imagemBase64: "", legenda: "" }))
  );
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const obra = obras.find((o) => o.id === obraId);

  useEffect(() => {
    if (obra) {
      setClienteNome(obra.clienteNome || "");
    }
  }, [obraId, obra]);

  function atualizarFoto(index: number, patch: Partial<FotoSlot>) {
    setFotos((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  async function onFile(index: number, file: File | null) {
    if (!file) return;
    const base64 = await lerImagemComoDataUrl(file);
    atualizarFoto(index, { imagemBase64: base64 });
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
                <SelecionarImagemFoto onSelect={(file) => onFile(i, file)} />
                {foto.imagemBase64 && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={foto.imagemBase64}
                    alt={`Foto ${i + 1}`}
                    className="mb-2 h-24 w-full rounded-lg object-cover"
                  />
                )}
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
                  <div className="flex h-36 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 print:h-44">
                    {foto.imagemBase64 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={foto.imagemBase64}
                        alt={`Foto ${i + 1}`}
                        className="h-full w-full rounded-lg object-cover"
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
