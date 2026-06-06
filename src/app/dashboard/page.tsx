import Link from "next/link";
import { getSession } from "@/lib/auth";
import { temPermissao } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import {
  Building2,
  CalendarCheck,
  Camera,
  Coins,
  FileText,
  Users,
  UserRound,
  Wrench,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  type CardItem = {
    href: string;
    label: string;
    desc: string;
    icon: typeof CalendarCheck;
    show: boolean;
  };

  const cardsGerais: CardItem[] = [
    {
      href: "/dashboard/presenca",
      label: "Registrar presença",
      desc: "Marque ou corrija quem trabalhou no dia",
      icon: CalendarCheck,
      show: temPermissao(session.perfil, "cadastrar_presenca"),
    },
    {
      href: "/dashboard/funcionarios",
      label: "Funcionários",
      desc: "Ver e editar equipe da obra",
      icon: Users,
      show: temPermissao(session.perfil, "ver_funcionarios"),
    },
    {
      href: "/dashboard/obras",
      label: "Obras",
      desc: "Gerenciar obras",
      icon: Building2,
      show: temPermissao(session.perfil, "ver_obras"),
    },
    {
      href: "/dashboard/relatorios",
      label: "Relatórios",
      desc: "Consulta, PDF, e-mail e WhatsApp das obras liberadas",
      icon: FileText,
      show: temPermissao(session.perfil, "ver_relatorios"),
    },
  ].filter((c) => c.show);

  const cardsAdmin: CardItem[] = [
    {
      href: "/dashboard/custos",
      label: "Custos",
      desc: "Valor por cargo ou pessoa e relatório semanal",
      icon: Coins,
      show: temPermissao(session.perfil, "gerenciar_custos"),
    },
    {
      href: "/dashboard/diario-obra",
      label: "Diário de obra",
      desc: "Fotos, clima e impressão por obra",
      icon: Camera,
      show: temPermissao(session.perfil, "gerenciar_diario_obra"),
    },
    {
      href: "/dashboard/ferramentas",
      label: "Ferramentas",
      desc: "Cadastro e empréstimo por obra",
      icon: Wrench,
      show: temPermissao(session.perfil, "gerenciar_ferramentas"),
    },
  ].filter((c) => c.show);

  function renderCards(cards: CardItem[]) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
          >
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <card.icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">{card.label}</h3>
              <p className="text-sm text-slate-500">{card.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-sm text-slate-600">
          Olá, <strong>{session.nome}</strong>
        </p>
      </Card>

      {renderCards(cardsGerais)}

      {cardsAdmin.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">Administração</h2>
          {renderCards(cardsAdmin)}
        </div>
      )}

      {temPermissao(session.perfil, "editar_contato") && (
        <Link
          href="/dashboard/alterar-senha"
          className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-600 shadow-sm hover:bg-slate-50"
        >
          <UserRound className="h-4 w-4" />
          Minha conta — e-mail, WhatsApp e senha
        </Link>
      )}
    </div>
  );
}
