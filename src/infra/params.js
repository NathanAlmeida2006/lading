import { useSyncExternalStore } from "react";
import { CONFIG } from "./config.js";
import { readSessionValue, writeSessionValue } from "./storage.js";

const PARAMS_STORAGE_KEY = "fluor:params";

// Lista permitida: so estas chaves sao lidas da URL e repassadas ao checkout.
const TRACKING_PARAM_KEYS = [
  "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
  "fbclid", "src", "sck",
];
const ALLOWED_VALUE_PATTERN = /^[\w.~:+%-]{1,100}$/;

/* -------------------------------------------------------------------------
   Parametros de campanha
   ------------------------------------------------------------------------- */

/**
 * Le a URL uma vez e guarda o que veio (RF-L30). A gravacao e necessaria
 * porque a rolagem por ancora reescreve o hash, e um `history.replaceState`
 * de terceiro pode levar a query junto.
 * @returns {Record<string, string>} Os parametros de rastreio da visita, somados aos já guardados na sessão.
 */
export function captureCampaignParams() {
  const fromUrl = {};
  const search = new URLSearchParams(window.location.search);
  for (const key of TRACKING_PARAM_KEYS) {
    const value = search.get(key);
    if (value) fromUrl[key] = value;
  }
  const saved = readSessionValue(PARAMS_STORAGE_KEY) ?? {};
  const merged = { ...saved, ...fromUrl };
  if (Object.keys(fromUrl).length) writeSessionValue(PARAMS_STORAGE_KEY, merged);
  return merged;
}

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
 * @param {Record<string, unknown>} [params={}] - Parametros da visita; só as chaves de rastreio com valor de texto permitido entram.
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
  const allowed = {};
  for (const key of TRACKING_PARAM_KEYS) {
    const value = params?.[key];
    if (typeof value === "string" && ALLOWED_VALUE_PATTERN.test(value)) allowed[key] = value;
  }
  const appendIfMissing = (key, value) => {
    if (!base.searchParams.has(key)) base.searchParams.append(key, value);
  };
  for (const [key, value] of Object.entries(allowed)) appendIfMissing(key, value);
  const origin = allowed.utm_content ?? allowed.utm_campaign ?? allowed.src;
  if (origin && isTrackingParamConfirmed === true && typeof trackingParam === "string" && trackingParam.trim()) {
    appendIfMissing(trackingParam.trim(), origin);
  }
  return base.href;
}

/**
 * Fábrica dos parametros de campanha para o `CtaButton`:lidos aqui e nao recebidos por prop: nada atravessa a arvore, e so os
 * botoes re-renderizam quando a visita traz campanha. No servidor e na hidratacao, `{}`.
 * @returns {{useCampaignParams: () => Record<string, string>}} O hook que lê os parametros da visita.
 */
export function createCampaignParams() {
  let params; // capturados uma vez por carga, no primeiro pedido do navegador

  /**
   * Os parametros da visita; o mesmo `{}` quando nao ha campanha, para ninguem re-renderizar a toa.
   * @returns {Record<string, string>} Os parametros da visita.
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
   * @returns {Record<string, string>} Os parametros da visita.
   */
  function useCampaignParams() {
    return useSyncExternalStore(subscribeNoop, readCampaignParams, getEmptyParamsOnServer);
  }

  return { useCampaignParams };
}
