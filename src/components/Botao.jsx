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
 */
export function Botao({ params, posicao }) {
  const referencia = useRef(null);

  function aoClicar() {
    pulsar(referencia.current);
    // Intencao, nao fato. `Purchase` nasce na Ticto (RF-L29).
    evento("InitiateCheckout", { posicao });
  }

  return (
    <a
      ref={referencia}
      className="botao label"
      href={urlCheckout(params)}
      onClick={aoClicar}
      data-posicao={posicao}
    >
      {VERBO_ACAO}
      <span className="botao__seta" aria-hidden="true">&#8594;</span>
    </a>
  );
}
