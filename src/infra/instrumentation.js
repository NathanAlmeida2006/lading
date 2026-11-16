/**
 * Instrumentacao: parametros, consentimento, pixel e alcance das secoes.
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
import { createCampaignParams } from "./params.js";
import { createConsent } from "./consent.js";
import { createPixel } from "./pixel.js";
import { createReach } from "./reach.js";

export { captureCampaignParams, buildCheckoutUrl } from "./params.js";

const campaignParams = createCampaignParams();
const consent = createConsent();
const pixel = createPixel(consent.readConsent);
const reach = createReach({ subscribeToConsent: consent.subscribeToConsent, pixel });

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
 * Registra a intenção de checkout no clique de um CTA (ver `createPixel`).
 * @param {import("./contracts.js").CtaPosition} ctaPosition - Posição do CTA clicado.
 * @returns {void}
 */
export const trackCheckoutStart = pixel.trackCheckoutStart;

/**
 * Liga a mensuração de alcance das seções (ver `createReach`).
 * @param {import("./contracts.js").ReachById} [reachById={}] - Mapa de alcance das seções.
 * @returns {() => void} Desliga a mensuração.
 */
export const startMeasurement = reach.startMeasurement;
