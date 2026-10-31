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

/** Doze colunas iguais a partir de 1024px, com o vao horizontal da escala lg. */
export const grade12 = "lg:grid lg:grid-cols-[repeat(12,1fr)] lg:gap-x-8";

/** Trecho em destaque dentro de um texto corrido. */
export const destaque = "text-bone font-bold";

/** Parte comum do link de pular e do botao de pausa: fora da tela ate receber foco. */
export const alvoDeTeclado =
  "sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-10 focus:inline-flex focus:items-center " +
  "focus:min-h-12 focus:px-4 focus:py-3 focus:bg-bone focus:text-void font-secundaria text-label uppercase";

/** Link de cada secao na lista do menu em tela cheia (Menu.jsx). */
export const linkDoMenu =
  "flex items-baseline gap-4 py-[clamp(6px,1.5svh,18px)] text-void font-secundaria " +
  "text-[length:clamp(2.5rem,4.5vw,3.5rem)] leading-none tracking-[0.02em] font-extrabold uppercase " +
  "transition-transform duration-300 ease-(--ease-expo) hover:translate-x-4 focus-visible:translate-x-4 " +
  "[&:hover_.menu-nome]:text-transparent [&:hover_.menu-nome]:[-webkit-text-stroke:1.5px_var(--void)] " +
  "[&:focus-visible_.menu-nome]:text-transparent [&:focus-visible_.menu-nome]:[-webkit-text-stroke:1.5px_var(--void)]";

/** A barra fixa de venda na base da pagina (Doca.jsx). */
export const barraDaDoca =
  "doca hidden js:flex fixed inset-x-0 bottom-0 z-15 flex-wrap items-center justify-between gap-3 " +
  "pl-[max(--spacing(4),env(safe-area-inset-left))] pr-[max(--spacing(4),env(safe-area-inset-right))] " +
  "pt-3 pb-[max(--spacing(3),env(safe-area-inset-bottom))] bg-surface-1 text-bone border-t border-line-strong " +
  "translate-y-full opacity-0 transition-[translate,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] " +
  "[.com-consentimento_&]:hidden data-ativa:translate-y-0 data-ativa:opacity-100";

/** O botao de play da secao de video (Video.jsx). */
export const botaoDoPlay =
  "group relative [--u:min(1svh,1.7vw)] grid place-items-center size-40 lg:size-64 rounded-full bg-acento " +
  "before:content-[''] before:absolute before:inset-0 before:rounded-full before:border-2 before:border-acento " +
  "motion-safe:before:animate-anel text-void transition-transform duration-(--motion-fast) hover:scale-105 " +
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bone " +
  "data-tocando:before:hidden data-tocando:pointer-events-none z-3";

/** Cada pergunta da lista de duvidas, em forma de acordeao (PerguntasFrequentes.jsx). */
export const itemDaFaq =
  "group/pergunta relative isolate min-w-0 border-b border-line-strong first:border-t data-aberto:text-void " +
  "transition-colors duration-700 ease-(--ease-expo) before:content-[''] before:absolute before:inset-y-0 " +
  "before:-inset-x-4 before:-z-10 before:bg-acento before:opacity-0 data-aberto:before:opacity-100 " +
  "before:transition-opacity before:duration-700 before:ease-(--ease-expo)";
