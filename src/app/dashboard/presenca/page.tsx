"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Check } from "lucide-react";

interface Obra {
  id: string;
  nome: string;
}

interface PresencaItem {
  funcionarioId: string;
  nome: string;
  cargo: string | null;
  presenca: {
    id: string;
    presente: boolean;
    observacao: string | null;
  } | null;
}

interface User {
  perfil: "ADMIN" | "MESTRE" | "VISITANTE";
}

export default function PresencaPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [obraId, setObraId] = useState("");
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);
  const [itens, setItens] = useState<PresencaItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [observacoes, setObservacoes] = useState<Record<string, string>>({});
  const [presentes, setPresentes] = useState<Record<string, boolean>>({});
  const [salvando, setSalvando] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState("");

  const podeRegistrar = user?.perfil === "ADMIN" || user?.perfil === "MESTRE";
  const somenteLeitura = user?.perfil === "VISITANTE";

  async function init() {
    const [resObras, resUser] = await Promise.all([
      fetch("/api/obras"),
      fetch("/api/auth/me"),
    ]);
    const listaObras = await resObras.json();
    setObras(listaObras);
    setUser(await resUser.json());
    if (listaObras.length > 0) setObraId(listaObras[0].id);
  }

  async function carregarPresencas() {
    if (!obraId || !data) return;
    const res = await fetch(`/api/presencas?obraId=${obraId}&data=${data}`);
    const dados: PresencaItem[] = await res.json();
    setItens(dados);

    const obs: Record<string, string> = {};
    const pres: Record<string, boolean> = {};
    dados.forEach((item) => {
      pres[item.funcionarioId] = item.presenca?.presente ?? false;
      obs[item.funcionarioId] = item.presenca?.observacao ?? "";
    });
    setPresentes(pres);
    setObservacoes(obs);
  }

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    carregarPresencas();
  }, [obraId, data]);

  async function salvarPresenca(funcionarioId: string) {
    setSalvando(funcionarioId);
    setMensagem("");

    const obs = observacoes[funcionarioId] || "";
    if (obs.length > 500) {
      setMensagem("Observação máximo 500 caracteres");
      setSalvando(null);
      return;
    }

    const res = await fetch("/api/presencas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        funcionarioId,
        obraId,
        data,
        presente: presentes[funcionarioId],
        observacao: obs,
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      setMensagem(result.error);
    } else {
      setMensagem("Presença salva!");
      carregarPresencas();
    }
    setSalvando(null);
  }

  return (
    <div className="space-y-4">
      <Card title="Controle de Presença">
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Obra</label>
            <select
              value={obraId}
              onChange={(e) => setObraId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            >
              {obras.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Data</label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
          </div>
        </div>

        {mensagem && (
          <p className="mb-3 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">{mensagem}</p>
        )}

        <div className="space-y-3">
          {itens.map((item) => (
            <div key={item.funcionarioId} className="rounded-xl border border-slate-100 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-800">{item.nome}</p>
                  {item.cargo && <p className="text-xs text-slate-500">{item.cargo}</p>}
                </div>
                <button
                  type="button"
                  disabled={somenteLeitura}
                  onClick={() =>
                    setPresentes((p) => ({
                      ...p,
                      [item.funcionarioId]: !p[item.funcionarioId],
                    }))
                  }
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 transition ${
                    presentes[item.funcionarioId]
                      ? "border-green-500 bg-green-50 text-green-600"
                      : "border-slate-200 text-slate-300"
                  } ${somenteLeitura ? "cursor-default opacity-70" : "cursor-pointer hover:border-green-300"}`}
                  aria-label="Marcar presença"
                >
                  <Check className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-3">
                <Textarea
                  label="Observação"
                  value={observacoes[item.funcionarioId] || ""}
                  onChange={(e) =>
                    setObservacoes((o) => ({
                      ...o,
                      [item.funcionarioId]: e.target.value.slice(0, 500),
                    }))
                  }
                  rows={2}
                  placeholder="Observações do dia (máx. 500 caracteres)"
                  disabled={somenteLeitura}
                />
                <p className="mt-1 text-right text-xs text-slate-400">
                  {(observacoes[item.funcionarioId] || "").length}/500
                </p>
              </div>

              {podeRegistrar && (
                <Button
                  className="mt-2"
                  variant="secondary"
                  loading={salvando === item.funcionarioId}
                  onClick={() => salvarPresenca(item.funcionarioId)}
                  fullWidth
                >
                  Salvar
                </Button>
              )}
            </div>
          ))}

          {itens.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-400">
              Nenhum funcionário cadastrado nesta obra
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
