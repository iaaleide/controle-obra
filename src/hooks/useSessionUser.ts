"use client";

import { useCallback, useEffect, useState } from "react";

export interface SessionUser {
  id?: string;
  perfil: "ADMIN" | "MESTRE" | "VISITANTE";
  email?: string | null;
  telefone?: string | null;
  nome?: string;
}

export function useSessionUser() {
  const [user, setUser] = useState<SessionUser | null>(null);

  const recarregar = useCallback(() => {
    return fetch("/api/auth/me")
      .then((r) => r.json())
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  return { user, recarregar };
}
