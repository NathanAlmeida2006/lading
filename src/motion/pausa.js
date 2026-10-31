/**
 * Pausa de movimento pelo visitante (WCAG 2.2.2): seta, campos de pontos
 * e as pontas soltas andam sozinhos por mais de 5 s, ao lado do texto. Quem nao usa
 * `prefers-reduced-motion` ainda precisa de um jeito de parar.
 *
 * Um estado so, fora do React: o laco de cada canvas vive fora da arvore.
 * O CSS le o atributo `data-pausado` do <html> (styles/residual.css).
 */
let pausado = false;
const ouvintes = new Set();

export const estaPausado = () => pausado;

export function definirPausa(valor) {
  const proximo = Boolean(valor);
  if (pausado === proximo) return;
  pausado = proximo;
  document.documentElement.toggleAttribute("data-pausado", proximo);
  for (const f of ouvintes) f(proximo);
}

/** Avisa quando a pausa muda. Devolve a funcao que cancela. */
export function aoMudarPausa(f) {
  ouvintes.add(f);
  return () => ouvintes.delete(f);
}
