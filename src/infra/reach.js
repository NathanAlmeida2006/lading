import { CONFIG } from "./config.js";

/* -------------------------------------------------------------------------
   Alcance das secoes
   ------------------------------------------------------------------------- */

/**
 * @typedef ReachDeps Dependências da mensuração.
 * @property {(subscriber: () => void) => () => void} subscribeToConsent - Assina as mudanças do consentimento.
 * @property {import("./contracts.js").PixelPort} pixel - A porta do pixel.
 * @property {import("./contracts.js").ClarityPort} clarity - A porta do Clarity.
 */

/**
 * @typedef ReachPort A porta do alcance.
 * @property {(reachById?: import("./contracts.js").ReachById) => () => void} startMeasurement - Liga a mensuração e devolve o desligamento.
 */

/**
 * Fábrica da mensuração de alcance das seções: manda um evento por seção, uma vez por carga de página.
 * @param {ReachDeps} deps - Dependências da mensuração.
 * @returns {ReachPort} A porta do alcance.
 */
export function createReach({ subscribeToConsent, pixel, clarity }) {
  const { isEligible, sendEvent } = pixel;
  const sentSections = new Set(); // impressoes de secao ja enviadas ao Pixel nesta carga de pagina
  let isPriceViewSent = false; // o `viu_preco` do Clarity: uma vez por carga, com ou sem o Pixel

  /**
   * Liga a mensuracao da pagina e devolve o desligamento. `reachById` e o mapa de sections.js
   * (id -> { etapa, canonico }); RF-L31 le as canonicas, e a oferta vira `ViewContent`:
   * alcanca-la e o unico ponto da pagina que significa interesse pelo produto.
   *
   * Antes do aceite nao existe observador: nada e marcado nem desobservado. No aceite ele e
   * criado, e a primeira entrega do IntersectionObserver e o estado DAQUELE instante: so conta
   * o que esta na tela. O que ja passou nao e retransmitido, e volta a contar se for revisitado.
   * A impressao so entra em `sentSections` depois de o evento ter saido de fato.
   * @param {import("./contracts.js").ReachById} [reachById={}] - Mapa de alcance das seções (`REACH_BY_ID`).
   * @returns {() => void} Desliga a mensuração: cancela a assinatura do consentimento e desconecta o observador.
   */
  function startMeasurement(reachById = {}) {
    /** @type {IntersectionObserver|undefined} */
    let observer;

    function synchronize() {
      observer?.disconnect();
      observer = undefined;
      // Os scripts ja foram sincronizados pelo orquestrador (instrumentation.js), que assina o consentimento antes do alcance.
      // Pixel e Clarity sao independentes: o observador existe se ao menos um deles pode enviar (o Pixel bloqueado nao cala o Clarity).
      if (!isEligible() && !clarity.isEligible()) return;
      observer = new IntersectionObserver(
        (entries) => {
          for (const { isIntersecting, target } of entries) {
            const id = target.id;
            if (!isIntersecting || !reachById[id]) continue;
            if (id === "oferta" && !isPriceViewSent && clarity.isEligible()) {
              clarity.sendEvent("viu_preco");
              isPriceViewSent = true;
            }
            if (sentSections.has(id)) continue;
            const { etapa: stage, canonico: isCanonical } = reachById[id];
            const base = { secao: id, etapa: stage };
            const isSent = id === "oferta"
              ? sendEvent("ViewContent", { ...base, campanha: CONFIG.campanha })
              : sendEvent("SecaoAlcancada", { ...base, canonico: isCanonical, campanha: CONFIG.campanha });
            if (!isSent) continue;
            sentSections.add(id);
            observer?.unobserve(target);
          }
        },
        // 40% DA JANELA, e nao 40% da secao: a oferta (a pilha de valor, que vira ViewContent) e mais alta que a tela, nunca mostra 40% de si
        // de uma vez, e o evento dela nao disparava. A secao conta como alcancada quando o topo dela
        // cruza a marca de 60% da altura da tela, que e o que 40% significava numa secao de uma tela.
        // O 1px tirado do alto descarta o toque de borda: com a secao seguinte exatamente no topo da tela,
        // a anterior encosta em y=0 sem mostrar nada, e o observador a daria como presente no aceite tardio.
        { rootMargin: "-1px 0px -40% 0px", threshold: 0 },
      );
      for (const id of Object.keys(reachById)) {
        const target = sentSections.has(id) ? null : document.getElementById(id);
        if (target) observer.observe(target);
      }
    }

    const cancel = subscribeToConsent(synchronize);
    synchronize();
    return () => {
      cancel();
      observer?.disconnect();
      observer = undefined;
    };
  }

  return { startMeasurement };
}
