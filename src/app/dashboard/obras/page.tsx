"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { temPermissao } from "@/lib/permissions";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import type { Perfil } from "@prisma/client";

interface Obra {
  id: string;
  nome: string;
  clienteNome: string | null;
  endereco: string | null;
  descricao: string | null;
  ativa: boolean;
  _count: { alocacoes: number };
}

interface User {
  perfil: Perfil;
}

export default function ObrasPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [mostrarInativas, setMostrarInativas] = useState(false);
  const [editando, setEditando] = useState<Obra | null>(null);
  const [nome, setNome] = useState("");
  const [clienteNome, setClienteNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);
  const [acaoId, setAcaoId] = useState<string | null>(null);
  const [erro, setErro] = useState("");

  const podeCadastrar = user ? temPermissao(user.perfil, "cadastrar_obra") : false;
  const podeEditar = user ? temPermissao(user.perfil, "editar_obra") : false;
  const podeExcluir = user ? temPermissao(user.perfil, "excluir_obra") : false;

  async function carregar() {
    const incluir = mostrarInativas && podeExcluir;
    const [resObras, resUser] = await Promise.all([
      fetch(`/api/obras${incluir ? "?incluirInativas=true" : ""}`),
      fetch("/api/auth/me"),
    ]);
    if (resObras.ok) setObras(await resObras.json());
    if (resUser.ok) setUser(await resUser.json());
  }

  useEffect(() => {
    carregar();
  }, [mostrarInativas]);

  function abrirEdicao(obra: Obra) {
    setEditando(obra);
    setNome(obra.nome);
    setClienteNome(obra.clienteNome || "");
    setEndereco(obra.endereco || "");
    setDescricao(obra.descricao || "");
    setShowForm(true);
    setErro("");
  }

  function limparForm() {
    setShowForm(false);
    setEditando(null);
    setNome("");
    setClienteNome("");
    setEndereco("");
    setDescricao("");
    setErro("");
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro("");

    const url = editando ? `/api/obras/${editando.id}` : "/api/obras";
    const method = editando ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, clienteNome, endereco, descricao }),
    });

    if (res.ok) {
      limparForm();
      carregar();
    } else {
      const data = await res.json();
      setErro(data.error || "Erro ao salvar");
    }
    setLoading(false);
  }

  async function excluir(obra: Obra, permanente = false) {
    const msg = permanente
      ? `Excluir permanentemente "${obra.nome}"? Todos os registros de presença desta obra serão apagados do banco. Esta ação não pode ser desfeita.`
      : `Excluir "${obra.nome}"? A obra sairá das listas, mas o histórico de presença será mantido.`;
    if (!window.confirm(msg)) return;

    setAcaoId(obra.id);
    setErro("");

    const res = await fetch(`/api/obras/${obra.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permanente }),
    });

    if (res.ok) {
      if (editando?.id === obra.id) limparForm();
      carregar();
    } else {
      const data = await res.json();
      setErro(data.error || "Erro ao excluir");
    }

    setAcaoId(null);
  }

  async function reativar(obra: Obra) {
    const msg = `Reativar "${obra.nome}"? A obra voltará a aparecer nas listas e poderá receber novas presenças.`;
    if (!window.confirm(msg)) return;

    setAcaoId(obra.id);
    setErro("");

    const res = await fetch(`/api/obras/${obra.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativa: true }),
    });

    if (res.ok) {
      carregar();
    } else {
      const data = await res.json();
      setErro(data.error || "Erro ao reativar");
    }

    setAcaoId(null);
  }

  const visiveis = obras.filter((o) => mostrarInativas || o.ativa);

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
        {podeExcluir && (
          <label className="mb-4 flex cursor-pointer items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={mostrarInativas}
              onChange={(e) => setMostrarInativas(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Mostrar obras excluídas
          </label>
        )}

        {showForm && (
          <form onSubmit={salvar} className="mb-4 space-y-3 rounded-xl bg-slate-50 p-4">
            <Input
              label="Nome da obra"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
            <Input
              label="Nome do cliente"
              value={clienteNome}
              onChange={(e) => setClienteNome(e.target.value)}
            />
            <Input
              label="Endereço"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
            />
            <Textarea
              label="Descrição"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={2}
            />
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

        {erro && !showForm && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{erro}</p>
        )}

        <div className="space-y-2">
          {visiveis.map((obra) => (
            <div
              key={obra.id}
              className={`flex items-center justify-between rounded-xl border p-4 ${
                obra.ativa ? "border-slate-100" : "border-red-100 bg-red-50/40"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-800">{obra.nome}</p>
                  {!obra.ativa && (
                    <Badge className="bg-red-100 text-red-700">Excluída</Badge>
                  )}
                </div>
                {obra.clienteNome && (
                  <p className="text-sm text-slate-500">Cliente: {obra.clienteNome}</p>
                )}
                {obra.endereco && <p className="text-sm text-slate-500">{obra.endereco}</p>}
                <p className="text-xs text-slate-400">
                  {obra._count.alocacoes} funcionário(s) alocado(s)
                </p>
              </div>
              {(podeEditar || podeExcluir) && (
                <div className="flex gap-1">
                  {obra.ativa && podeEditar && (
                    <button
                      onClick={() => abrirEdicao(obra)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                  {obra.ativa && podeExcluir && (
                    <button
                      onClick={() => excluir(obra)}
                      disabled={acaoId === obra.id}
                      className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  {!obra.ativa && podeExcluir && (
                    <button
                      onClick={() => reativar(obra)}
                      disabled={acaoId === obra.id}
                      className="rounded-lg p-2 text-slate-400 hover:bg-green-50 hover:text-green-600 disabled:opacity-50"
                      title="Reativar"
                    >
                      <Building2 className="h-4 w-4" />
                    </button>
                  )}
                  {!obra.ativa && podeExcluir && (
                    <button
                      onClick={() => excluir(obra, true)}
                      disabled={acaoId === obra.id}
                      className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                      title="Excluir permanentemente"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
          {visiveis.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-400">Nenhuma obra cadastrada</p>
          )}
        </div>
      </Card>
    </div>
  );
}
