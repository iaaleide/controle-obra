"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Download, Mail, MessageCircle } from "lucide-react";
import type { RelatorioSemanal } from "@/lib/pdf";

interface Obra {
  id: string;
  nome: string;
}

interface User {
  perfil: "ADMIN" | "MESTRE" | "VISITANTE";
}

export default function RelatoriosPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [obraId, setObraId] = useState("");
  const [relatorio, setRelatorio] = useState<RelatorioSemanal | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then(setUser);
    fetch("/api/obras")
      .then((r) => r.json())
      .then((data) => {
        setObras(data);
        if (data[0]) setObraId(data[0].id);
      });
  }, []);

  async function carregarRelatorio() {
    if (!obraId) return;
    setLoading(true);
    setMensagem("");
    try {
      const res = await fetch(`/api/relatorios/semanal?obraId=${obraId}`);
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
    window.open(`/api/relatorios/pdf?obraId=${obraId}`, "_blank");
  }

  async function enviarEmail() {
    if (!obraId || !email) return;
    setLoading(true);
    const res = await fetch("/api/relatorios/enviar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ obraId, tipo: "email", destinatario: email }),
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
      body: JSON.stringify({ obraId, tipo: "whatsapp", destinatario: whatsapp }),
    });
    const data = await res.json();
    if (data.url) window.open(data.url, "_blank");
    setMensagem(data.message || data.error);
  }

  const podeEnviar = user?.perfil === "ADMIN" || user?.perfil === "MESTRE";

  return (
    <div className="space-y-4">
      <Card title="Relatório semanal">
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
          <Button onClick={carregarRelatorio} loading={loading} fullWidth>
            Carregar resumo da semana
          </Button>
        </div>
      </Card>

      {relatorio && (
        <Card title={`${relatorio.obra} — ${relatorio.periodo}`}>
          <p className="mb-3 text-sm text-slate-500">
            Total de presenças: <strong>{relatorio.totalPresencas}</strong>
          </p>
          <div className="space-y-2">
            {relatorio.linhas.map((l) => (
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
                <div className="flex w-full gap-2">
                  <Input
                    placeholder="E-mail destino"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="secondary" onClick={enviarEmail} loading={loading}>
                    <Mail className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex w-full gap-2">
                  <Input
                    placeholder="WhatsApp (opcional, só números)"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="secondary" onClick={enviarWhatsApp}>
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      {mensagem && (
        <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">{mensagem}</p>
      )}
    </div>
  );
}
