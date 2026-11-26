/**
 * Conjuntos de classes que se repetem. São strings completas de propósito: o
 * Tailwind só enxerga o que está escrito por inteiro no código-fonte.
 */

/** A coluna da página: 720px no celular, 1120px a partir de 1024, 1440px a partir de 1440. */
export const ENVELOPE =
  "w-full max-w-180 mx-auto px-4 md:px-8 lg:max-w-280 lg:px-12 wide:max-w-360 wide:px-16";

/** A textura de grão, no ::before da superfície de marca. Nunca sobre texto corrido (RNF-G08). */
export const GRAIN =
  "before:absolute before:inset-0 before:pointer-events-none before:opacity-(--grain-opacity) before:bg-(image:--grain) before:mix-blend-overlay";

/**
 * Camada própria, como no original (`will-change: transform`). Não é enfeite: o grão tem
 * `mix-blend-mode`, e sem camadas intermediárias o navegador mistura o grão à página
 * inteira que o precede, o que apaga o antialiasing por subpixel do texto (fica cinza).
 * Estas camadas (as linhas das headlines, o selo) são o que
 * mantém o texto das seções como era. Medido por comparação de pixels em 02/10/2026.
 */
export const LAYER = "will-change-transform";

/** Fundo de uma seção: o tema vive NA seção, e a troca no limite é em corte (RNF-L19). `clip`, nunca `hidden` (RNF-L37). */
export const BLOCK = "relative overflow-clip bg-void text-bone border-t border-line";

/**
 * Uma linha de headline composta à mão; o texto sobe de dentro do recorte. Folga em cima e embaixo para o
 * acento e a cedilha. O recorte é só VERTICAL: é ele que faz a linha subir de dentro, e no eixo horizontal
 * ele só cortaria a palavra quando a fonte de reserva (mais larga) ocupa o lugar da webfont.
 */
export const LINE = "block overflow-y-clip pt-[0.2em] pb-[0.04em] -mt-[0.2em] -mb-[0.04em]";

/** Palavra só em contorno: fio de 1,5px no lugar do preenchimento (cor explícita, nunca currentColor). */
export const OUTLINED = "text-transparent [-webkit-text-stroke:1.5px_var(--bone)]";

/** Painel de tela cheia: a dobra e o fechamento. `min-h-svh`, nunca `vh` (RF-L09). */
export const PANEL =
  "relative flex flex-col min-h-svh py-4 lg:py-8 bg-void text-bone overflow-clip";

export const RAW_NUMBERS =
  "flex flex-wrap justify-end gap-x-4 gap-y-2 text-right font-tertiary text-mono-reg tabular-nums";

/**
 * Numeração de dois dígitos ("03"), a dos índices, cards e cronômetros.
 * @param {number} n - Número a formatar.
 * @returns {string} Dois dígitos, com zero à esquerda.
 */
export const padTwoDigits = (n) => String(n).padStart(2, "0");

/**
 * Título com máscara de linha (`revealLineMask`): o `splitText` do anime.js 4 marca cada linha
 * com `[data-line]` e o recorte (`overflow: clip`) comeria o `g` e a cedilha sem esta folga.
 */
export const MASK = "[&_[data-line]]:pb-[0.08em]";

/** Doze colunas iguais a partir de 1024px, com o vão horizontal da escala lg. */
export const GRID_12 = "lg:grid lg:grid-cols-[repeat(12,1fr)] lg:gap-x-8";

/** Trecho em destaque dentro de um texto corrido. */
export const HIGHLIGHT = "text-bone font-bold";

/** Parte comum do link de pular e do botão de pausa: fora da tela até receber foco. */
export const KEYBOARD_TARGET =
  "sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-10 focus:inline-flex focus:items-center " +
  "focus:min-h-12 focus:px-4 focus:py-3 focus:bg-bone focus:text-void font-secondary text-label uppercase";
