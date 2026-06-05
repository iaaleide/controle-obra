"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TelefoneBrasilInput } from "@/components/ui/TelefoneBrasilInput";
import { Download, Mail } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import type { RelatorioSemanal } from "@/lib/pdf";
import { RODAPE_RELATORIO } from "@/lib/pdf";
import { temPermissao } from "@/lib/permissions";

interface Obra {
  id: string;
  nome: string;
}

interface User {
  perfil: "ADMIN" | "MESTRE" | "VISITANTE";
  email?: string | null;
  telefone?: string | null;
}

export default function RelatoriosPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [obraId, setObraId] = useState("");
  const [relatorio, setRelatorio] = useState<RelatorioSemanal | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [incluirSemPresenca, setIncluirSemPresenca] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        setUser(data);
        if (data.email) setEmail(data.email);
        if (data.telefone) setWhatsapp(data.telefone);
      });
    fetch("/api/obras")
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        setObras(data);
        if (data[0]) setObraId(data[0].id);
      });
  }, []);

  async function carregarRelatorio() {
    if (!obraId) return;
    setLoading(true);
    setMensagem("");
    try {
      const res = await fetch(
        `/api/relatorios/semanal?obraId=${obraId}&incluirSemPresenca=${incluirEfetivo}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRelatorio(data);
    } catch (e) {
      setMensagem(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }

  function exportarPdf() {
    if (!obraId) return;
    window.open(
      `/api/relatorios/pdf?obraId=${obraId}&incluirSemPresenca=${incluirEfetivo}`,
      "_blank"
    );
  }

  async function alternarIncluirSemPresenca(checked: boolean) {
    setIncluirSemPresenca(checked);
    if (!relatorio || !obraId) return;

    setMensagem("");
    setLoading(true);
    try {
      const res = await fetch(
        `/api/relatorios/semanal?obraId=${obraId}&incluirSemPresenca=${checked}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRelatorio(data);
    } catch (e) {
      setMensagem(e instanceof Error ? e.message : "Erro ao atualizar relatório");
    } finally {
      setLoading(false);
    }
  }

  async function enviarEmail() {
    if (!obraId || !email) return;
    setLoading(true);
    const res = await fetch("/api/relatorios/enviar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        obraId,
        tipo: "email",
        destinatario: email,
        incluirSemPresenca: incluirEfetivo,
      }),
    });
    const data = await res.json();
    setMensagem(data.message || data.error);
    setLoading(false);
  }

  async function enviarWhatsApp() {
    if (!obraId) return;
    const res = await fetch("/api/relatorios/enviar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        obraId,
        tipo: "whatsapp",
        destinatario: whatsapp,
        incluirSemPresenca: incluirEfetivo,
      }),
    });
    const data = await res.json();
    if (data.url) window.open(data.url, "_blank");
    setMensagem(data.message || data.error);
  }

  const podeEnviar = user ? temPermissao(user.perfil, "enviar_relatorio") : false;
  const ehVisitante = user?.perfil === "VISITANTE";
  const incluirEfetivo = ehVisitante ? false : incluirSemPresenca;

  return (
    <div className="space-y-4">
      <Card title="Relatório semanal">
        {ehVisitante && (
          <p className="mb-3 text-sm text-slate-500">
            Você só visualiza e exporta relatórios das obras liberadas para o seu perfil.
          </p>
        )}
        {obras.length === 0 ? (
          <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
            Nenhuma obra liberada para você. Peça ao administrador ou mestre de obra para
            liberar o acesso em <strong>Visitantes</strong>.
          </p>
        ) : (
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Obra</label>
            <select
              value={obraId}
              onChange={(e) => setObraId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            >
              {obras.map((o) => (
                <option key={o.id} value={o.id}>{o.nome}</option>
              ))}
            </select>
          </div>
          {!ehVisitante && (
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
              <input
                type="checkbox"
                checked={incluirSemPresenca}
                onChange={(e) => alternarIncluirSemPresenca(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300"
              />
              <span className="text-sm text-slate-600">
                <span className="font-medium text-slate-800">
                  Incluir quem não veio na semana
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  Desmarcado (padrão): só quem teve pelo menos 1 dia. Marcado: lista todos com 0 dia(s).
                </span>
              </span>
            </label>
          )}
          <Button onClick={carregarRelatorio} loading={loading} fullWidth>
            Carregar resumo da semana
          </Button>
        </div>
        )}
      </Card>

      {relatorio && (
        <Card title={`${relatorio.obra} — ${relatorio.periodo}`}>
          <p className="mb-3 text-sm text-slate-500">
            Total de presenças: <strong>{relatorio.totalPresencas}</strong>
            {(ehVisitante || !incluirSemPresenca) && (
              <span className="mt-1 block text-xs text-slate-400">
                Exibindo só quem trabalhou pelo menos 1 dia nesta semana.
              </span>
            )}
          </p>
          <div className="space-y-2">
            {relatorio.linhas.length === 0 && (
              <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">
                Nenhum funcionário com presença nesta semana.
              </p>
            )}
            {relatorio.linhas
              .filter((l) => incluirEfetivo || l.diasTrabalhados > 0)
              .map((l) => (
              <div key={l.funcionario} className="rounded-xl bg-slate-50 p-3">
                <div className="flex justify-between">
                  <span className="font-medium">{l.funcionario}</span>
                  <span className="text-blue-600 font-semibold">{l.diasTrabalhados} dia(s)</span>
                </div>
                {l.datas.length > 0 && (
                  <p className="mt-1 text-xs text-slate-500">{l.datas.join(", ")}</p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={exportarPdf}>
              <Download className="h-4 w-4" /> PDF
            </Button>
            {podeEnviar && (
              <>
                {!email && !whatsapp && (
                  <p className="w-full text-xs text-amber-700">
                    Cadastre seu e-mail e WhatsApp em{" "}
                    <Link href="/dashboard/alterar-senha" className="font-medium underline">
                      Minha conta
                    </Link>{" "}
                    para preencher automaticamente.
                  </p>
                )}
                <div className="flex w-full gap-2">
                  <Input
                    label="E-mail destino"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="secondary"
                    onClick={enviarEmail}
                    loading={loading}
                    className="mt-6 shrink-0"
                    title="Enviar por e-mail"
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                </div>
                <p className="w-full text-xs text-slate-400">
                  Preenchido com seu e-mail cadastrado. Edite para enviar a outra pessoa.
                </p>
                <div className="flex w-full items-end gap-2">
                  <TelefoneBrasilInput
                    label="WhatsApp"
                    value={whatsapp}
                    onChange={setWhatsapp}
                    className="flex-1"
                    hint="Preenchido com seu número cadastrado. Edite para enviar a outro contato."
                  />
                  <Button
                    variant="secondary"
                    onClick={enviarWhatsApp}
                    className="shrink-0 text-green-600 hover:bg-green-50 hover:text-green-700"
                    title="Enviar por WhatsApp"
                  >
                    <WhatsAppIcon className="h-5 w-5" />
                  </Button>
                </div>
              </>
            )}
          </div>

          <p className="mt-6 border-t border-slate-100 pt-4 text-center text-xs text-slate-400">
            {RODAPE_RELATORIO}
          </p>
        </Card>
      )}

      {mensagem && (
        <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">{mensagem}</p>
      )}
    </div>
  );
}
