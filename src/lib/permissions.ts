import { Perfil } from "@prisma/client";

export type Permissao =
  | "ver_dashboard"
  | "ver_funcionarios"
  | "cadastrar_funcionario"
  | "editar_funcionario"
  | "ver_obras"
  | "cadastrar_obra"
  | "editar_obra"
  | "ver_presenca"
  | "cadastrar_presenca"
  | "editar_presenca"
  | "ver_relatorios"
  | "exportar_pdf"
  | "enviar_relatorio"
  | "gerenciar_usuarios"
  | "alterar_senha";

const PERMISSOES: Record<Perfil, Permissao[]> = {
  ADMIN: [
    "ver_dashboard",
    "ver_funcionarios",
    "cadastrar_funcionario",
    "editar_funcionario",
    "ver_obras",
    "cadastrar_obra",
    "editar_obra",
    "ver_presenca",
    "cadastrar_presenca",
    "editar_presenca",
    "ver_relatorios",
    "exportar_pdf",
    "enviar_relatorio",
    "gerenciar_usuarios",
    "alterar_senha",
  ],
  MESTRE: [
    "ver_dashboard",
    "ver_funcionarios",
    "cadastrar_funcionario",
    "ver_obras",
    "cadastrar_obra",
    "ver_presenca",
    "cadastrar_presenca",
    "ver_relatorios",
    "exportar_pdf",
    "enviar_relatorio",
    "alterar_senha",
  ],
  VISITANTE: [
    "ver_dashboard",
    "ver_funcionarios",
    "ver_obras",
    "ver_presenca",
    "ver_relatorios",
    "exportar_pdf",
  ],
};

export function temPermissao(perfil: Perfil, permissao: Permissao): boolean {
  return PERMISSOES[perfil].includes(permissao);
}

export function labelPerfil(perfil: Perfil): string {
  const labels: Record<Perfil, string> = {
    ADMIN: "Administrador",
    MESTRE: "Mestre de Obra",
    VISITANTE: "Visitante",
  };
  return labels[perfil];
}

export function corPerfil(perfil: Perfil): string {
  const cores: Record<Perfil, string> = {
    ADMIN: "bg-violet-100 text-violet-800",
    MESTRE: "bg-amber-100 text-amber-800",
    VISITANTE: "bg-sky-100 text-sky-800",
  };
  return cores[perfil];
}
