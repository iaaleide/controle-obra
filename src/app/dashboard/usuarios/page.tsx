"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { corPerfil, labelPerfil } from "@/lib/permissions";
import { formatarExibicaoLocal } from "@/lib/telefone";
import { TelefoneBrasilInput } from "@/components/ui/TelefoneBrasilInput";
import { Plus, UserCog, Trash2, UserCheck, Pencil } from "lucide-react";

interface Obra {
  id: string;
  nome: string;
}

interface Usuario {
  id: string;
  login: string;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  perfil: "ADMIN" | "MESTRE" | "VISITANTE";
  ativo: boolean;
  obrasAlocadas?: { obra: Obra }[];
}

interface SessionUser {
  id: string;
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [obraIds, setObraIds] = useState<string[]>([]);
  const [editObraIds, setEditObraIds] = useState<string[]>([]);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [mostrarInativos, setMostrarInativos] = useState(false);
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [perfil, setPerfil] = useState<"ADMIN" | "MESTRE" | "VISITANTE">("VISITANTE");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [loading, setLoading] = useState(false);
  const [acaoId, setAcaoId] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editTelefone, setEditTelefone] = useState("");
  const [editPerfil, setEditPerfil] = useState<"ADMIN" | "MESTRE" | "VISITANTE">("VISITANTE");
  const [erro, setErro] = useState("");

  function alternarObraLista(ids: string[], setIds: (v: string[]) => void, id: string) {
    setIds(ids.includes(id) ? ids.filter((o) => o !== id) : [...ids, id]);
  }

  async function carregar() {
    const [resUsuarios, resMe, resObras] = await Promise.all([
      fetch("/api/usuarios"),
      fetch("/api/auth/me"),
      fetch("/api/obras"),
    ]);
    if (resUsuarios.ok) setUsuarios(await resUsuarios.json());
    if (resMe.ok) setSessionUser(await resMe.json());
    if (resObras.ok) setObras(await resObras.json());
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login,
          senha,
          nome,
          perfil,
          email,
          telefone,
          obraIds: perfil === "VISITANTE" ? obraIds : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowForm(false);
      setLogin("");
      setSenha("");
      setNome("");
      setEmail("");
      setTelefone("");
      setObraIds([]);
      carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  async function excluir(u: Usuario) {
    const msg = `Excluir ${u.nome}? O usuário não poderá mais entrar no sistema.`;
    if (!window.confirm(msg)) return;

    setAcaoId(u.id);
    setErro("");

    const res = await fetch(`/api/usuarios/${u.id}`, { method: "DELETE" });
    if (res.ok) {
      carregar();
    } else {
      const data = await res.json();
      setErro(data.error || "Erro ao excluir");
    }

    setAcaoId(null);
  }

  function iniciarEdicao(u: Usuario) {
    setEditandoId(u.id);
    setEditNome(u.nome);
    setEditEmail(u.email || "");
    setEditTelefone(u.telefone || "");
    setEditPerfil(u.perfil);
    setEditObraIds(u.obrasAlocadas?.map((a) => a.obra.id) ?? []);
    setShowForm(false);
    setErro("");
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setErro("");
  }

  async function salvarEdicao(e: React.FormEvent) {
    e.preventDefault();
    if (!editandoId) return;

    setAcaoId(editandoId);
    setErro("");

    const res = await fetch(`/api/usuarios/${editandoId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: editNome,
        email: editEmail,
        telefone: editTelefone,
        perfil: editPerfil,
        obraIds: editPerfil === "VISITANTE" ? editObraIds : undefined,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      setEditandoId(null);
      carregar();
    } else {
      setErro(data.error || "Erro ao salvar");
    }

    setAcaoId(null);
  }

  async function reativar(u: Usuario) {
    const msg = `Incluir novamente ${u.nome}? O usuário voltará a poder entrar no sistema.`;
    if (!window.confirm(msg)) return;

    setAcaoId(u.id);
    setErro("");

    const res = await fetch(`/api/usuarios/${u.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: true }),
    });

    if (res.ok) {
      carregar();
    } else {
      const data = await res.json();
      setErro(data.error || "Erro ao reativar");
    }

    setAcaoId(null);
  }

  const visiveis = usuarios.filter((u) => mostrarInativos || u.ativo);

  return (
    <div className="space-y-4">
      <Card
        title="Usuários do sistema"
        action={
          <Button variant="secondary" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4" /> Novo
          </Button>
        }
      >
        <p className="mb-4 text-sm text-slate-500">
          Cadastre, edite contatos, exclua ou reative usuários. Para alterar seus próprios
          dados, use também <strong>Minha conta</strong> no início.
        </p>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mb-4 space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4"
          >
            <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
            <Input
              label="Login"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
            />
            <Input
              label="Senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
            <Input
              label="E-mail (opcional)"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="para envio de relatórios"
            />
            <TelefoneBrasilInput
              label="WhatsApp (opcional)"
              value={telefone}
              onChange={setTelefone}
              hint="DDD + número. Usado para preencher envio de relatórios."
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Perfil</label>
              <select
                value={perfil}
                onChange={(e) => setPerfil(e.target.value as typeof perfil)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
              >
                <option value="ADMIN">Administrador</option>
                <option value="MESTRE">Gestor</option>
                <option value="VISITANTE">Visitante</option>
              </select>
            </div>
            {perfil === "VISITANTE" && (
              <div className="space-y-2 rounded-xl bg-slate-50 p-3">
                <p className="text-sm font-medium text-slate-700">Obras liberadas</p>
                {obras.map((obra) => (
                  <label
                    key={obra.id}
                    className="flex cursor-pointer items-center gap-2 text-sm text-slate-600"
                  >
                    <input
                      type="checkbox"
                      checked={obraIds.includes(obra.id)}
                      onChange={() => alternarObraLista(obraIds, setObraIds, obra.id)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    {obra.nome}
                  </label>
                ))}
              </div>
            )}
            {erro && <p className="text-sm text-red-600">{erro}</p>}
            <Button type="submit" loading={loading}>
              Cadastrar
            </Button>
          </form>
        )}

        <label className="mb-4 flex cursor-pointer items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={mostrarInativos}
            onChange={(e) => setMostrarInativos(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          Mostrar usuários excluídos (inativos)
        </label>

        {erro && !showForm && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{erro}</p>
        )}

        <div className="space-y-2">
          {visiveis.map((u) => (
            <div
              key={u.id}
              className={`rounded-xl border p-3 ${
                u.ativo ? "border-slate-100" : "border-slate-200 bg-slate-50 opacity-80"
              }`}
            >
              {editandoId === u.id ? (
                <form onSubmit={salvarEdicao} className="space-y-3">
                  <p className="text-sm font-medium text-slate-700">
                    Editando @{u.login}
                  </p>
                  <Input
                    label="Nome"
                    value={editNome}
                    onChange={(e) => setEditNome(e.target.value)}
                    required
                  />
                  <Input
                    label="E-mail"
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="para envio de relatórios"
                  />
                  <TelefoneBrasilInput
                    label="WhatsApp"
                    value={editTelefone}
                    onChange={setEditTelefone}
                    hint="DDD + número completo, ou deixe vazio."
                  />
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Perfil
                    </label>
                    <select
                      value={editPerfil}
                      onChange={(e) => setEditPerfil(e.target.value as typeof editPerfil)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                    >
                      <option value="ADMIN">Administrador</option>
                      <option value="MESTRE">Gestor</option>
                      <option value="VISITANTE">Visitante</option>
                    </select>
                  </div>
                  {editPerfil === "VISITANTE" && (
                    <div className="space-y-2 rounded-xl bg-slate-50 p-3">
                      <p className="text-sm font-medium text-slate-700">Obras liberadas</p>
                      {obras.map((obra) => (
                        <label
                          key={obra.id}
                          className="flex cursor-pointer items-center gap-2 text-sm text-slate-600"
                        >
                          <input
                            type="checkbox"
                            checked={editObraIds.includes(obra.id)}
                            onChange={() =>
                              alternarObraLista(editObraIds, setEditObraIds, obra.id)
                            }
                            className="h-4 w-4 rounded border-slate-300"
                          />
                          {obra.nome}
                        </label>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button type="submit" loading={acaoId === u.id}>
                      Salvar
                    </Button>
                    <Button type="button" variant="secondary" onClick={cancelarEdicao}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <UserCog className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="font-medium">{u.nome}</p>
                      <p className="text-xs text-slate-500">@{u.login}</p>
                      {(u.email || u.telefone) && (
                        <p className="mt-0.5 text-xs text-slate-400">
                          {[u.email, u.telefone ? formatarExibicaoLocal(u.telefone) : null]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                      {u.perfil === "VISITANTE" && (
                        <p className="mt-0.5 text-xs text-slate-400">
                          Obras:{" "}
                          {u.obrasAlocadas && u.obrasAlocadas.length > 0
                            ? u.obrasAlocadas.map((a) => a.obra.nome).join(" · ")
                            : "nenhuma liberada"}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!u.ativo && (
                      <Badge className="bg-slate-200 text-slate-600">Inativo</Badge>
                    )}
                    <Badge className={corPerfil(u.perfil)}>{labelPerfil(u.perfil)}</Badge>
                    {u.ativo && (
                      <button
                        type="button"
                        onClick={() => iniciarEdicao(u)}
                        disabled={acaoId === u.id}
                        className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
                        title="Editar usuário"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    {u.ativo && u.id !== sessionUser?.id && (
                      <button
                        type="button"
                        onClick={() => excluir(u)}
                        disabled={acaoId === u.id}
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        title="Excluir usuário"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    {!u.ativo && (
                      <button
                        type="button"
                        onClick={() => reativar(u)}
                        disabled={acaoId === u.id}
                        className="rounded-lg p-2 text-slate-400 hover:bg-green-50 hover:text-green-600 disabled:opacity-50"
                        title="Incluir usuário novamente"
                      >
                        <UserCheck className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          {visiveis.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-400">
              Nenhum usuário encontrado
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
