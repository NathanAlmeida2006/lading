/**
 * Instrumentação: parâmetros, consentimento, os três rastreadores (Pixel, Clarity e PostHog) e alcance das seções.
 *
 * Regra que organiza o arquivo inteiro (RF-L29): a landing reporta INTENÇÃO,
 * a Hotmart reporta o FATO. `Purchase` não nasce aqui. Pixel que dispara compra
 * no clique conta venda que pode não ter acontecido, e o ledger passa a
 * registrar receita que o extrato desmente.
 *
 * O estado de mensuração mora nas fábricas, instanciadas uma vez aqui, e não em
 * componente: sobrevive ao StrictMode e a remontagem, e a página tem um dono só
 * para "já enviei isto?".
 *
 * Um orquestrador só liga o consentimento aos três rastreadores (`syncTrackers`): cada resposta do aviso, e a largada da
 * medição, carrega, libera ou revoga Pixel, Clarity e PostHog, na mesma ordem. O alcance (reach.js) só observa as seções.
 */
import { createCampaignParams } from "./params.js";
import { CONFIG } from "./config.js";
import { createConsent } from "./consent.js";
import { createPixel } from "./pixel.js";
import { createClarity } from "./clarity.js";
import { createPostHog } from "./posthog.js";
import { createReach } from "./reach.js";

export { buildCheckoutUrl } from "./params.js";

// Primeiro de tudo: lê os parâmetros da visita uma vez e limpa a URL (params.js), antes de qualquer rastreador carregar.
const campaignParams = createCampaignParams();
const consent = createConsent();
const pixel = createPixel(consent.readConsent);
// `criativo` = utm_content do anuncio: filtra as gravações por criativo no painel do Clarity. A captura só guarda valor já
// validado (mesma regra do checkout), então a URL nunca escreve texto livre na tag.
const clarity = createClarity(consent.readConsent, () => ({
  criativo: campaignParams.readCampaignParams().utm_content,
}));
const posthog = createPostHog(consent.readConsent);
const reach = createReach({ subscribeToConsent: consent.subscribeToConsent, pixel, clarity });

/**
 * O orquestrador do consentimento: os três rastreadores, na mesma ordem, a cada resposta do aviso.
 * @returns {void}
 */
function syncTrackers() {
  pixel.loadPixel();
  clarity.loadClarity();
  posthog.loadPostHog();
}

/**
 * Hook: os parâmetros da visita (ver `createCampaignParams`).
 * @returns {import("./params.js").CampaignParams} Os parâmetros da visita.
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
  if (CONFIG.checkout.confirmedUrl !== true) return;
  posthog.capture("checkout_started", { cta_position: ctaPosition });
  posthog.captureLog({
    body: "checkout intent recorded",
    level: "info",
    attributes: { cta_position: ctaPosition },
  });
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
  posthog.captureLog({
    body: "faq answer opened",
    level: "info",
    attributes: { faq_position: faqPosition },
  });
}

/**
 * Liga a medição: o orquestrador dos rastreadores e o alcance das seções (ver `createReach`). O orquestrador assina o
 * consentimento ANTES do alcance: na mesma resposta, os scripts já estão na página quando o alcance decide se cria o observador.
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
