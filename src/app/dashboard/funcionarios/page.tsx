"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TelefoneBrasilInput } from "@/components/ui/TelefoneBrasilInput";
import { temPermissao } from "@/lib/permissions";
import { useObras } from "@/hooks/useObras";
import { useSessionUser } from "@/hooks/useSessionUser";
import { formatarCpf } from "@/lib/documento";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Perfil } from "@prisma/client";

interface Obra {
  id: string;
  nome: string;
}

interface Funcionario {
  id: string;
  nome: string;
  cargo: string | null;
  rg: string | null;
  cpf: string | null;
  endereco: string | null;
  telefone: string | null;
  obras: Obra[];
}

interface User {
  perfil: Perfil;
}

export default function FuncionariosPage() {
  const { obras } = useObras();
  const { user } = useSessionUser();
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [obraFiltro, setObraFiltro] = useState("todas");
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Funcionario | null>(null);
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [rg, setRg] = useState("");
  const [cpf, setCpf] = useState("");
  const [endereco, setEndereco] = useState("");
  const [telefone, setTelefone] = useState("");
  const [obraIds, setObraIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);
  const [erro, setErro] = useState("");

  const podeCadastrar = user ? temPermissao(user.perfil, "cadastrar_funcionario") : false;
  const podeEditar = user ? temPermissao(user.perfil, "editar_funcionario") : false;
  const podeExcluir = user ? temPermissao(user.perfil, "excluir_funcionario") : false;

  async function carregarFuncionarios() {
    let url = "/api/funcionarios";
    if (obraFiltro === "sem-obra") url += "?semObra=true";
    else if (obraFiltro !== "todas") url += `?obraId=${obraFiltro}`;

    const res = await fetch(url);
    setFuncionarios(await res.json());
  }

  useEffect(() => {
    carregarFuncionarios();
  }, [obraFiltro]);

  function abrirEdicao(f: Funcionario) {
    setEditando(f);
    setNome(f.nome);
    setCargo(f.cargo || "");
    setRg(f.rg || "");
    setCpf(f.cpf || "");
    setEndereco(f.endereco || "");
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
    setRg("");
    setCpf("");
    setEndereco("");
    setTelefone("");
    setObraIds([]);
    setErro("");
  }

  function toggleObra(id: string) {
    setObraIds((prev) =>
      prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]
    );
  }

  function handleCpfChange(valor: string) {
    setCpf(formatarCpf(valor));
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
      body: JSON.stringify({ nome, cargo, rg, cpf, endereco, telefone, obraIds }),
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

  async function excluir(f: Funcionario) {
    const msg = `Tem certeza que deseja excluir ${f.nome}? O histórico de presença será mantido.`;
    if (!window.confirm(msg)) return;

    setExcluindoId(f.id);
    setErro("");

    const res = await fetch(`/api/funcionarios/${f.id}`, { method: "DELETE" });

    if (res.ok) {
      if (editando?.id === f.id) limparForm();
      carregarFuncionarios();
    } else {
      const data = await res.json();
      setErro(data.error || "Erro ao excluir");
    }

    setExcluindoId(null);
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
            <Input label="Cargo / Função" value={cargo} onChange={(e) => setCargo(e.target.value)} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="RG" value={rg} onChange={(e) => setRg(e.target.value)} />
              <Input
                label="CPF"
                value={cpf}
                onChange={(e) => handleCpfChange(e.target.value)}
                placeholder="000.000.000-00"
                inputMode="numeric"
              />
            </div>
            <Input
              label="Endereço"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Rua, número, bairro, cidade"
            />
            <TelefoneBrasilInput
              label="Telefone"
              value={telefone}
              onChange={setTelefone}
            />
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

        {erro && !showForm && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{erro}</p>
        )}

        <div className="space-y-2">
          {funcionarios.map((f) => (
            <div
              key={f.id}
              className="flex items-start justify-between rounded-xl border border-slate-100 p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-800">{f.nome}</p>
                {f.cargo && <p className="text-sm text-slate-500">{f.cargo}</p>}
                <div className="mt-2 space-y-0.5 text-xs text-slate-500">
                  {f.cpf && <p>CPF: {f.cpf}</p>}
                  {f.rg && <p>RG: {f.rg}</p>}
                  {f.endereco && <p>Endereço: {f.endereco}</p>}
                  {f.telefone && <p>Telefone: {f.telefone}</p>}
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  {f.obras.length > 0
                    ? f.obras.map((o) => o.nome).join(" · ")
                    : "Sem obra alocada"}
                </p>
              </div>
              {(podeEditar || podeExcluir) && (
                <div className="flex shrink-0 gap-1">
                  {podeEditar && (
                    <button
                      onClick={() => abrirEdicao(f)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                  {podeExcluir && (
                    <button
                      onClick={() => excluir(f)}
                      disabled={excluindoId === f.id}
                      className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
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
