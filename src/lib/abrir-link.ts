/** Abre link externo (ex.: wa.me) após operações assíncronas — evita bloqueio de pop-up no celular. */
export function abrirLinkExterno(url: string): void {
  const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (mobile) {
    window.location.assign(url);
    return;
  }

  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
}
