import type { CallbackProgresso } from "@/lib/fetch-com-progresso";
import { baixarBlobComProgresso } from "@/lib/fetch-com-progresso";

function dispositivoMovel(): boolean {
  return /iPhone|iPad|iPod|Android|Mobile/i.test(navigator.userAgent);
}

export async function baixarPdfResposta(
  res: Response,
  nomeArquivo: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!res.ok) {
    try {
      const data = await res.json();
      return { ok: false, error: data.error || "Erro ao gerar PDF" };
    } catch {
      return { ok: false, error: `Erro ao gerar PDF (${res.status})` };
    }
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  if (dispositivoMovel()) link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  link.remove();

  if (dispositivoMovel()) {
    const aberto = window.open(url, "_blank");
    if (!aberto) window.location.href = url;
  }

  window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
  return { ok: true };
}

export async function baixarPdfDaUrl(
  url: string,
  nomeArquivo: string,
  onProgress?: CallbackProgresso
): Promise<{ ok: true } | { ok: false; error: string }> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 90_000);

  try {
    const resultado = await baixarBlobComProgresso(
      url,
      { credentials: "same-origin", signal: controller.signal },
      onProgress
    );

    if (!resultado.ok || !resultado.blob) {
      return { ok: false, error: resultado.error || "Erro ao gerar PDF" };
    }

    const blobUrl = URL.createObjectURL(resultado.blob);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = nomeArquivo;
    if (dispositivoMovel()) link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    link.remove();

    if (dispositivoMovel()) {
      const aberto = window.open(blobUrl, "_blank");
      if (!aberto) window.location.href = blobUrl;
    }

    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
    return { ok: true };
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      return { ok: false, error: "Tempo esgotado ao gerar o PDF." };
    }
    return { ok: false, error: "Falha de rede ao baixar o PDF." };
  } finally {
    window.clearTimeout(timeoutId);
  }
}
