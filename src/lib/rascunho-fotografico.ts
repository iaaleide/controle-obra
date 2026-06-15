export type RascunhoFotografico = {
  obraId: string;
  relatorioId: string | null;
  dataInicio: string;
  dataFim: string;
  emitidoEm: string;
  clienteNome: string;
  observacoes: string;
  fotos: { imagemBase64: string; legenda: string }[];
  salvoEm: number;
};

function chave(obraId: string) {
  return `controle-obra:rascunho-fotografico:${obraId}`;
}

export function salvarRascunhoFotografico(rascunho: RascunhoFotografico): boolean {
  try {
    const json = JSON.stringify(rascunho);
    if (json.length > 4_500_000) return false;
    sessionStorage.setItem(chave(rascunho.obraId), json);
    return true;
  } catch {
    return false;
  }
}

export function lerRascunhoFotografico(obraId: string): RascunhoFotografico | null {
  try {
    const raw = sessionStorage.getItem(chave(obraId));
    if (!raw) return null;
    const data = JSON.parse(raw) as RascunhoFotografico;
    if (data.obraId !== obraId) return null;
    return data;
  } catch {
    return null;
  }
}

export function limparRascunhoFotografico(obraId: string) {
  try {
    sessionStorage.removeItem(chave(obraId));
  } catch {
    /* ignore */
  }
}
