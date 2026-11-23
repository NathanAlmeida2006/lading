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

// Letras (com acento), numeros, espaco e os separadores comuns de campanha. O `URLSearchParams` decodifica `+` e `%20`
// para espaco e `%C3%A7` para `ç`; na saida, `searchParams.append` codifica de novo, entao nada aqui vira URL crua.
// Sem `<`, `>`, aspas, `&`, `=`, `#` nem controle (quebra de linha, tab): o que nao e valor de campanha fica de fora.
// Sem `@`, nem o `%40` de um duplo encode: e-mail nao e valor de campanha, e iria de tag ao Clarity e de `sck` a Hotmart.
const ALLOWED_VALUE_PATTERN = /^[\p{L}\p{N} ._~:+%/-]+$/u;
const ENCODED_AT_PATTERN = /%40/i;
// Teto por valor. O `fbclid` real passa de 100 caracteres e a Meta nao documenta o maximo: 500 deixa folga
// e a URL do checkout segue muito abaixo dos limites de URL (cerca de 2000).
/** @type {Partial<Record<TrackingParamKey, number>>} */
const MAX_VALUE_LENGTH = { fbclid: 500 };
const DEFAULT_MAX_VALUE_LENGTH = 128;

/**
 * Valor de texto, so com os caracteres permitidos e dentro do teto da chave.
 * @param {TrackingParamKey} key - Chave de rastreio.
 * @param {unknown} value - Valor a conferir.
 * @returns {value is string} `true` quando o valor pode seguir para o checkout.
 */
const isAllowedValue = (key, value) =>
  typeof value === "string" && value.trim() !== "" && value.length <= (MAX_VALUE_LENGTH[key] ?? DEFAULT_MAX_VALUE_LENGTH) && ALLOWED_VALUE_PATTERN.test(value) && !ENCODED_AT_PATTERN.test(value);

/**
 * Filtra chave a chave: cada valor invalido cai sozinho e os validos sobrevivem. Vale para a URL e para o que veio
 * do sessionStorage (que pode estar corrompido: qualquer coisa que nao seja objeto simples vira `{}`).
 * @param {unknown} candidate - O que veio da URL ou do sessionStorage.
 * @returns {CampaignParams} So as chaves de rastreio com valor permitido.
 */
function keepAllowedParams(candidate) {
  /** @type {CampaignParams} */
  const kept = {};
  if (candidate === null || typeof candidate !== "object" || Array.isArray(candidate)) return kept;
  const record = /** @type {Record<string, unknown>} */ (candidate);
  for (const key of TRACKING_PARAM_KEYS) {
    const value = record[key];
    if (isAllowedValue(key, value)) kept[key] = value;
  }
  return kept;
}

/* -------------------------------------------------------------------------
   Parametros de campanha
   ------------------------------------------------------------------------- */

/**
 * As chaves de rastreio da URL desta carga: só as permitidas, com valor permitido.
 * @returns {CampaignParams} O que a URL traz e pode seguir.
 */
const readUrlParams = () => {
  const search = new URLSearchParams(window.location.search);
  return keepAllowedParams(Object.fromEntries(TRACKING_PARAM_KEYS.map((key) => [key, search.get(key)])));
};

/**
 * Le a URL e guarda o que veio (RF-L30). A gravacao e necessaria porque quem abre a politica ou os termos volta para `/`
 * sem query. Tudo passa por `keepAllowedParams` antes de sair e antes de gravar. A visita com campanha na URL se MESCLA ao
 * guardado (a URL ganha chave a chave); sem campanha na URL, o guardado continua como esta. Roda uma vez por carga, na
 * criacao de `createCampaignParams`: nunca dentro de render.
 * @returns {CampaignParams} Os parametros de rastreio validos: URL por cima do guardado na sessão.
 */
export function captureCampaignParams() {
  const fromUrl = readUrlParams();
  const saved = keepAllowedParams(readSessionValue(PARAMS_STORAGE_KEY));
  if (!Object.keys(fromUrl).length) return saved;
  const merged = { ...saved, ...fromUrl };
  writeSessionValue(PARAMS_STORAGE_KEY, merged);
  return merged;
}

/**
 * Reescreve a URL da barra só com as chaves de rastreio permitidas e válidas: o resto (e-mail, token, chave desconhecida,
 * valor recusado) some antes de qualquer rastreador ler `location.href`. O hash fica; nada recarrega nem entra no
 * histórico. Sem nada a tirar, a URL não é tocada.
 * @returns {void}
 */
export function cleanUrl() {
  try {
    const url = new URL(window.location.href);
    const search = new URLSearchParams(readUrlParams()).toString();
    if (url.search.slice(1) === search) return;
    url.search = search;
    window.history.replaceState(window.history.state, "", url.href);
  } catch {
    /* sem history ou URL estranha: a URL segue como esta */
  }
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
 * Fábrica dos parametros de campanha: captura uma vez, na criacao (no navegador), e limpa a URL logo depois, antes de
 * qualquer rastreador carregar. `readCampaignParams` e o snapshot do `useSyncExternalStore`: so le, nunca grava. No
 * servidor e na hidratacao, `{}`.
 * @returns {{useCampaignParams: () => CampaignParams, readCampaignParams: () => CampaignParams}} O hook e a leitura dos parametros da visita.
 */
export function createCampaignParams() {
  /** @type {CampaignParams} */
  let params = EMPTY_PARAMS; // o mesmo `{}` quando nao ha campanha, para ninguem re-renderizar a toa
  if (typeof window !== "undefined") {
    try {
      const captured = captureCampaignParams();
      if (Object.keys(captured).length) params = captured;
    } catch {
      /* janela sem location (teste ou ambiente estranho): sem parametros */
    }
    cleanUrl();
  }

  /**
   * Os parametros da visita, sempre o mesmo objeto.
   * @returns {CampaignParams} Os parametros da visita.
   */
  const readCampaignParams = () => params;

  /**
   * Hook: os parametros da visita, sem re-renderizar quando não mudam.
   * @returns {CampaignParams} Os parametros da visita.
   */
  function useCampaignParams() {
    return useSyncExternalStore(subscribeNoop, readCampaignParams, getEmptyParamsOnServer);
  }

  return { useCampaignParams, readCampaignParams };
}
