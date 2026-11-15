/**
 * Desliga o movimento e mostra o conteúdo final: é o caminho de volta quando uma animação ou a carga do chunk falha.
 */
export function openReadingMode() {
  const root = document.documentElement;
  root.classList.remove("movimento-pronto");
  root.classList.add("movimento-falhou");
  for (const element of document.querySelectorAll("[data-revelar], [data-line], .linha__texto")) {
    element.style.opacity = "1";
    element.style.transform = "none";
    element.style.translate = "none";
    element.style.scale = "none";
  }
  for (const element of document.querySelectorAll(".palavra, .regua__passo")) {
    element.setAttribute("data-acesa", "");
  }
}
