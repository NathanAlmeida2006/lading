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
 */
export function Botao({ params, posicao, compacto = false, fantasma = false }) {
  const referencia = useRef(null);

  function aoClicar() {
    pulsar(referencia.current);
    // Intencao, nao fato. `Purchase` nasce na Ticto (RF-L29).
    evento("InitiateCheckout", { posicao });
  }

  return (
    <a
      ref={referencia}
      className={`botao label${compacto ? " botao--compacto" : ""}${fantasma ? " botao--fantasma" : ""}`}
      href={urlCheckout(params)}
      onClick={aoClicar}
      data-posicao={posicao}
    >
      <span className="botao__rolo">
        <span className="botao__rotulo">{VERBO_ACAO}</span>
        <span className="botao__rotulo" aria-hidden="true">
          {VERBO_ACAO}
        </span>
      </span>
      <span className="botao__seta" aria-hidden="true">&#8594;</span>
    </a>
  );
}
