import { useRef } from "react";
import { pulse } from "../../sensory/index.js";
import { trackCheckoutStart, buildCheckoutUrl, useCampaignParams } from "../../infra/instrumentation.js";
import { CTA_SHORT_VERB } from "../../infra/config.js";

/**
 * O botao primario. Um verbo so na pagina inteira (RF-L10), e ele leva sempre
 * ao mesmo destino: o checkout da Hotmart (RF-L01).
 *
 * E um `<a>`, nao um `<button>` com handler, de proposito: sem JS o link
 * continua clicavel e a pagina continua vendendo (RNF-L16).
 *
 * `isGhost` e a variante em contorno, usada no rodape: mesmo verbo, mesmo destino, sem a
 * inundacao de acento.
 *
 * `shouldHideDock` marca o botao como alvo da doca: ela some enquanto ele tiver qualquer pixel na tela.
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

const SOLID =
  "bg-acento border-acento text-bone " +
  "hover:bg-transparent hover:text-bone focus-visible:bg-transparent focus-visible:text-bone";

const GHOST =
  "bg-transparent border-bone text-bone " +
  "hover:bg-bone hover:text-void focus-visible:bg-bone focus-visible:text-void";

// 280px de largura minima, mas nunca mais larga que a coluna em que o botao mora: a oferta e o rodape
// ficam numa coluna de 208 a 232px entre 1024 e 1439px, e 280px de piso sangrava para fora dela.
const WIDE = "w-full xs:w-auto xs:min-w-[min(280px,100%)] min-h-14 px-6 py-4";
const FULL = "w-full xs:min-w-[min(280px,100%)] min-h-14 px-6 py-4";
// Em tela estreita a doca reserva uma linha inteira ao CTA. Em outras larguras,
// ela pode quebrar a linha sem reduzir o alvo ou cortar o rotulo ampliado.
const COMPACT = "w-full xs:w-auto shrink-0 min-h-12 px-4 py-3";

const LABEL =
  "block whitespace-normal py-1 transition-[translate] duration-(--motion-base) ease-(--ease-default) " +
  "motion-safe:group-hover/botao:-translate-y-full motion-safe:group-focus-visible/botao:-translate-y-full";

/**
 * @param {object} props
 * @param {import("../../infra/contracts.js").CtaPosition} props.position - Posicao do botao na pagina (dobra, espelho, doca...), enviada ao rastreador e a `data-posicao`.
 * @param {boolean} [props.isCompact=false] - Versao compacta, para a doca.
 * @param {boolean} [props.isGhost=false] - Variante em contorno, usada no rodape.
 * @param {boolean} [props.isFullWidth=false] - Ocupa a largura total do pai.
 * @param {boolean} [props.shouldHideDock=false] - Marca o botao como alvo da doca.
 * @returns {JSX.Element}
 */
export function CtaButton({ position, isCompact = false, isGhost = false, isFullWidth = false, shouldHideDock = false }) {
  const buttonRef = useRef(null);
  const params = useCampaignParams();
  function handleClick() {
    // Daqui para baixo nada cancela nem atrasa a navegacao: animacao e tracker sao sincronos e isolados
    // um do outro. Nenhum dos dois lanca para quem chama: `callChoreography` e `evento` ja isolam o erro.
    pulse(buttonRef.current);
    // Intencao, nao fato. `Purchase` nasce na Hotmart (RF-L29).
    trackCheckoutStart(position);
  }

  return (
    <a
      ref={buttonRef}
      className={`${BASE} ${isGhost ? GHOST : SOLID} ${isCompact ? COMPACT : isFullWidth ? FULL : WIDE}`}
      href={buildCheckoutUrl(params)}
      onClick={handleClick}
      onAuxClick={(event) => { if (event.button === 1) handleClick(); }}
      data-posicao={position}
      data-oculta-doca={shouldHideDock ? "" : undefined}
    >
      <span className="botao__rolo relative block min-w-0 overflow-clip">
        <span className={LABEL}>{CTA_SHORT_VERB}</span>
        <span className={`${LABEL} absolute inset-x-0 top-full`} aria-hidden="true">
          {CTA_SHORT_VERB}
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
