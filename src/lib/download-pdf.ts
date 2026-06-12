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
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  return { ok: true };
}
