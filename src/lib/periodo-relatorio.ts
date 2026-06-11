export type ModoPeriodo = "semana" | "personalizado";

export function inicioSemanaAtual(): string {
  const hoje = new Date();
  const dia = hoje.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;
  const inicio = new Date(hoje);
  inicio.setDate(hoje.getDate() + diff);
  return inicio.toISOString().slice(0, 10);
}

export function fimSemanaAtual(): string {
  const inicio = new Date(inicioSemanaAtual() + "T00:00:00");
  inicio.setDate(inicio.getDate() + 6);
  return inicio.toISOString().slice(0, 10);
}

export function hojeIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function validarPeriodo(
  modoPeriodo: ModoPeriodo,
  dataInicio: string,
  dataFim: string
): string | null {
  if (modoPeriodo !== "personalizado") return null;
  if (!dataInicio || !dataFim) return "Informe data inicial e final.";
  if (dataInicio > dataFim) return "A data inicial deve ser anterior ou igual à final.";
  return null;
}

export function aplicarParamsPeriodo(
  params: URLSearchParams,
  modoPeriodo: ModoPeriodo,
  dataInicio: string,
  dataFim: string
) {
  if (modoPeriodo === "personalizado" && dataInicio && dataFim) {
    params.set("dataInicio", dataInicio);
    params.set("dataFim", dataFim);
  }
}
