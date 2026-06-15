"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  CalendarCheck,
  FileText,
  Home,
  LogOut,
  Menu,
  Users,
  UserCog,
  Eye,
  X,
} from "lucide-react";
import { useState } from "react";
import { Perfil } from "@prisma/client";
import { temPermissao } from "@/lib/permissions";
import { PerfilBanner } from "./PerfilBanner";

interface AppShellProps {
  children: React.ReactNode;
  user: { nome: string; perfil: Perfil; login: string };
}

const navItems = [
  { href: "/dashboard", label: "Início", icon: Home, permissao: "ver_dashboard" as const },
  { href: "/dashboard/obras", label: "Obras", icon: Building2, permissao: "ver_obras" as const },
  {
    href: "/dashboard/funcionarios",
    label: "Funcionários",
    icon: Users,
    permissao: "ver_funcionarios" as const,
  },
  {
    href: "/dashboard/presenca",
    label: "Presença",
    icon: CalendarCheck,
    permissao: "ver_presenca" as const,
  },
  {
    href: "/dashboard/relatorios",
    label: "Relatórios",
    icon: FileText,
    permissao: "ver_relatorios" as const,
  },
  {
    href: "/dashboard/usuarios",
    label: "Usuários",
    icon: UserCog,
    permissao: "gerenciar_usuarios" as const,
  },
  {
    href: "/dashboard/visitantes",
    label: "Visitantes",
    icon: Eye,
    permissao: "alocar_obras_visitante" as const,
  },
];

export function AppShell({ children, user }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = navItems.filter((item) => temPermissao(user.perfil, item.permissao));

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-dvh pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-base font-bold text-slate-800">Controle Obra</h1>
            <p className="text-xs text-slate-500">{user.nome}</p>
          </div>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
            aria-label="Menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <button
            onClick={logout}
            className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 md:flex"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="border-b border-slate-100 bg-white px-4 py-3 md:hidden">
          <nav className="space-y-1">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ${
                  pathname === item.href
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
            <button
              onClick={logout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </nav>
        </div>
      )}

      <main className="mx-auto max-w-3xl space-y-4 px-4 py-5">
        <PerfilBanner perfil={user.perfil} />
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-[max(0.75rem,env(safe-area-inset-bottom,0px))] z-40 border-t border-slate-100 bg-white/95 backdrop-blur-md md:hidden">
        <div className="flex justify-around px-2 py-2.5">
          {links.slice(0, 5).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[10px] font-medium ${
                pathname === item.href ? "text-blue-600" : "text-slate-500"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      <nav className="fixed bottom-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+0.5rem))] left-1/2 z-40 hidden -translate-x-1/2 rounded-2xl border border-slate-200 bg-white px-2 py-2 shadow-lg md:flex">
        {links.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
              pathname === item.href
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
