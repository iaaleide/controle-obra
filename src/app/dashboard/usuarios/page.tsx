"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { corPerfil, labelPerfil } from "@/lib/permissions";
import { Plus, UserCog } from "lucide-react";

interface Usuario {
  id: string;
  login: string;
  nome: string;
  perfil: "ADMIN" | "MESTRE" | "VISITANTE";
  ativo: boolean;
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [perfil, setPerfil] = useState<"ADMIN" | "MESTRE" | "VISITANTE">("VISITANTE");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function carregar() {
    const res = await fetch("/api/usuarios");
    if (res.ok) setUsuarios(await res.json());
  }

  useEffect(() => { carregar(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, senha, nome, perfil }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowForm(false);
      setLogin(""); setSenha(""); setNome("");
      carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

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
          Cadastre administradores, mestres de obra e visitantes.
        </p>

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-4 space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
            <Input label="Login" value={login} onChange={(e) => setLogin(e.target.value)} required />
            <Input label="Senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Perfil</label>
              <select
                value={perfil}
                onChange={(e) => setPerfil(e.target.value as typeof perfil)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
              >
                <option value="ADMIN">Administrador</option>
                <option value="MESTRE">Mestre de Obra</option>
                <option value="VISITANTE">Visitante</option>
              </select>
            </div>
            {erro && <p className="text-sm text-red-600">{erro}</p>}
            <Button type="submit" loading={loading}>Cadastrar</Button>
          </form>
        )}

        <div className="space-y-2">
          {usuarios.map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
              <div className="flex items-center gap-3">
                <UserCog className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="font-medium">{u.nome}</p>
                  <p className="text-xs text-slate-500">@{u.login}</p>
                </div>
              </div>
              <Badge className={corPerfil(u.perfil)}>{labelPerfil(u.perfil)}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
