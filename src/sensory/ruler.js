/**
 * Medida de posição no conteúdo, usada pela rolagem das telas do app (video/AppScreen.jsx).
 */

/**
 * Onde um elemento começa no conteúdo `until` (offsetTop acumulado: não muda com o `transform` do reveal). Sem `until`, sobe até o topo.
 * @param {HTMLElement} element - Elemento medido.
 * @param {HTMLElement} [until] - Ancestral que marca o zero da conta.
 * @returns {number} Distância em pixels, em relação a `until`.
 */
export const getTopWithin = (element, until) => {
  let top = 0;
  for (let node = element; node && node !== until; node = node.offsetParent) top += node.offsetTop;
  return top;
};
