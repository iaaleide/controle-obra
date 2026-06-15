function mobileComPdf(): boolean {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
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
      return { ok: false, error: "Erro ao gerar PDF" };
    }
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);

  if (mobileComPdf()) {
    const aberto = window.open(url, "_blank");
    if (!aberto) window.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 120_000);
    return { ok: true };
  }

  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  return { ok: true };
}

export async function baixarPdfDaUrl(
  url: string,
  nomeArquivo: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch(url, { credentials: "same-origin" });
  return baixarPdfResposta(res, nomeArquivo);
}
