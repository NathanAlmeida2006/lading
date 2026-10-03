import { useRef } from "react";
import { pulsar } from "../motion/index.js";
import { evento, urlCheckout } from "../instrumentacao.js";
import { VERBO_ACAO } from "../config.js";

/**
 * O botao primario. Um verbo so na pagina inteira (RF-L10), e ele leva sempre
 * ao mesmo destino: o checkout da Ticto (RF-L01).
 *
 * E um `<a>`, nao um `<button>` com handler, de proposito: sem JS o link
 * continua clicavel e a pagina continua vendendo (RNF-L16).
 *
 * `fantasma` e a variante em contorno: mesmo verbo, mesmo destino, sem a
 * inundacao de acento. Existe para o baralho de cards do espelho, onde cinco
 * botoes cheios seriam cinco acentos numa tela so.
 *
 * O rotulo e duplicado dentro de um recorte e desliza no eixo Y no hover: e o
 * text roll, que os cinco sites da engenharia reversa usam sem excecao. Nao e
 * tique de template, e convencao do genero. A copia leva `aria-hidden`.
 *
 * Acento no Cartaz: o rotulo cheio troca de tinta (`cartaz:text-void`) porque
 * no papel quem contrasta com a inundacao de acento e o fundo, 6,33:1 (RNF-L36).
 */
const BASE =
  "botao group/botao relative inline-flex items-center justify-center gap-3 border rounded-xs " +
  "cursor-pointer overflow-clip no-underline font-secundaria text-label uppercase " +
  "transition-[background,color] duration-(--motion-fast) ease-(--ease-default)";

const CHEIO =
  "bg-acento border-acento text-bone cartaz:text-void " +
  "hover:bg-transparent hover:text-bone focus-visible:bg-transparent focus-visible:text-bone";

const FANTASMA =
  "bg-transparent border-bone text-bone " +
  "hover:bg-bone hover:text-void focus-visible:bg-bone focus-visible:text-void";

// 280px de largura minima, mas nunca mais larga que a coluna em que o botao mora: a oferta e o rodape
// ficam numa coluna de 208 a 232px entre 1024 e 1439px, e 280px de piso sangrava para fora dela.
const LARGO = "w-full xs:w-auto xs:min-w-[min(280px,100%)] min-h-14 px-6 py-4";
const TOTAL = "w-full xs:min-w-[min(280px,100%)] min-h-14 px-6 py-4";
// `shrink-0`: na doca o botao dividia a linha com o texto do preco e encolhia ate o rotulo quebrar,
// cortado pelo recorte de 1em. Quem cede e o texto, que pode quebrar em linhas.
const COMPACTO = "w-auto min-w-0 shrink-0 min-h-12 px-4 py-3";

const ROTULO =
  "block whitespace-nowrap transition-[translate] duration-(--motion-base) ease-(--ease-default) " +
  "group-hover/botao:-translate-y-full group-focus-visible/botao:-translate-y-full";

export function Botao({ params, posicao, compacto = false, fantasma = false, larguraTotal = false }) {
  const referencia = useRef(null);

  function aoClicar() {
    pulsar(referencia.current);
    // Intencao, nao fato. `Purchase` nasce na Ticto (RF-L29).
    evento("InitiateCheckout", { posicao });
  }

  return (
    <a
      ref={referencia}
      className={`${BASE} ${fantasma ? FANTASMA : CHEIO} ${compacto ? COMPACTO : larguraTotal ? TOTAL : LARGO}`}
      href={urlCheckout(params)}
      onClick={aoClicar}
      data-posicao={posicao}
    >
      <span className="botao__rolo relative block h-[1em] leading-none overflow-clip">
        <span className={ROTULO}>{VERBO_ACAO}</span>
        <span className={`${ROTULO} absolute inset-x-0 top-full`} aria-hidden="true">
          {VERBO_ACAO}
        </span>
      </span>
      <span
        className="transition-[translate] duration-(--motion-fast) ease-(--ease-default) group-hover/botao:translate-x-1"
        aria-hidden="true"
      >
        &#8594;
      </span>
    </a>
  );
}
