/**
 * Medida de posicao no conteudo, usada pela rolagem das telas do app (video/AppScreen.jsx).
 */

/**
 * Onde um elemento comeca no conteudo `until` (offsetTop acumulado: nao muda com o `transform` do reveal). Sem `until`, sobe ate o topo.
 * @param {HTMLElement} element - Elemento medido.
 * @param {HTMLElement} [until] - Ancestral que marca o zero da conta.
 * @returns {number} Distância em pixels, em relação a `until`.
 */
export const getTopWithin = (element, until) => {
  let top = 0;
  for (let node = element; node && node !== until; node = node.offsetParent) top += node.offsetTop;
  return top;
};
