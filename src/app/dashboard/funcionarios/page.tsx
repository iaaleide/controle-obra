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
  obras: Obra[];
}

interface User {
  perfil: "ADMIN" | "MESTRE" | "VISITANTE";
}

export default function FuncionariosPage() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [obraFiltro, setObraFiltro] = useState("todas");
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Funcionario | null>(null);
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [telefone, setTelefone] = useState("");
  const [obraIds, setObraIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const podeCadastrar = user?.perfil === "ADMIN" || user?.perfil === "MESTRE";
  const podeEditar = user?.perfil === "ADMIN";

  async function carregar() {
    const [resUser, resObras] = await Promise.all([
      fetch("/api/auth/me"),
      fetch("/api/obras"),
    ]);
    setUser(await resUser.json());
    setObras(await resObras.json());
  }

  async function carregarFuncionarios() {
    let url = "/api/funcionarios";
    if (obraFiltro === "sem-obra") url += "?semObra=true";
    else if (obraFiltro !== "todas") url += `?obraId=${obraFiltro}`;

    const res = await fetch(url);
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
    setObraIds(f.obras.map((o) => o.id));
    setShowForm(true);
    setErro("");
  }

  function limparForm() {
    setShowForm(false);
    setEditando(null);
    setNome("");
    setCargo("");
    setTelefone("");
    setObraIds([]);
    setErro("");
  }

  function toggleObra(id: string) {
    setObraIds((prev) =>
      prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]
    );
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro("");

    const url = editando ? `/api/funcionarios/${editando.id}` : "/api/funcionarios";
    const method = editando ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, cargo, telefone, obraIds }),
    });

    if (res.ok) {
      limparForm();
      carregarFuncionarios();
    } else {
      const data = await res.json();
      setErro(data.error || "Erro ao salvar");
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <Card
        title="Funcionários"
        action={
          podeCadastrar && !showForm ? (
            <Button variant="secondary" onClick={() => setShowForm(true)}>
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
          <option value="todas">Todos os funcionários</option>
          <option value="sem-obra">Sem obra alocada</option>
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
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Obras (opcional — pode selecionar várias)
              </label>
              <div className="max-h-40 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3">
                {obras.length === 0 && (
                  <p className="text-sm text-slate-400">Nenhuma obra cadastrada</p>
                )}
                {obras.map((o) => (
                  <label key={o.id} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={obraIds.includes(o.id)}
                      onChange={() => toggleObra(o.id)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    {o.nome}
                  </label>
                ))}
              </div>
            </div>
            {erro && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{erro}</p>
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
                <p className="mt-1 text-xs text-slate-400">
                  {f.obras.length > 0
                    ? f.obras.map((o) => o.nome).join(" · ")
                    : "Sem obra alocada"}
                </p>
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
            <p className="py-8 text-center text-sm text-slate-400">
              Nenhum funcionário encontrado
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
