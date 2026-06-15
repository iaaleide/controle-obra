"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useObras } from "@/hooks/useObras";
import { Eye } from "lucide-react";

interface Obra {
  id: string;
  nome: string;
}

interface Visitante {
  id: string;
  nome: string;
  login: string;
  obraIds: string[];
  obras: Obra[];
}

export default function VisitantesPage() {
  const { obras } = useObras();
  const [visitantes, setVisitantes] = useState<Visitante[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [obraIds, setObraIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function carregar() {
    const resVisitantes = await fetch("/api/usuarios/visitantes");
    if (resVisitantes.ok) setVisitantes(await resVisitantes.json());
  }

  useEffect(() => {
    carregar();
  }, []);

  function iniciarEdicao(v: Visitante) {
    setEditandoId(v.id);
    setObraIds(v.obraIds);
    setErro("");
    setMensagem("");
  }

  function alternarObra(id: string) {
    setObraIds((atual) =>
      atual.includes(id) ? atual.filter((o) => o !== id) : [...atual, id]
    );
  }

  async function salvar() {
    if (!editandoId) return;
    setLoading(true);
    setErro("");
    setMensagem("");

    const res = await fetch(`/api/usuarios/${editandoId}/obras`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ obraIds }),
    });
    const data = await res.json();

    if (res.ok) {
      setMensagem(data.message);
      setEditandoId(null);
      carregar();
    } else {
      setErro(data.error || "Erro ao salvar");
    }

    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <Card title="Visitantes — obras liberadas">
        <p className="mb-4 text-sm text-slate-500">
          Defina quais obras cada visitante pode consultar e exportar relatórios.
        </p>

        {mensagem && (
          <p className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            {mensagem}
          </p>
        )}
        {erro && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{erro}</p>
        )}

        <div className="space-y-2">
          {visitantes.map((v) => (
            <div key={v.id} className="rounded-xl border border-slate-100 p-3">
              {editandoId === v.id ? (
                <div className="space-y-3">
                  <p className="font-medium text-slate-800">
                    {v.nome} <span className="text-slate-400">@{v.login}</span>
                  </p>
                  <div className="space-y-2 rounded-xl bg-slate-50 p-3">
                    {obras.map((obra) => (
                      <label
                        key={obra.id}
                        className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={obraIds.includes(obra.id)}
                          onChange={() => alternarObra(obra.id)}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                        {obra.nome}
                      </label>
                    ))}
                    {obras.length === 0 && (
                      <p className="text-sm text-slate-400">Nenhuma obra cadastrada</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={salvar} loading={loading}>
                      Salvar obras
                    </Button>
                    <Button variant="secondary" onClick={() => setEditandoId(null)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Eye className="mt-0.5 h-4 w-4 text-slate-400" />
                    <div>
                      <p className="font-medium text-slate-800">{v.nome}</p>
                      <p className="text-xs text-slate-500">@{v.login}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {v.obras.length > 0
                          ? v.obras.map((o) => o.nome).join(" · ")
                          : "Nenhuma obra liberada"}
                      </p>
                    </div>
                  </div>
                  <Button variant="secondary" onClick={() => iniciarEdicao(v)}>
                    Liberar obras
                  </Button>
                </div>
              )}
            </div>
          ))}
          {visitantes.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-400">
              Nenhum visitante ativo cadastrado
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
