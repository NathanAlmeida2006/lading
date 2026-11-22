/**
 * Tudo o que a coreografia esconde com `reveal` (`utils.set` com opacidade 0) e que as duas redes de segurança
 * (`openReadingMode` e `ensureVisibility`, em index.js) precisam mostrar de volta. Uma lista só para as duas.
 */
export const REVEALED_SELECTOR = "[data-revelar], .rotulo";

/**
 * Desliga o movimento e mostra o conteúdo final: é o caminho de volta quando uma animação ou a carga do chunk falha.
 */
export function openReadingMode() {
  const root = document.documentElement;
  root.classList.remove("movimento-pronto");
  root.classList.add("movimento-falhou");
  for (const element of document.querySelectorAll(`${REVEALED_SELECTOR}, [data-line], .linha__texto`)) {
    element.style.opacity = "1";
    element.style.transform = "none";
    element.style.translate = "none";
    element.style.scale = "none";
  }
}
