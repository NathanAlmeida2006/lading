import { useRef } from "react";
import { pulsar } from "../motion/index.js";
import { registrarInicioCheckout, urlCheckout, useParametros } from "../instrumentacao.js";
import { VERBO_CURTO } from "../config.js";

/**
 * O botao primario. Um verbo so na pagina inteira (RF-L10), e ele leva sempre
 * ao mesmo destino: o checkout da Hotmart (RF-L01).
 *
 * E um `<a>`, nao um `<button>` com handler, de proposito: sem JS o link
 * continua clicavel e a pagina continua vendendo (RNF-L16).
 *
 * `fantasma` e a variante em contorno, usada no rodape: mesmo verbo, mesmo destino, sem a
 * inundacao de acento.
 *
 * O rotulo e duplicado dentro de um recorte e desliza no eixo Y no hover: e o
 * text roll, que os cinco sites da engenharia reversa usam sem excecao. Nao e
 * tique de template, e convencao do genero. A copia leva `aria-hidden`.
 */
const BASE =
  "botao group/botao relative inline-flex max-w-full min-w-0 items-center justify-center gap-3 border rounded-xs " +
  "cursor-pointer overflow-clip no-underline font-secundaria text-label uppercase " +
  "focus-visible:outline-offset-(--space-1) " +
  "transition-[background,color] duration-(--motion-fast) ease-(--ease-default)";

const CHEIO =
  "bg-acento border-acento text-bone " +
  "hover:bg-transparent hover:text-bone focus-visible:bg-transparent focus-visible:text-bone";

const FANTASMA =
  "bg-transparent border-bone text-bone " +
  "hover:bg-bone hover:text-void focus-visible:bg-bone focus-visible:text-void";

// 280px de largura minima, mas nunca mais larga que a coluna em que o botao mora: a oferta e o rodape
// ficam numa coluna de 208 a 232px entre 1024 e 1439px, e 280px de piso sangrava para fora dela.
const LARGO = "w-full xs:w-auto xs:min-w-[min(280px,100%)] min-h-14 px-6 py-4";
const TOTAL = "w-full xs:min-w-[min(280px,100%)] min-h-14 px-6 py-4";
// Em tela estreita a doca reserva uma linha inteira ao CTA. Em outras larguras,
// ela pode quebrar a linha sem reduzir o alvo ou cortar o rotulo ampliado.
const COMPACTO = "w-full xs:w-auto shrink-0 min-h-12 px-4 py-3";

const ROTULO =
  "block whitespace-normal py-1 transition-[translate] duration-(--motion-base) ease-(--ease-default) " +
  "motion-safe:group-hover/botao:-translate-y-full motion-safe:group-focus-visible/botao:-translate-y-full";

export function Botao({ posicao, compacto = false, fantasma = false, larguraTotal = false }) {
  const referencia = useRef(null);
  const params = useParametros();
  function aoClicar() {
    // Daqui para baixo nada cancela nem atrasa a navegacao: animacao e tracker sao sincronos e isolados
    // um do outro. Nenhum dos dois lanca para quem chama: `chamar` e `evento` ja isolam o erro.
    pulsar(referencia.current);
    // Intencao, nao fato. `Purchase` nasce na Hotmart (RF-L29).
    registrarInicioCheckout(posicao);
  }

  return (
    <a
      ref={referencia}
      className={`${BASE} ${fantasma ? FANTASMA : CHEIO} ${compacto ? COMPACTO : larguraTotal ? TOTAL : LARGO}`}
      href={urlCheckout(params)}
      onClick={aoClicar}
      onAuxClick={(event) => { if (event.button === 1) aoClicar(); }}
      data-posicao={posicao}
    >
      <span className="botao__rolo relative block min-w-0 overflow-clip">
        <span className={ROTULO}>{VERBO_CURTO}</span>
        <span className={`${ROTULO} absolute inset-x-0 top-full`} aria-hidden="true">
          {VERBO_CURTO}
        </span>
      </span>
      <span
        className="shrink-0 transition-[translate] duration-(--motion-fast) ease-(--ease-default) motion-safe:group-hover/botao:translate-x-1"
        aria-hidden="true"
      >
        &#8594;
      </span>
    </a>
  );
}
