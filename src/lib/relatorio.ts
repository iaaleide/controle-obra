import { prisma } from "./prisma";
import type { RelatorioSemanal, RelatorioLinha } from "./pdf";

function inicioSemana(data: Date): Date {
  const d = new Date(data);
  const dia = d.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function fimSemana(inicio: Date): Date {
  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + 6);
  fim.setHours(23, 59, 59, 999);
  return fim;
}

function formatarData(d: Date): string {
  return d.toLocaleDateString("pt-BR");
}

export async function gerarRelatorioSemanal(
  obraId: string,
  referencia?: Date
): Promise<RelatorioSemanal | null> {
  const obra = await prisma.obra.findUnique({ where: { id: obraId } });
  if (!obra) return null;

  const ref = referencia || new Date();
  const inicio = inicioSemana(ref);
  const fim = fimSemana(inicio);

  const funcionarios = await prisma.funcionario.findMany({
    where: { ativo: true, obras: { some: { obraId } } },
    include: {
      presencas: {
        where: {
          obraId,
          presente: true,
          data: { gte: inicio, lte: fim },
        },
        orderBy: { data: "asc" },
      },
    },
    orderBy: { nome: "asc" },
  });

  const linhas: RelatorioLinha[] = funcionarios.map((f) => ({
    funcionario: f.nome,
    cargo: f.cargo || "",
    diasTrabalhados: f.presencas.length,
    datas: f.presencas.map((p) => formatarData(p.data)),
  }));

  const totalPresencas = linhas.reduce((acc, l) => acc + l.diasTrabalhados, 0);

  return {
    obra: obra.nome,
    periodo: `${formatarData(inicio)} a ${formatarData(fim)}`,
    linhas,
    totalPresencas,
  };
}

export async function gerarRelatorioPeriodo(
  obraId: string,
  dataInicio: Date,
  dataFim: Date
): Promise<RelatorioSemanal | null> {
  const obra = await prisma.obra.findUnique({ where: { id: obraId } });
  if (!obra) return null;

  const funcionarios = await prisma.funcionario.findMany({
    where: { ativo: true, obras: { some: { obraId } } },
    include: {
      presencas: {
        where: {
          obraId,
          presente: true,
          data: { gte: dataInicio, lte: dataFim },
        },
        orderBy: { data: "asc" },
      },
    },
    orderBy: { nome: "asc" },
  });

  const linhas: RelatorioLinha[] = funcionarios.map((f) => ({
    funcionario: f.nome,
    cargo: f.cargo || "",
    diasTrabalhados: f.presencas.length,
    datas: f.presencas.map((p) => formatarData(p.data)),
  }));

  return {
    obra: obra.nome,
    periodo: `${formatarData(dataInicio)} a ${formatarData(dataFim)}`,
    linhas,
    totalPresencas: linhas.reduce((acc, l) => acc + l.diasTrabalhados, 0),
  };
}
