import { AcaoPresencaHistorico, Perfil, Presenca } from "@prisma/client";
import { prisma } from "./prisma";
import type { SessionUser } from "./auth";

interface DadosPresenca {
  presente: boolean;
  observacao: string | null;
  obraId: string;
}

export async function registrarHistoricoPresenca(
  presenca: Presenca,
  acao: AcaoPresencaHistorico,
  usuario: SessionUser,
  anterior?: DadosPresenca
) {
  return prisma.presencaHistorico.create({
    data: {
      presencaId: presenca.id,
      funcionarioId: presenca.funcionarioId,
      obraId: presenca.obraId,
      data: presenca.data,
      presente: presenca.presente,
      observacao: presenca.observacao,
      acao,
      usuarioId: usuario.id,
      usuarioNome: usuario.nome,
      usuarioPerfil: usuario.perfil as Perfil,
      presenteAnterior: anterior?.presente ?? null,
      observacaoAnterior: anterior?.observacao ?? null,
      obraIdAnterior: anterior?.obraId ?? null,
    },
  });
}

export function presencaAlterada(
  existente: Presenca,
  novo: { presente: boolean; observacao: string | null; obraId: string }
): boolean {
  return (
    existente.presente !== novo.presente ||
    (existente.observacao ?? null) !== novo.observacao ||
    existente.obraId !== novo.obraId
  );
}
