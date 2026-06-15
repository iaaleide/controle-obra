import { prisma } from "./prisma";
import { inicioSemana, fimSemana, formatarData } from "./semana";

export interface LinhaFerramentaRelatorio {
  ferramenta: string;
  descricao: string | null;
  dataDeixada: string;
  dataDevolvida: string | null;
  status: "Em uso" | "Devolvida";
}

export interface RelatorioFerramentas {
  obra: string;
  periodo: string;
  linhas: LinhaFerramentaRelatorio[];
  emitidoEm?: string | null;
}

async function buscarEmprestimosPeriodo(obraId: string, inicio: Date, fim: Date) {
  return prisma.ferramentaEmprestimo.findMany({
    where: {
      obraId,
      dataDeixada: { lte: fim },
      OR: [{ dataDevolvida: null }, { dataDevolvida: { gte: inicio } }],
    },
    include: {
      ferramenta: { select: { nome: true, descricao: true } },
      obra: { select: { nome: true } },
    },
    orderBy: [{ dataDeixada: "asc" }, { ferramenta: { nome: "asc" } }],
  });
}

function montarLinhas(
  emprestimos: Awaited<ReturnType<typeof buscarEmprestimosPeriodo>>
): LinhaFerramentaRelatorio[] {
  return emprestimos.map((e) => ({
    ferramenta: e.ferramenta.nome,
    descricao: e.ferramenta.descricao,
    dataDeixada: formatarData(e.dataDeixada),
    dataDevolvida: e.dataDevolvida ? formatarData(e.dataDevolvida) : null,
    status: e.dataDevolvida ? "Devolvida" : "Em uso",
  }));
}

export async function gerarRelatorioFerramentasSemanal(
  obraId: string,
  referencia?: Date
): Promise<RelatorioFerramentas | null> {
  const obra = await prisma.obra.findUnique({ where: { id: obraId } });
  if (!obra) return null;

  const ref = referencia || new Date();
  const inicio = inicioSemana(ref);
  const fim = fimSemana(inicio);

  const emprestimos = await buscarEmprestimosPeriodo(obraId, inicio, fim);

  return {
    obra: obra.nome,
    periodo: `${formatarData(inicio)} a ${formatarData(fim)}`,
    linhas: montarLinhas(emprestimos),
  };
}

export async function gerarRelatorioFerramentasPeriodo(
  obraId: string,
  dataInicio: Date,
  dataFim: Date
): Promise<RelatorioFerramentas | null> {
  const obra = await prisma.obra.findUnique({ where: { id: obraId } });
  if (!obra) return null;

  const emprestimos = await buscarEmprestimosPeriodo(obraId, dataInicio, dataFim);

  return {
    obra: obra.nome,
    periodo: `${formatarData(dataInicio)} a ${formatarData(dataFim)}`,
    linhas: montarLinhas(emprestimos),
  };
}
