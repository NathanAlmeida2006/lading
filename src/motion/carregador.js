// O primeiro efeito de seção pede o chunk depois da hidratação.
let carga;

export function carregarCoreografias() {
  if (!carga) {
    carga = import("./coreografias.js").catch((erro) => {
      carga = undefined;
      throw erro;
    });
  }
  return carga;
}

export function abrirLeitura() {
  if (typeof document === "undefined") return;
  const raiz = document.documentElement;
  raiz.classList.remove("movimento-pronto");
  raiz.classList.add("movimento-falhou");
  for (const el of document.querySelectorAll("[data-revelar], [data-line], .linha__texto")) {
    el.style.opacity = "1";
    el.style.transform = "none";
    el.style.translate = "none";
    el.style.scale = "none";
  }
  for (const el of document.querySelectorAll(".palavra, .regua12__semana")) {
    el.setAttribute("data-acesa", "");
  }
}
