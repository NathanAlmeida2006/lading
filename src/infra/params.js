import { useSyncExternalStore } from "react";
import { CONFIG } from "./config.js";
import { readSessionValue, writeSessionValue } from "./storage.js";

const PARAMS_STORAGE_KEY = "fluor:params";

// Lista permitida: só estas chaves são lidas da URL e repassadas ao checkout.
const TRACKING_PARAM_KEYS = /** @type {const} */ ([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
  "src",
  "sck",
]);

/** @typedef {(typeof TRACKING_PARAM_KEYS)[number]} TrackingParamKey Chave de rastreio permitida. */

/** @typedef {Partial<Record<TrackingParamKey, string>>} CampaignParams Parâmetros da visita: só chaves de rastreio, com valor de texto permitido. */

// Letras (com acento), números, espaço e os separadores comuns de campanha. O `URLSearchParams` decodifica `+` e `%20`
// para espaço e `%C3%A7` para `ç`; na saída, `searchParams.append` codifica de novo, então nada aqui vira URL crua.
// Sem `<`, `>`, aspas, `&`, `=`, `#` nem controle (quebra de linha, tab): o que não é valor de campanha fica de fora.
// Sem `@`, nem o `%40` de um duplo encode: e-mail não é valor de campanha, e iria de tag ao Clarity e de `sck` a Hotmart.
const ALLOWED_VALUE_PATTERN = /^[\p{L}\p{N} ._~:+%/-]+$/u;
const ENCODED_AT_PATTERN = /%40/i;
// Teto por valor. O `fbclid` real passa de 100 caracteres e a Meta não documenta o máximo: 500 deixa folga
// e a URL do checkout segue muito abaixo dos limites de URL (cerca de 2000).
/** @type {Partial<Record<TrackingParamKey, number>>} */
const MAX_VALUE_LENGTH = { fbclid: 500 };
const DEFAULT_MAX_VALUE_LENGTH = 128;

/**
 * Valor de texto, só com os caracteres permitidos e dentro do teto da chave.
 * @param {TrackingParamKey} key - Chave de rastreio.
 * @param {unknown} value - Valor a conferir.
 * @returns {value is string} `true` quando o valor pode seguir para o checkout.
 */
const isAllowedValue = (key, value) =>
  typeof value === "string" &&
  value.trim() !== "" &&
  value.length <= (MAX_VALUE_LENGTH[key] ?? DEFAULT_MAX_VALUE_LENGTH) &&
  ALLOWED_VALUE_PATTERN.test(value) &&
  !ENCODED_AT_PATTERN.test(value);

/**
 * Filtra chave a chave: cada valor inválido cai sozinho e os válidos sobrevivem. Vale para a URL e para o que veio
 * do sessionStorage (que pode estar corrompido: qualquer coisa que não seja objeto simples vira `{}`).
 * @param {unknown} candidate - O que veio da URL ou do sessionStorage.
 * @returns {CampaignParams} Só as chaves de rastreio com valor permitido.
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
   Parâmetros de campanha
   ------------------------------------------------------------------------- */

/**
 * As chaves de rastreio da URL desta carga: só as permitidas, com valor permitido.
 * @returns {CampaignParams} O que a URL traz e pode seguir.
 */
const readUrlParams = () => {
  const search = new URLSearchParams(window.location.search);
  return keepAllowedParams(
    Object.fromEntries(TRACKING_PARAM_KEYS.map((key) => [key, search.get(key)])),
  );
};

/**
 * Lê a URL e guarda o que veio (RF-L30). A gravação é necessária porque quem abre a política ou os termos volta para `/`
 * sem query. Tudo passa por `keepAllowedParams` antes de sair e antes de gravar. A visita com campanha na URL se MESCLA ao
 * guardado (a URL ganha chave a chave); sem campanha na URL, o guardado continua como está. Roda uma vez por carga, na
 * criação de `createCampaignParams`: nunca dentro de render.
 * @returns {CampaignParams} Os parâmetros de rastreio válidos: URL por cima do guardado na sessão.
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
    /* sem history ou URL estranha: a URL segue como está */
  }
}

/** @type {CampaignParams} */
const EMPTY_PARAMS = {};

const subscribeNoop = () => () => {};
const getEmptyParamsOnServer = () => EMPTY_PARAMS;

/**
 * Monta a URL do checkout com a origem preservada (RF-L26). A URL-base de
 * `CONFIG.checkout.url` sai como está (origin, pathname e query): só se
 * ACRESCENTA, e chave que a base já traz não é sobrescrita. Sem URL confirmada
 * o href fica intacto.
 *
 * Limitação: em build estático sem JavaScript o link do checkout funciona e
 * aponta para a URL-base, mas as UTMs da visita não são repassadas, porque a
 * leitura e o repasse ocorrem no navegador.
 * @param {Record<string, unknown>|CampaignParams} [params={}] - Parâmetros da visita; só as chaves de rastreio com valor de texto permitido entram.
 * @returns {string} A URL do checkout, com os parâmetros acrescentados, ou a URL-base intacta.
 */
export function buildCheckoutUrl(params = {}) {
  const {
    url,
    confirmedUrl: isUrlConfirmed,
    trackingParam: trackingParam,
    confirmedParam: isTrackingParamConfirmed,
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
  if (
    origin &&
    isTrackingParamConfirmed === true &&
    typeof trackingParam === "string" &&
    trackingParam.trim()
  ) {
    appendIfMissing(trackingParam.trim(), origin);
  }
  return base.href;
}

/**
 * Fábrica dos parâmetros de campanha: captura uma vez, na criação (no navegador), e limpa a URL logo depois, antes de
 * qualquer rastreador carregar. `readCampaignParams` é o snapshot do `useSyncExternalStore`: só lê, nunca grava. No
 * servidor e na hidratação, `{}`.
 * @returns {{useCampaignParams: () => CampaignParams, readCampaignParams: () => CampaignParams}} O hook e a leitura dos parametros da visita.
 */
export function createCampaignParams() {
  /** @type {CampaignParams} */
  let params = EMPTY_PARAMS; // o mesmo `{}` quando não há campanha, para ninguém re-renderizar à toa
  if (typeof window !== "undefined") {
    try {
      const captured = captureCampaignParams();
      if (Object.keys(captured).length) params = captured;
    } catch {
      /* janela sem location (teste ou ambiente estranho): sem parâmetros */
    }
    cleanUrl();
  }

  /**
   * Os parâmetros da visita, sempre o mesmo objeto.
   * @returns {CampaignParams} Os parâmetros da visita.
   */
  const readCampaignParams = () => params;

  /**
   * Hook: os parâmetros da visita, sem re-renderizar quando não mudam.
   * @returns {CampaignParams} Os parâmetros da visita.
   */
  function useCampaignParams() {
    return useSyncExternalStore(subscribeNoop, readCampaignParams, getEmptyParamsOnServer);
  }

  return { useCampaignParams, readCampaignParams };
}
