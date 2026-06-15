"use client";

import { useCallback, useEffect, useState } from "react";

export interface ObraResumo {
  id: string;
  nome: string;
  clienteNome: string | null;
  endereco?: string | null;
  descricao?: string | null;
  ativa?: boolean;
  _count?: { alocacoes: number };
}

export interface UseObrasOptions {
  incluirInativas?: boolean;
}

export function useObras(options?: UseObrasOptions) {
  const incluirInativas = options?.incluirInativas ?? false;
  const [obras, setObras] = useState<ObraResumo[]>([]);

  const recarregar = useCallback(() => {
    const url = incluirInativas ? "/api/obras?incluirInativas=true" : "/api/obras";
    return fetch(url)
      .then((r) => r.json())
      .then((data) => setObras(Array.isArray(data) ? data : []))
      .catch(() => setObras([]));
  }, [incluirInativas]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  return { obras, recarregar };
}
