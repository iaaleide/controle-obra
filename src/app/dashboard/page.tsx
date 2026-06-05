import Link from "next/link";
import { getSession } from "@/lib/auth";
import { temPermissao, labelPerfil } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { Building2, CalendarCheck, FileText, Users, UserRound } from "lucide-react";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const cards = [
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
      desc: "Ver equipe da obra",
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

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-sm text-slate-600">
          Olá, <strong>{session.nome}</strong> — você está como{" "}
          <strong>{labelPerfil(session.perfil)}</strong>.
        </p>
      </Card>

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
