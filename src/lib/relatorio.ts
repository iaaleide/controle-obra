import { prisma } from "./prisma";
import type { RelatorioSemanal, RelatorioLinha } from "./pdf";

export interface OpcoesRelatorio {
  incluirSemPresenca?: boolean;
}

function filtrarLinhas(
  linhas: RelatorioLinha[],
  incluirSemPresenca: boolean
): RelatorioLinha[] {
  if (incluirSemPresenca) return linhas;
  return linhas.filter((l) => l.diasTrabalhados > 0);
}

function montarRelatorio(
  obra: { nome: string },
  periodo: string,
  linhas: RelatorioLinha[],
  incluirSemPresenca: boolean
): RelatorioSemanal {
  const linhasFiltradas = filtrarLinhas(linhas, incluirSemPresenca);
  return {
    obra: obra.nome,
    periodo,
    linhas: linhasFiltradas,
    totalPresencas: linhasFiltradas.reduce((acc, l) => acc + l.diasTrabalhados, 0),
  };
}

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
  referencia?: Date,
  opcoes: OpcoesRelatorio = {}
): Promise<RelatorioSemanal | null> {
  const incluirSemPresenca = opcoes.incluirSemPresenca ?? false;
  const obra = await prisma.obra.findUnique({ where: { id: obraId } });
  if (!obra) return null;

  const ref = referencia || new Date();
  const inicio = inicioSemana(ref);
  const fim = fimSemana(inicio);

  const funcionarios = await prisma.funcionario.findMany({
    where: {
      obras: { some: { obraId } },
      OR: [
        { ativo: true },
        {
          presencas: {
            some: {
              obraId,
              presente: true,
              data: { gte: inicio, lte: fim },
            },
          },
        },
      ],
    },
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

  return montarRelatorio(
    obra,
    `${formatarData(inicio)} a ${formatarData(fim)}`,
    linhas,
    incluirSemPresenca
  );
}

export async function gerarRelatorioPeriodo(
  obraId: string,
  dataInicio: Date,
  dataFim: Date,
  opcoes: OpcoesRelatorio = {}
): Promise<RelatorioSemanal | null> {
  const incluirSemPresenca = opcoes.incluirSemPresenca ?? false;
  const obra = await prisma.obra.findUnique({ where: { id: obraId } });
  if (!obra) return null;

  const funcionarios = await prisma.funcionario.findMany({
    where: {
      obras: { some: { obraId } },
      OR: [
        { ativo: true },
        {
          presencas: {
            some: {
              obraId,
              presente: true,
              data: { gte: dataInicio, lte: dataFim },
            },
          },
        },
      ],
    },
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

  return montarRelatorio(
    obra,
    `${formatarData(dataInicio)} a ${formatarData(dataFim)}`,
    linhas,
    incluirSemPresenca
  );
}
