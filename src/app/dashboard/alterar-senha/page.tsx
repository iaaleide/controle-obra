"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { TelefoneBrasilInput } from "@/components/ui/TelefoneBrasilInput";

export default function AlterarSenhaPage() {
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mensagemContato, setMensagemContato] = useState("");
  const [erroContato, setErroContato] = useState("");
  const [mensagemSenha, setMensagemSenha] = useState("");
  const [erroSenha, setErroSenha] = useState("");
  const [loadingContato, setLoadingContato] = useState(false);
  const [loadingSenha, setLoadingSenha] = useState(false);
  const [podeAlterarSenha, setPodeAlterarSenha] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.email) setEmail(data.email);
        if (data.telefone) setTelefone(data.telefone);
        setPodeAlterarSenha(data.perfil !== "VISITANTE");
      });
  }, []);

  async function salvarContatos(e: React.FormEvent) {
    e.preventDefault();
    setErroContato("");
    setMensagemContato("");
    setLoadingContato(true);

    try {
      const res = await fetch("/api/auth/contato", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, telefone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErroContato(data.error);
        return;
      }
      if (data.email) setEmail(data.email);
      if (data.telefone) setTelefone(data.telefone);
      setMensagemContato("Contatos salvos. Eles serão usados ao enviar relatórios.");
    } catch {
      setErroContato("Erro de conexão");
    } finally {
      setLoadingContato(false);
    }
  }

  async function alterarSenha(e: React.FormEvent) {
    e.preventDefault();
    setErroSenha("");
    setMensagemSenha("");

    if (novaSenha !== confirmar) {
      setErroSenha("As senhas não coincidem");
      return;
    }

    setLoadingSenha(true);
    try {
      const res = await fetch("/api/auth/alterar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senhaAtual, novaSenha }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErroSenha(data.error);
        return;
      }
      setMensagemSenha(data.message);
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmar("");
    } catch {
      setErroSenha("Erro de conexão");
    } finally {
      setLoadingSenha(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card title="Meus contatos">
        <p className="mb-4 text-sm text-slate-500">
          E-mail e WhatsApp usados para preencher automaticamente o envio de relatórios.
          Você pode editar na hora de enviar, se quiser mandar para outra pessoa.
        </p>
        <form onSubmit={salvarContatos} className="space-y-4">
          <Input
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
          />
          <TelefoneBrasilInput
            label="WhatsApp"
            value={telefone}
            onChange={setTelefone}
            hint="DDD + número. Ex: 11 94736-6532"
          />
          {erroContato && <p className="text-sm text-red-600">{erroContato}</p>}
          {mensagemContato && <p className="text-sm text-green-600">{mensagemContato}</p>}
          <Button type="submit" loading={loadingContato}>
            Salvar contatos
          </Button>
        </form>
      </Card>

      {podeAlterarSenha ? (
        <Card title="Alterar senha">
          <form onSubmit={alterarSenha} className="space-y-4">
            <Input
              label="Senha atual"
              type="password"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              required
            />
            <Input
              label="Nova senha"
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              minLength={4}
              required
            />
            <Input
              label="Confirmar nova senha"
              type="password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              minLength={4}
              required
            />
            {erroSenha && <p className="text-sm text-red-600">{erroSenha}</p>}
            {mensagemSenha && <p className="text-sm text-green-600">{mensagemSenha}</p>}
            <Button type="submit" loading={loadingSenha}>
              Salvar nova senha
            </Button>
          </form>
        </Card>
      ) : (
        <p className="text-center text-sm text-slate-500">
          Visitantes podem atualizar e-mail e WhatsApp acima para receber relatórios.
        </p>
      )}

      <Link
        href="/dashboard/relatorios"
        className="block text-center text-sm text-blue-600 hover:underline"
      >
        Ir para relatórios
      </Link>
    </div>
  );
}
