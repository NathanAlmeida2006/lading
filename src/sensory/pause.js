/**
 * Pausa de movimento pelo visitante (WCAG 2.2.2): seta, campos de pontos
 * e as pontas soltas andam sozinhos por mais de 5 s, ao lado do texto. Quem nao usa
 * `prefers-reduced-motion` ainda precisa de um jeito de parar.
 *
 * Um estado so, fora do React: o laco de cada canvas vive fora da arvore.
 * O CSS le o atributo `data-pausado` do <html> (styles/residual.css).
 */
let isPausedByUser = false;
const listeners = new Set();

/**
 * Se o visitante pausou as animações.
 * @returns {boolean} true quando a pausa está ligada.
 */
export const isPaused = () => isPausedByUser;

/**
 * Liga ou desliga a pausa, marca o `<html>` e avisa os ouvintes.
 * @param {boolean} value - Novo estado da pausa.
 */
export function setPaused(value) {
  const next = Boolean(value);
  if (isPausedByUser === next) return;
  isPausedByUser = next;
  document.documentElement.toggleAttribute("data-pausado", next);
  for (const listener of listeners) listener(next);
}

/**
 * Avisa quando a pausa muda. Devolve a funcao que cancela.
 * @param {(isPaused: boolean) => void} listener - Chamado com o novo estado.
 * @returns {() => void} Função que remove o listener.
 */
export function subscribeToPause(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
