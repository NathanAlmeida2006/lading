/**
 * Conjuntos de classes que se repetem. Sao strings completas de proposito: o
 * Tailwind so enxerga o que esta escrito por inteiro no codigo-fonte.
 */

/** A coluna da pagina: 720px no celular, 1120px a partir de 1024, 1440px a partir de 1440. */
export const envelope =
  "w-full max-w-180 mx-auto px-4 md:px-8 lg:max-w-280 lg:px-12 wide:max-w-360 wide:px-16";

/** A textura de grao, no ::before da superficie de marca. Nunca sobre texto corrido (RNF-G08). */
export const grao =
  "before:absolute before:inset-0 before:pointer-events-none before:opacity-(--grain-opacity) before:bg-(image:--grao) before:mix-blend-overlay";

/**
 * Camada propria, como no original (`will-change: transform`). Nao e enfeite: o grao tem
 * `mix-blend-mode`, e sem camadas intermediarias o navegador mistura o grao a pagina
 * inteira que o precede, o que apaga o antialiasing por subpixel do texto (fica cinza).
 * Estas camadas (as linhas das headlines, o selo) sao o que
 * mantem o texto das secoes como era. Medido por comparacao de pixels em 02/10/2026.
 */
export const camada = "will-change-transform";

/** Fundo de uma secao: o tema vive NA secao, e a troca no limite e em corte (RNF-L19). `clip`, nunca `hidden` (RNF-L37). */
export const bloco = "relative overflow-clip bg-void text-bone border-t border-line";

/**
 * Uma linha de headline composta a mao; o texto sobe de dentro do recorte. Folga em cima e embaixo para o
 * acento e a cedilha. O recorte e so VERTICAL: e ele que faz a linha subir de dentro, e no eixo horizontal
 * ele so cortaria a palavra quando a fonte de reserva (mais larga) ocupa o lugar da webfont.
 */
export const linha = "block overflow-y-clip pt-[0.2em] pb-[0.04em] -mt-[0.2em] -mb-[0.04em]";

/** Palavra so em contorno: fio de 1,5px no lugar do preenchimento (cor explicita, nunca currentColor). */
export const vazado = "text-transparent [-webkit-text-stroke:1.5px_var(--bone)]";

/** Painel de tela cheia: a dobra e o fechamento. `min-h-svh`, nunca `vh` (RF-L09). */
export const painel = "relative flex flex-col min-h-svh py-4 lg:py-8 bg-void text-bone overflow-clip";

export const crus =
  "flex flex-wrap justify-end gap-x-4 gap-y-2 text-right font-terciaria text-mono-reg tabular-nums";

/** Numeracao de dois digitos ("03"), a dos indices, cards e cronometros. */
export const doisDigitos = (n) => String(n).padStart(2, "0");

/**
 * Palavra que acende com a rolagem (manifesto e titulo do que se leva): apagada e opacidade, e a da
 * fronteira (`data-atual`) no acento.
 */
export const palavra =
  "palavra inline-block transition-[opacity,color] duration-(--motion-fast) ease-(--ease-corte-2) " +
  "js:opacity-[0.22] data-acesa:opacity-100 data-atual:text-acento " +
  "motion-reduce:js:opacity-100 motion-reduce:data-atual:text-inherit";

/**
 * Titulo com mascara de linha (`mascaraDeLinha`): o `splitText` do anime.js 4 marca cada linha
 * com `[data-line]` e o recorte (`overflow: clip`) comeria o `g` e a cedilha sem esta folga.
 */
export const mascara = "[&_[data-line]]:pb-[0.08em]";
