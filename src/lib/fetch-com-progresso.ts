export type CallbackProgresso = (percentual: number, rotulo?: string) => void;

export function mapearProgresso(
  callback: CallbackProgresso,
  minimo: number,
  maximo: number
): CallbackProgresso {
  return (percentual, rotulo) => {
    const valor = minimo + ((maximo - minimo) * percentual) / 100;
    callback(Math.min(maximo, Math.round(valor)), rotulo);
  };
}

export async function enviarJsonComProgresso<T>(
  url: string,
  opcoes: { method: string; body: string; signal?: AbortSignal },
  onProgress?: CallbackProgresso
): Promise<{ ok: boolean; status: number; data: T }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(opcoes.method, url);
    xhr.setRequestHeader("Content-Type", "application/json");

    if (opcoes.signal) {
      if (opcoes.signal.aborted) {
        reject(new DOMException("Aborted", "AbortError"));
        return;
      }
      opcoes.signal.addEventListener("abort", () => xhr.abort(), { once: true });
    }

    xhr.upload.onprogress = (evento) => {
      if (!onProgress) return;
      if (evento.lengthComputable && evento.total > 0) {
        const envio = Math.round((evento.loaded / evento.total) * 85);
        onProgress(envio, "Enviando dados…");
      } else {
        onProgress(40, "Enviando dados…");
      }
    };

    xhr.onload = () => {
      onProgress?.(92, "Processando resposta…");
      let data: T;
      try {
        data = JSON.parse(xhr.responseText) as T;
      } catch {
        reject(new Error("Resposta inválida do servidor"));
        return;
      }
      onProgress?.(100);
      resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, data });
    };

    xhr.onerror = () => reject(new Error("Falha de rede"));
    xhr.onabort = () => reject(new DOMException("Aborted", "AbortError"));
    xhr.ontimeout = () => reject(new Error("Tempo esgotado"));

    onProgress?.(5, "Preparando…");
    xhr.send(opcoes.body);
  });
}

export async function baixarBlobComProgresso(
  url: string,
  opcoes: { signal?: AbortSignal; credentials?: RequestCredentials },
  onProgress?: CallbackProgresso
): Promise<{ ok: boolean; status: number; blob?: Blob; error?: string }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.responseType = "blob";
    if (opcoes.credentials) xhr.withCredentials = opcoes.credentials === "include";

    if (opcoes.signal) {
      if (opcoes.signal.aborted) {
        resolve({ ok: false, status: 0, error: "Tempo esgotado ao gerar o PDF." });
        return;
      }
      opcoes.signal.addEventListener("abort", () => xhr.abort(), { once: true });
    }

    xhr.onprogress = (evento) => {
      if (!onProgress) return;
      if (evento.lengthComputable && evento.total > 0) {
        const baixado = Math.round((evento.loaded / evento.total) * 95);
        onProgress(baixado, "Baixando PDF…");
      } else {
        onProgress(50, "Gerando PDF…");
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100, "PDF pronto");
        resolve({ ok: true, status: xhr.status, blob: xhr.response as Blob });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        try {
          const json = JSON.parse(String(reader.result)) as { error?: string };
          resolve({ ok: false, status: xhr.status, error: json.error || "Erro ao gerar PDF" });
        } catch {
          resolve({ ok: false, status: xhr.status, error: `Erro ao gerar PDF (${xhr.status})` });
        }
      };
      reader.readAsText(xhr.response as Blob);
    };

    xhr.onerror = () => resolve({ ok: false, status: 0, error: "Falha de rede ao baixar o PDF." });
    xhr.onabort = () => resolve({ ok: false, status: 0, error: "Tempo esgotado ao gerar o PDF." });

    onProgress?.(8, "Gerando PDF…");
    xhr.send();
  });
}
