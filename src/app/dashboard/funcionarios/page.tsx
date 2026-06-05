"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus, Pencil } from "lucide-react";

interface Obra {
  id: string;
  nome: string;
}

interface Funcionario {
  id: string;
  nome: string;
  cargo: string | null;
  telefone: string | null;
  obra: Obra;
}

interface User {
  perfil: "ADMIN" | "MESTRE" | "VISITANTE";
}

export default function FuncionariosPage() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [obraFiltro, setObraFiltro] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Funcionario | null>(null);
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [telefone, setTelefone] = useState("");
  const [obraId, setObraId] = useState("");
  const [loading, setLoading] = useState(false);

  const podeCadastrar = user?.perfil === "ADMIN" || user?.perfil === "MESTRE";
  const podeEditar = user?.perfil === "ADMIN";

  async function carregar() {
    const [resUser, resObras] = await Promise.all([
      fetch("/api/auth/me"),
      fetch("/api/obras"),
    ]);
    setUser(await resUser.json());
    const listaObras = await resObras.json();
    setObras(listaObras);
    if (!obraFiltro && listaObras.length > 0) setObraFiltro(listaObras[0].id);
  }

  async function carregarFuncionarios() {
    if (!obraFiltro) return;
    const res = await fetch(`/api/funcionarios?obraId=${obraFiltro}`);
    setFuncionarios(await res.json());
  }

  useEffect(() => {
    carregar();
  }, []);

  useEffect(() => {
    carregarFuncionarios();
  }, [obraFiltro]);

  function abrirEdicao(f: Funcionario) {
    setEditando(f);
    setNome(f.nome);
    setCargo(f.cargo || "");
    setTelefone(f.telefone || "");
    setObraId(f.obra.id);
    setShowForm(true);
  }

  function limparForm() {
    setShowForm(false);
    setEditando(null);
    setNome("");
    setCargo("");
    setTelefone("");
    setObraId(obraFiltro);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const url = editando ? `/api/funcionarios/${editando.id}` : "/api/funcionarios";
    const method = editando ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, cargo, telefone, obraId }),
    });

    if (res.ok) {
      limparForm();
      carregarFuncionarios();
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <Card
        title="Funcionários"
        action={
          podeCadastrar && !showForm ? (
            <Button
              variant="secondary"
              onClick={() => {
                setObraId(obraFiltro);
                setShowForm(true);
              }}
            >
              <Plus className="h-4 w-4" /> Novo
            </Button>
          ) : null
        }
      >
        <select
          value={obraFiltro}
          onChange={(e) => setObraFiltro(e.target.value)}
          className="mb-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
        >
          {obras.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nome}
            </option>
          ))}
        </select>

        {showForm && (
          <form onSubmit={salvar} className="mb-4 space-y-3 rounded-xl bg-slate-50 p-4">
            <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
            <Input label="Cargo" value={cargo} onChange={(e) => setCargo(e.target.value)} />
            <Input label="Telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
            {!editando && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Obra</label>
                <select
                  value={obraId}
                  onChange={(e) => setObraId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  required
                >
                  {obras.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}
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
          {funcionarios.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between rounded-xl border border-slate-100 p-4"
            >
              <div>
                <p className="font-medium text-slate-800">{f.nome}</p>
                {f.cargo && <p className="text-sm text-slate-500">{f.cargo}</p>}
              </div>
              {podeEditar && (
                <button
                  onClick={() => abrirEdicao(f)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {funcionarios.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-400">Nenhum funcionário nesta obra</p>
          )}
        </div>
      </Card>
    </div>
  );
}
