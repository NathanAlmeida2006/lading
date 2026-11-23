/**
 * Instrumentacao: parametros, consentimento, os tres rastreadores (Pixel, Clarity e PostHog) e alcance das secoes.
 *
 * Regra que organiza o arquivo inteiro (RF-L29): a landing reporta INTENCAO,
 * a Hotmart reporta o FATO. `Purchase` nao nasce aqui. Pixel que dispara compra
 * no clique conta venda que pode nao ter acontecido, e o ledger passa a
 * registrar receita que o extrato desmente.
 *
 * O estado de mensuracao mora nas fabricas, instanciadas uma vez aqui, e nao em
 * componente: sobrevive ao StrictMode e a remontagem, e a pagina tem um dono so
 * para "ja enviei isto?".
 *
 * Um orquestrador so liga o consentimento aos tres rastreadores (`syncTrackers`): cada resposta do aviso, e a largada da
 * medicao, carrega, libera ou revoga Pixel, Clarity e PostHog, na mesma ordem. O alcance (reach.js) so observa as secoes.
 */
import { createCampaignParams } from "./params.js";
import { CONFIG } from "./config.js";
import { createConsent } from "./consent.js";
import { createPixel } from "./pixel.js";
import { createClarity } from "./clarity.js";
import { createPostHog } from "./posthog.js";
import { createReach } from "./reach.js";

export { buildCheckoutUrl } from "./params.js";

// Primeiro de tudo: le os parametros da visita uma vez e limpa a URL (params.js), antes de qualquer rastreador carregar.
const campaignParams = createCampaignParams();
const consent = createConsent();
const pixel = createPixel(consent.readConsent);
// `criativo` = utm_content do anuncio: filtra as gravacoes por criativo no painel do Clarity. A captura so guarda valor ja
// validado (mesma regra do checkout), entao a URL nunca escreve texto livre na tag.
const clarity = createClarity(consent.readConsent, () => ({ criativo: campaignParams.readCampaignParams().utm_content }));
const posthog = createPostHog(consent.readConsent);
const reach = createReach({ subscribeToConsent: consent.subscribeToConsent, pixel, clarity });

/**
 * O orquestrador do consentimento: os tres rastreadores, na mesma ordem, a cada resposta do aviso.
 * @returns {void}
 */
function syncTrackers() {
  pixel.loadPixel();
  clarity.loadClarity();
  posthog.loadPostHog();
}

/**
 * Hook: os parametros da visita (ver `createCampaignParams`).
 * @returns {import("./params.js").CampaignParams} Os parametros da visita.
 */
export const useCampaignParams = campaignParams.useCampaignParams;

/**
 * Lê a resposta do consentimento (ver `createConsent`).
 * @returns {boolean|null} `true`, `false`, ou `null` sem resposta.
 */
export const readConsent = consent.readConsent;

/**
 * Assina as mudanças do consentimento (ver `createConsent`).
 * @param {() => void} subscriber - Chamado a cada resposta do visitante.
 * @returns {() => void} Cancela a assinatura.
 */
export const subscribeToConsent = consent.subscribeToConsent;

/**
 * Hook: a resposta do consentimento (ver `createConsent`).
 * @returns {boolean|null} A resposta atual do visitante.
 */
export const useConsent = consent.useConsent;

/**
 * Grava a resposta do consentimento (ver `createConsent`).
 * @param {unknown} accepted - `true` quando o visitante aceitou; `null` para reabrir a escolha; qualquer outro valor é recusa.
 * @returns {void}
 */
export const answerConsent = consent.answerConsent;

/**
 * Registra a intenção de checkout no clique de um CTA, nos três rastreadores. Com checkout não confirmado (o link ainda é a
 * âncora do preview) não há intenção a registrar em nenhum deles: a guarda mora aqui, uma vez só.
 * @param {import("./contracts.js").CtaPosition} ctaPosition - Posição do CTA clicado.
 * @returns {void}
 */
export function trackCheckoutStart(ctaPosition) {
  if (CONFIG.checkout.urlConfirmada !== true) return;
  posthog.capture("checkout_started", { cta_position: ctaPosition });
  posthog.captureLog({ body: "checkout intent recorded", level: "info", attributes: { cta_position: ctaPosition } });
  pixel.trackCheckoutStart(ctaPosition);
  clarity.sendEvent("clicou_checkout");
}

let isVideoStartTracked = false; // `video_started` sai uma vez por carga, mesmo com o Parar e um play novo

/** Registra o início da experiência de vídeo da página, uma vez por carga (o primeiro play). */
export function trackVideoStart() {
  if (isVideoStartTracked) return;
  isVideoStartTracked = true;
  posthog.capture("video_started");
  posthog.captureLog({ body: "landing video started", level: "info" });
}

/**
 * Registra a abertura de uma resposta de dúvida antes da compra.
 * @param {number} faqPosition - Posição da pergunta na lista, começando em 1.
 */
export function trackFaqOpen(faqPosition) {
  posthog.capture("faq_opened", { faq_position: faqPosition });
  posthog.captureLog({ body: "faq answer opened", level: "info", attributes: { faq_position: faqPosition } });
}

/**
 * Liga a medicao: o orquestrador dos rastreadores e o alcance das secoes (ver `createReach`). O orquestrador assina o
 * consentimento ANTES do alcance: na mesma resposta, os scripts ja estao na pagina quando o alcance decide se cria o observador.
 * @param {import("./contracts.js").ReachById} [reachById={}] - Mapa de alcance das seções.
 * @returns {() => void} Desliga a medicao: cancela as duas assinaturas e desconecta o observador.
 */
export function startMeasurement(reachById = {}) {
  const cancelTrackers = consent.subscribeToConsent(syncTrackers);
  syncTrackers();
  const stopReach = reach.startMeasurement(reachById);
  return () => {
    cancelTrackers();
    stopReach();
  };
}
