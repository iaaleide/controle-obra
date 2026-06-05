"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Check, ArrowLeft, User } from "lucide-react";

interface Obra {
  id: string;
  nome: string;
}

interface Funcionario {
  id: string;
  nome: string;
  cargo: string | null;
  obras: Obra[];
}

interface User {
  perfil: "ADMIN" | "MESTRE" | "VISITANTE";
}

interface PresencaRegistro {
  id: string;
  presente: boolean;
  observacao: string | null;
}

interface HistoricoItem {
  id: string;
  acao: "CRIACAO" | "ALTERACAO";
  presente: boolean;
  observacao: string | null;
  obraNome: string;
  presenteAnterior: boolean | null;
  observacaoAnterior: string | null;
  obraAnteriorNome: string | null;
  usuarioNome: string;
  usuarioPerfil: string;
  criadoEm: string;
}

type Passo = "funcionario" | "obra" | "alocar" | "presenca";

export default function PresencaPage() {
  const [passo, setPasso] = useState<Passo>("funcionario");
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [busca, setBusca] = useState("");

  const [funcionarioId, setFuncionarioId] = useState("");
  const [funcionarioNome, setFuncionarioNome] = useState("");
  const [obraId, setObraId] = useState("");
  const [obraNome, setObraNome] = useState("");
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);

  const [presente, setPresente] = useState(false);
  const [observacao, setObservacao] = useState("");
  const [confirmarAlocacao, setConfirmarAlocacao] = useState(false);

  const [presencaExistente, setPresencaExistente] = useState<PresencaRegistro | null>(null);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const podeRegistrar = user?.perfil === "ADMIN" || user?.perfil === "MESTRE";
  const somenteLeitura = user?.perfil === "VISITANTE";

  const funcionarioSelecionado = funcionarios.find((f) => f.id === funcionarioId);

  async function init() {
    const [resObras, resUser, resFunc] = await Promise.all([
      fetch("/api/obras"),
      fetch("/api/auth/me"),
      fetch("/api/funcionarios"),
    ]);
    setObras(await resObras.json());
    setUser(await resUser.json());
    setFuncionarios(await resFunc.json());
  }

  useEffect(() => {
    init();
  }, []);

  function voltarInicio() {
    setPasso("funcionario");
    setFuncionarioId("");
    setFuncionarioNome("");
    setObraId("");
    setObraNome("");
    setPresente(false);
    setObservacao("");
    setConfirmarAlocacao(false);
    setPresencaExistente(null);
    setHistorico([]);
    setMensagem("");
    setBusca("");
  }

  async function carregarHistorico(presencaId: string) {
    const res = await fetch(`/api/presencas/historico?presencaId=${presencaId}`);
    if (res.ok) {
      setHistorico(await res.json());
    } else {
      setHistorico([]);
    }
  }

  function selecionarFuncionario(f: Funcionario) {
    setFuncionarioId(f.id);
    setFuncionarioNome(f.nome);
    setPasso("obra");
    setMensagem("");
  }

  async function carregarPresenca() {
    if (!funcionarioId || !data) return;
    const res = await fetch(
      `/api/presencas?funcionarioId=${funcionarioId}&obraId=${obraId}&data=${data}`
    );
    const dados = await res.json();
    if (res.ok) {
      setPresente(dados.presenca?.presente ?? false);
      setObservacao(dados.presenca?.observacao ?? "");
      setPresencaExistente(dados.presenca ?? null);
      if (dados.presenca?.id) {
        await carregarHistorico(dados.presenca.id);
      } else {
        setHistorico([]);
      }
    }
  }

  function avancarParaPresenca() {
    if (!obraId) {
      setMensagem("Selecione uma obra");
      return;
    }
    const obra = obras.find((o) => o.id === obraId);
    setObraNome(obra?.nome || "");

    const alocado = funcionarioSelecionado?.obras.some((o) => o.id === obraId);
    if (!alocado && podeRegistrar) {
      setConfirmarAlocacao(false);
      setPasso("alocar");
      return;
    }
    if (!alocado && somenteLeitura) {
      setMensagem("Funcionário não está alocado nesta obra");
      return;
    }

    setPasso("presenca");
    carregarPresenca();
  }

  async function alocarEContinuar() {
    if (!confirmarAlocacao) return;
    setSalvando(true);
    setMensagem("");

    const res = await fetch(`/api/funcionarios/${funcionarioId}/alocar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ obraId }),
    });

    if (!res.ok) {
      const err = await res.json();
      setMensagem(err.error || "Erro ao alocar");
      setSalvando(false);
      return;
    }

    const lista = await fetch("/api/funcionarios");
    setFuncionarios(await lista.json());
    setPasso("presenca");
    setSalvando(false);
    carregarPresenca();
  }

  async function salvarPresenca() {
    if (observacao.length > 500) {
      setMensagem("Observação máximo 500 caracteres");
      return;
    }

    setSalvando(true);
    setMensagem("");

    const res = await fetch("/api/presencas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        funcionarioId,
        obraId,
        data,
        presente,
        observacao,
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      setMensagem(result.error);
    } else {
      const foiAlteracao = !!presencaExistente || result.alterado;
      setPresencaExistente({ id: result.id, presente: result.presente, observacao: result.observacao });
      await carregarHistorico(result.id);
      setMensagem(
        foiAlteracao
          ? "Presença atualizada — alteração arquivada no histórico."
          : "Presença registrada — salva no histórico."
      );
    }
    setSalvando(false);
  }

  function labelPerfilHistorico(perfil: string) {
    const labels: Record<string, string> = {
      ADMIN: "Administrador",
      MESTRE: "Mestre de Obra",
      VISITANTE: "Visitante",
    };
    return labels[perfil] ?? perfil;
  }

  function formatarHistorico(item: HistoricoItem) {
    const quando = new Date(item.criadoEm).toLocaleString("pt-BR");
    const status = item.presente ? "Presente" : "Ausente";

    if (item.acao === "CRIACAO") {
      return `${quando} — ${item.usuarioNome} (${labelPerfilHistorico(item.usuarioPerfil)}) registrou: ${status} em ${item.obraNome}`;
    }

    const anterior = item.presenteAnterior ? "Presente" : "Ausente";
    const partes = [
      `${quando} — ${item.usuarioNome} (${labelPerfilHistorico(item.usuarioPerfil)}) alterou:`,
      `presença ${anterior} → ${status}`,
    ];
    if (item.obraAnteriorNome && item.obraAnteriorNome !== item.obraNome) {
      partes.push(`obra ${item.obraAnteriorNome} → ${item.obraNome}`);
    }
    if ((item.observacaoAnterior ?? "") !== (item.observacao ?? "")) {
      partes.push("observação atualizada");
    }
    return partes.join(" · ");
  }

  const filtrados = funcionarios.filter((f) =>
    f.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Card title="Controle de Presença">
        {passo === "funcionario" && (
          <>
            <p className="mb-3 text-sm text-slate-500">1. Escolha o funcionário</p>
            <input
              type="search"
              placeholder="Buscar funcionário..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="mb-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <div className="space-y-2">
              {filtrados.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => selecionarFuncionario(f)}
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-100 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{f.nome}</p>
                    {f.cargo && <p className="text-xs text-slate-500">{f.cargo}</p>}
                    <p className="mt-0.5 text-xs text-slate-400">
                      {f.obras.length > 0
                        ? f.obras.map((o) => o.nome).join(" · ")
                        : "Sem obra alocada"}
                    </p>
                  </div>
                </button>
              ))}
              {filtrados.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-400">
                  Nenhum funcionário encontrado
                </p>
              )}
            </div>
          </>
        )}

        {passo === "obra" && (
          <>
            <button
              type="button"
              onClick={voltarInicio}
              className="mb-3 flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
            <p className="mb-1 text-sm font-medium text-slate-800">{funcionarioNome}</p>
            <p className="mb-4 text-sm text-slate-500">2. Escolha a obra e a data</p>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Obra</label>
                <select
                  value={obraId}
                  onChange={(e) => setObraId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                >
                  <option value="">Selecione a obra...</option>
                  {obras.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Data</label>
                <input
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                />
              </div>
              {mensagem && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{mensagem}</p>
              )}
              <Button onClick={avancarParaPresenca} fullWidth>
                Continuar
              </Button>
            </div>
          </>
        )}

        {passo === "alocar" && (
          <>
            <button
              type="button"
              onClick={voltarInicio}
              className="mb-3 flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar ao início
            </button>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-900">
                <strong>{funcionarioNome}</strong> não está alocado em{" "}
                <strong>{obraNome}</strong>.
              </p>
              <p className="mt-2 text-sm text-amber-800">Deseja alocar a esta obra?</p>
              <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-lg border border-amber-200 bg-white p-3">
                <button
                  type="button"
                  onClick={() => setConfirmarAlocacao((v) => !v)}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 transition ${
                    confirmarAlocacao
                      ? "border-green-500 bg-green-50 text-green-600"
                      : "border-slate-200 text-slate-300"
                  }`}
                  aria-label="Confirmar alocação"
                >
                  <Check className="h-5 w-5" />
                </button>
                <span className="text-sm font-medium text-slate-700">
                  Sim, alocar {funcionarioNome} em {obraNome}
                </span>
              </label>
              {mensagem && (
                <p className="mt-2 text-sm text-red-600">{mensagem}</p>
              )}
              <div className="mt-4 flex gap-2">
                <Button
                  onClick={alocarEContinuar}
                  disabled={!confirmarAlocacao}
                  loading={salvando}
                  fullWidth
                >
                  Alocar e registrar presença
                </Button>
              </div>
            </div>
          </>
        )}

        {passo === "presenca" && (
          <>
            <button
              type="button"
              onClick={voltarInicio}
              className="mb-3 flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              <ArrowLeft className="h-4 w-4" /> Novo registro
            </button>
            <div className="mb-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
              <p>
                <span className="font-medium text-slate-800">{funcionarioNome}</span>
              </p>
              <p>
                {obraNome} · {new Date(data + "T12:00:00").toLocaleDateString("pt-BR")}
              </p>
            </div>

            {presencaExistente && podeRegistrar && (
              <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Já existe registro nesta data. Você pode alterar — cada mudança fica arquivada.
              </p>
            )}

            {mensagem && (
              <p className="mb-3 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
                {mensagem}
              </p>
            )}

            <div className="rounded-xl border border-slate-100 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-700">Presente?</p>
                <button
                  type="button"
                  disabled={somenteLeitura}
                  onClick={() => setPresente((p) => !p)}
                  className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 transition ${
                    presente
                      ? "border-green-500 bg-green-50 text-green-600"
                      : "border-slate-200 text-slate-300"
                  } ${somenteLeitura ? "cursor-default opacity-70" : "cursor-pointer hover:border-green-300"}`}
                  aria-label="Marcar presença"
                >
                  <Check className="h-6 w-6" />
                </button>
              </div>

              <div className="mt-4">
                <Textarea
                  label="Observação"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value.slice(0, 500))}
                  rows={3}
                  placeholder="Observações do dia (máx. 500 caracteres)"
                  disabled={somenteLeitura}
                />
                <p className="mt-1 text-right text-xs text-slate-400">{observacao.length}/500</p>
              </div>

              {podeRegistrar && (
                <Button
                  className="mt-4"
                  loading={salvando}
                  onClick={salvarPresenca}
                  fullWidth
                >
                  {presencaExistente ? "Atualizar presença" : "Salvar presença"}
                </Button>
              )}
            </div>

            {historico.length > 0 && (
              <div className="mt-4 rounded-xl border border-slate-100 p-4">
                <p className="mb-3 text-sm font-medium text-slate-700">Histórico de alterações</p>
                <ul className="space-y-2">
                  {historico.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600"
                    >
                      {formatarHistorico(item)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
