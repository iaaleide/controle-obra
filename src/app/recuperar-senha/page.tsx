"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

function RecuperarForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [login, setLogin] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function solicitarRecuperacao(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setMensagem("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/recuperar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error);
        return;
      }
      setMensagem(data.message);
    } catch {
      setErro("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  async function redefinirSenha(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setMensagem("");

    if (novaSenha !== confirmar) {
      setErro("As senhas não coincidem");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/redefinir-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, novaSenha }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error);
        return;
      }
      setMensagem(data.message);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setErro("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  if (token) {
    return (
      <form onSubmit={redefinirSenha} className="space-y-4">
        <p className="text-sm text-slate-600">Defina sua nova senha:</p>
        <Input
          label="Nova senha"
          type="password"
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
          minLength={4}
          required
        />
        <Input
          label="Confirmar senha"
          type="password"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          minLength={4}
          required
        />
        {erro && <p className="text-sm text-red-600">{erro}</p>}
        {mensagem && <p className="text-sm text-green-600">{mensagem}</p>}
        <Button type="submit" fullWidth loading={loading}>
          Redefinir senha
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={solicitarRecuperacao} className="space-y-4">
      <p className="text-sm text-slate-600">
        Informe seu login. O link de recuperação será enviado para{" "}
        <strong>atomica.eng@gmail.com</strong> e <strong>ia.aleide@gmail.com</strong>.
      </p>
      <Input
        label="Login"
        type="text"
        value={login}
        onChange={(e) => setLogin(e.target.value)}
        required
      />
      {erro && <p className="text-sm text-red-600">{erro}</p>}
      {mensagem && <p className="text-sm text-green-600">{mensagem}</p>}
      <Button type="submit" fullWidth loading={loading}>
        Solicitar recuperação
      </Button>
    </form>
  );
}

export default function RecuperarSenhaPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-xl font-bold text-slate-800">Recuperar senha</h1>
        <Suspense fallback={<p className="text-sm text-slate-500">Carregando...</p>}>
          <RecuperarForm />
        </Suspense>
        <p className="mt-4 text-center text-sm">
          <Link href="/login" className="text-blue-600 hover:underline">
            Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  );
}
