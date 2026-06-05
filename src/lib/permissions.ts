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
  | "alterar_senha"
  | "editar_contato"
  | "limpar_registros"
  | "alocar_obras_visitante";

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
    "editar_contato",
    "limpar_registros",
    "alocar_obras_visitante",
  ],
  MESTRE: [
    "ver_dashboard",
    "ver_funcionarios",
    "cadastrar_funcionario",
    "ver_obras",
    "cadastrar_obra",
    "ver_presenca",
    "cadastrar_presenca",
    "editar_presenca",
    "ver_relatorios",
    "exportar_pdf",
    "enviar_relatorio",
    "alterar_senha",
    "editar_contato",
    "alocar_obras_visitante",
  ],
  VISITANTE: [
    "ver_dashboard",
    "ver_relatorios",
    "exportar_pdf",
    "enviar_relatorio",
    "editar_contato",
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

export function descricaoPerfil(perfil: Perfil): string {
  const descricoes: Record<Perfil, string> = {
    ADMIN: "Acesso total — cadastra e altera todos os dados",
    MESTRE:
      "Cadastra funcionários, obras e presença; pode corrigir dias já registrados (fica no histórico)",
    VISITANTE:
      "Visualiza e exporta relatórios apenas das obras liberadas para você (PDF, e-mail e WhatsApp)",
  };
  return descricoes[perfil];
}
