"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Plus, Pencil } from "lucide-react";

interface Obra {
  id: string;
  nome: string;
  endereco: string | null;
  descricao: string | null;
  _count: { alocacoes: number };
}

interface User {
  perfil: "ADMIN" | "MESTRE" | "VISITANTE";
}

export default function ObrasPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Obra | null>(null);
  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);

  const podeCadastrar = user?.perfil === "ADMIN" || user?.perfil === "MESTRE";
  const podeEditar = user?.perfil === "ADMIN";

  async function carregar() {
    const [resObras, resUser] = await Promise.all([
      fetch("/api/obras"),
      fetch("/api/auth/me"),
    ]);
    setObras(await resObras.json());
    setUser(await resUser.json());
  }

  useEffect(() => {
    carregar();
  }, []);

  function abrirEdicao(obra: Obra) {
    setEditando(obra);
    setNome(obra.nome);
    setEndereco(obra.endereco || "");
    setDescricao(obra.descricao || "");
    setShowForm(true);
  }

  function limparForm() {
    setShowForm(false);
    setEditando(null);
    setNome("");
    setEndereco("");
    setDescricao("");
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const url = editando ? `/api/obras/${editando.id}` : "/api/obras";
    const method = editando ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, endereco, descricao }),
    });

    if (res.ok) {
      limparForm();
      carregar();
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <Card
        title="Obras"
        action={
          podeCadastrar && !showForm ? (
            <Button variant="secondary" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" /> Nova
            </Button>
          ) : null
        }
      >
        {showForm && (
          <form onSubmit={salvar} className="mb-4 space-y-3 rounded-xl bg-slate-50 p-4">
            <Input label="Nome da obra" value={nome} onChange={(e) => setNome(e.target.value)} required />
            <Input label="Endereço" value={endereco} onChange={(e) => setEndereco(e.target.value)} />
            <Textarea label="Descrição" value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} />
            <div className="flex gap-2">
              <Button type="submit" loading={loading}>
                {editando ? "Salvar" : "Cadastrar"}
              </Button>
              <Button type="button" variant="ghost" onClick={limparForm}>
                Cancelar
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {obras.map((obra) => (
            <div
              key={obra.id}
              className="flex items-center justify-between rounded-xl border border-slate-100 p-4"
            >
              <div>
                <p className="font-medium text-slate-800">{obra.nome}</p>
                {obra.endereco && <p className="text-sm text-slate-500">{obra.endereco}</p>}
                <p className="text-xs text-slate-400">{obra._count.alocacoes} funcionário(s)</p>
              </div>
              {podeEditar && (
                <button
                  onClick={() => abrirEdicao(obra)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {obras.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-400">Nenhuma obra cadastrada</p>
          )}
        </div>
      </Card>
    </div>
  );
}
