export function abrirLeitura() {
  const raiz = document.documentElement;
  raiz.classList.remove("movimento-pronto");
  raiz.classList.add("movimento-falhou");
  for (const el of document.querySelectorAll("[data-revelar], [data-line], .linha__texto")) {
    el.style.opacity = "1";
    el.style.transform = "none";
    el.style.translate = "none";
    el.style.scale = "none";
  }
  for (const el of document.querySelectorAll(".palavra, .regua__passo")) {
    el.setAttribute("data-acesa", "");
  }
}
