/**
 * Instrumentacao: parametros, consentimento, pixel, Clarity e alcance das secoes.
 *
 * Regra que organiza o arquivo inteiro (RF-L29): a landing reporta INTENCAO,
 * a Hotmart reporta o FATO. `Purchase` nao nasce aqui. Pixel que dispara compra
 * no clique conta venda que pode nao ter acontecido, e o ledger passa a
 * registrar receita que o extrato desmente.
 *
 * O estado de mensuracao mora nas fabricas, instanciadas uma vez aqui, e nao em
 * componente: sobrevive ao StrictMode e a remontagem, e a pagina tem um dono so
 * para "ja enviei isto?".
 */
import { createCampaignParams, captureCampaignParams } from "./params.js";
import { CONFIG } from "./config.js";
import { createConsent } from "./consent.js";
import { createPixel } from "./pixel.js";
import { createClarity } from "./clarity.js";
import { createReach } from "./reach.js";

export { captureCampaignParams, buildCheckoutUrl } from "./params.js";

const campaignParams = createCampaignParams();
const consent = createConsent();
const pixel = createPixel(consent.readConsent);
// `criativo` = utm_content do anuncio: filtra as gravacoes por criativo no painel do Clarity. `captureCampaignParams`
// so devolve valor ja validado (mesma regra do checkout), entao a URL nunca escreve texto livre na tag.
const clarity = createClarity(consent.readConsent, () => ({ criativo: captureCampaignParams().utm_content }));
const reach = createReach({ subscribeToConsent: consent.subscribeToConsent, pixel, clarity });

/** @param {(posthog: typeof import("./posthog.js").posthog) => void} callback */
function withPostHog(callback) {
  if (typeof window === "undefined") return;
  void import("./posthog.js").then(({ isPostHogInitialized, posthog }) => {
    if (isPostHogInitialized()) callback(posthog);
  }).catch(() => {});
}

function syncPostHogConsent() {
  if (typeof window === "undefined") return;
  void import("./posthog.js").then(({ setPostHogConsent }) => {
    setPostHogConsent(consent.readConsent());
  }).catch(() => {});
}

consent.subscribeToConsent(syncPostHogConsent);
syncPostHogConsent();

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
 * Registra a intenção de checkout no clique de um CTA (ver `createPixel` e `createClarity`).
 * @param {import("./contracts.js").CtaPosition} ctaPosition - Posição do CTA clicado.
 * @returns {void}
 */
export function trackCheckoutStart(ctaPosition) {
  withPostHog((posthog) => {
    posthog.capture("checkout_started", { cta_position: ctaPosition });
    posthog.captureLog({ body: "checkout intent recorded", level: "info", attributes: { cta_position: ctaPosition } });
  });
  pixel.trackCheckoutStart(ctaPosition);
  if (CONFIG.checkout.urlConfirmada === true) clarity.sendEvent("clicou_checkout");
}

/** Registra o início da experiência de vídeo da página. */
export function trackVideoStart() {
  withPostHog((posthog) => {
    posthog.capture("video_started");
    posthog.captureLog({ body: "landing video started", level: "info" });
  });
}

/**
 * Registra a abertura de uma resposta de dúvida antes da compra.
 * @param {number} faqPosition - Posição da pergunta na lista, começando em 1.
 */
export function trackFaqOpen(faqPosition) {
  withPostHog((posthog) => {
    posthog.capture("faq_opened", { faq_position: faqPosition });
    posthog.captureLog({ body: "faq answer opened", level: "info", attributes: { faq_position: faqPosition } });
  });
}

/**
 * Liga a mensuração de alcance das seções (ver `createReach`).
 * @param {import("./contracts.js").ReachById} [reachById={}] - Mapa de alcance das seções.
 * @returns {() => void} Desliga a mensuração.
 */
export const startMeasurement = reach.startMeasurement;
