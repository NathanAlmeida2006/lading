import { useSyncExternalStore } from "react";
import { CONFIG } from "./config.js";
import { readSessionValue, writeSessionValue } from "./storage.js";

const PARAMS_STORAGE_KEY = "fluor:params";

// Lista permitida: so estas chaves sao lidas da URL e repassadas ao checkout.
const TRACKING_PARAM_KEYS = /** @type {const} */ ([
  "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
  "fbclid", "src", "sck",
]);

/** @typedef {(typeof TRACKING_PARAM_KEYS)[number]} TrackingParamKey Chave de rastreio permitida. */

/** @typedef {Partial<Record<TrackingParamKey, string>>} CampaignParams Parâmetros da visita: só chaves de rastreio, com valor de texto permitido. */

/**
 * @param {string} key - Chave a conferir.
 * @returns {key is TrackingParamKey} `true` quando a chave está na lista permitida.
 */
const isTrackingKey = (key) => TRACKING_PARAM_KEYS.some((known) => known === key);

const ALLOWED_VALUE_PATTERN = /^[\w.~:+%-]+$/;
// Teto por valor. O `fbclid` real passa de 100 caracteres e a Meta nao documenta o maximo: 500 deixa folga
// e a URL do checkout segue muito abaixo dos limites de URL (cerca de 2000).
/** @type {Partial<Record<TrackingParamKey, number>>} */
const MAX_VALUE_LENGTH = { fbclid: 500 };
const DEFAULT_MAX_VALUE_LENGTH = 100;

/**
 * Valor de texto, so com os caracteres permitidos e dentro do teto da chave.
 * @param {TrackingParamKey} key - Chave de rastreio.
 * @param {unknown} value - Valor a conferir.
 * @returns {value is string} `true` quando o valor pode seguir para o checkout.
 */
const isAllowedValue = (key, value) =>
  typeof value === "string" && value.length <= (MAX_VALUE_LENGTH[key] ?? DEFAULT_MAX_VALUE_LENGTH) && ALLOWED_VALUE_PATTERN.test(value);

/**
 * O valor guardado so vale se for objeto simples, de chaves de rastreio com valor permitido; qualquer outra coisa e descartada.
 * @param {unknown} saved - O que veio do sessionStorage.
 * @returns {CampaignParams} O guardado, ou `{}` quando corrompido.
 */
function sanitizeSavedParams(saved) {
  if (saved === null || typeof saved !== "object" || Array.isArray(saved)) return {};
  const entries = Object.entries(saved);
  return entries.every(([key, value]) => isTrackingKey(key) && isAllowedValue(key, value)) ? /** @type {CampaignParams} */ (saved) : {};
}

/* -------------------------------------------------------------------------
   Parametros de campanha
   ------------------------------------------------------------------------- */

/**
 * Le a URL uma vez e guarda o que veio (RF-L30). A gravacao e necessaria
 * porque a rolagem por ancora reescreve o hash, e um `history.replaceState`
 * de terceiro pode levar a query junto. Visita nova com campanha SUBSTITUI o
 * guardado (nao mescla: UTMs de anuncios diferentes nao se misturam); sem
 * campanha na URL, o guardado continua.
 * @returns {CampaignParams} Os parametros de rastreio da URL, ou os guardados na sessão quando a URL não traz nenhum.
 */
export function captureCampaignParams() {
  /** @type {CampaignParams} */
  const fromUrl = {};
  const search = new URLSearchParams(window.location.search);
  for (const key of TRACKING_PARAM_KEYS) {
    const value = search.get(key);
    if (value) fromUrl[key] = value;
  }
  if (Object.keys(fromUrl).length) {
    writeSessionValue(PARAMS_STORAGE_KEY, fromUrl);
    return fromUrl;
  }
  return sanitizeSavedParams(readSessionValue(PARAMS_STORAGE_KEY));
}

/** @type {CampaignParams} */
const EMPTY_PARAMS = {};

const subscribeNoop = () => () => {};
const getEmptyParamsOnServer = () => EMPTY_PARAMS;

/**
 * Monta a URL do checkout com a origem preservada (RF-L26). A URL-base de
 * `CONFIG.checkout.url` sai como esta (origin, pathname e query): so se
 * ACRESCENTA, e chave que a base ja traz nao e sobrescrita. Sem URL confirmada
 * o href fica intacto.
 *
 * Limitacao: em build estatico sem JavaScript o link do checkout funciona e
 * aponta para a URL-base, mas as UTMs da visita nao sao repassadas, porque a
 * leitura e o repasse ocorrem no navegador.
 * @param {Record<string, unknown>|CampaignParams} [params={}] - Parametros da visita; só as chaves de rastreio com valor de texto permitido entram.
 * @returns {string} A URL do checkout, com os parametros acrescentados, ou a URL-base intacta.
 */
export function buildCheckoutUrl(params = {}) {
  const {
    url,
    urlConfirmada: isUrlConfirmed,
    parametroRastreio: trackingParam,
    parametroConfirmado: isTrackingParamConfirmed,
  } = CONFIG.checkout;
  if (isUrlConfirmed !== true) return url;
  let base;
  try {
    base = new URL(url);
  } catch {
    return url;
  }
  /** @type {CampaignParams} */
  const allowed = {};
  for (const key of TRACKING_PARAM_KEYS) {
    const value = params?.[key];
    if (isAllowedValue(key, value)) allowed[key] = value;
  }
  /**
   * @param {string} key - Chave a acrescentar.
   * @param {string} value - Valor da chave.
   */
  const appendIfMissing = (key, value) => {
    if (!base.searchParams.has(key)) base.searchParams.append(key, value);
  };
  for (const [key, value] of Object.entries(allowed)) appendIfMissing(key, value);
  if (allowed.utm_source) appendIfMissing("src", allowed.utm_source); // Hotmart: src = origem
  const origin = allowed.utm_content ?? allowed.utm_campaign ?? allowed.src;
  if (origin && isTrackingParamConfirmed === true && typeof trackingParam === "string" && trackingParam.trim()) {
    appendIfMissing(trackingParam.trim(), origin);
  }
  return base.href;
}

/**
 * Fábrica dos parametros de campanha para o `CtaButton`:lidos aqui e nao recebidos por prop: nada atravessa a arvore, e so os
 * botoes re-renderizam quando a visita traz campanha. No servidor e na hidratacao, `{}`.
 * @returns {{useCampaignParams: () => CampaignParams}} O hook que lê os parametros da visita.
 */
export function createCampaignParams() {
  /** @type {CampaignParams|undefined} */
  let params; // capturados uma vez por carga, no primeiro pedido do navegador

  /**
   * Os parametros da visita; o mesmo `{}` quando nao ha campanha, para ninguem re-renderizar a toa.
   * @returns {CampaignParams} Os parametros da visita.
   */
  function readCampaignParams() {
    if (params === undefined) {
      const captured = captureCampaignParams();
      params = Object.keys(captured).length ? captured : EMPTY_PARAMS;
    }
    return params;
  }

  /**
   * Hook: os parametros da visita, sem re-renderizar quando não mudam.
   * @returns {CampaignParams} Os parametros da visita.
   */
  function useCampaignParams() {
    return useSyncExternalStore(subscribeNoop, readCampaignParams, getEmptyParamsOnServer);
  }

  return { useCampaignParams };
}
