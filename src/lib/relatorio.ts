import { Perfil } from "@prisma/client";
import { prisma } from "./prisma";
import type { RelatorioSemanal, RelatorioLinha } from "./pdf";
import { inicioSemana, fimSemana, formatarData } from "./semana";

export interface OpcoesRelatorio {
  incluirSemPresenca?: boolean;
  /** Evita query extra quando a obra já foi validada (ex.: exigirAcessoObra). */
  obra?: { nome: string };
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
    incluirSemPresenca,
  };
}

export function parseIncluirSemPresenca(value: unknown): boolean {
  return value === true || value === "true";
}

/** Visitante só vê quem teve presença — ignora pedido de incluir ausentes. */
export function resolverIncluirSemPresenca(perfil: Perfil, value: unknown): boolean {
  if (perfil === Perfil.VISITANTE) return false;
  return parseIncluirSemPresenca(value);
}

function filtroPresencaPeriodo(obraId: string, inicio: Date, fim: Date) {
  return {
    obraId,
    presente: true,
    data: { gte: inicio, lte: fim },
  };
}

async function buscarFuncionariosRelatorio(
  obraId: string,
  inicio: Date,
  fim: Date,
  incluirSemPresenca: boolean
) {
  const presencaFiltro = filtroPresencaPeriodo(obraId, inicio, fim);

  const where = incluirSemPresenca
    ? {
        obras: { some: { obraId } },
        OR: [
          { ativo: true },
          { presencas: { some: presencaFiltro } },
        ],
      }
    : {
        obras: { some: { obraId } },
        presencas: { some: presencaFiltro },
      };

  return prisma.funcionario.findMany({
    where,
    include: {
      presencas: {
        where: presencaFiltro,
        orderBy: { data: "asc" },
      },
    },
    orderBy: { nome: "asc" },
  });
}

export async function gerarRelatorioSemanal(
  obraId: string,
  referencia?: Date,
  opcoes: OpcoesRelatorio = {}
): Promise<RelatorioSemanal | null> {
  const incluirSemPresenca = opcoes.incluirSemPresenca ?? false;
  const obra =
    opcoes.obra ?? (await prisma.obra.findUnique({ where: { id: obraId } }));
  if (!obra) return null;

  const ref = referencia || new Date();
  const inicio = inicioSemana(ref);
  const fim = fimSemana(inicio);

  const funcionarios = await buscarFuncionariosRelatorio(
    obraId,
    inicio,
    fim,
    incluirSemPresenca
  );

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
  const obra =
    opcoes.obra ?? (await prisma.obra.findUnique({ where: { id: obraId } }));
  if (!obra) return null;

  const funcionarios = await buscarFuncionariosRelatorio(
    obraId,
    dataInicio,
    dataFim,
    incluirSemPresenca
  );

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
