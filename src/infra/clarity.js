import { CONFIG } from "./config.js";
import { expireCookies } from "./storage.js";

/* -------------------------------------------------------------------------
   Microsoft Clarity
   ------------------------------------------------------------------------- */

/** @typedef {((...args: unknown[]) => void) & {q?: unknown[]}} ClarityFunction O `clarity` do snippet da Microsoft: guarda as chamadas em `q` até o script carregar. */

// O id vira parte da URL do script: so letras e numeros entram.
const CLARITY_ID_PATTERN = /^[a-z0-9]+$/i;
const CLARITY_COOKIE_NAMES = ["_clck", "_clsk"];

const getClarityId = () => String(CONFIG.clarity.id ?? "").trim();

/**
 * A janela com o global do Clarity, ainda `unknown`: vem de fora do código.
 * @returns {Window & {clarity?: unknown}} A janela.
 */
const getTrackerWindow = () => window;

/**
 * O `clarity` da página, só se for função.
 * @returns {ClarityFunction|undefined} O `clarity`, ou `undefined` quando não há função.
 */
function getClarity() {
  const candidate = getTrackerWindow().clarity;
  return typeof candidate === "function" ? /** @type {ClarityFunction} */ (candidate) : undefined;
}

/**
 * Fábrica do Clarity: injeta o script uma vez por carga, SEM esperar o aviso, e envia tags e eventos. O Clarity grava a
 * sessão (replay) e o mapa de calor; quem decide se ele usa cookies é a Consent API v2: nasce com tudo `denied` (anônimo, sem
 * `_clck` e `_clsk`) e só `analytics_Storage` passa a `granted` no aceite. `ad_Storage` fica sempre `denied`: a landing não usa
 * os anúncios da Microsoft.
 * @param {() => (boolean|null)} readConsent - Lê a resposta do consentimento; só `true` libera os cookies de análise.
 * @param {() => Record<string, string|undefined>} [getTags] - Tags a gravar na sessão ao carregar (`{criativo: utm_content}`); valor vazio é ignorado.
 * @returns {import("./contracts.js").ClarityPort} A porta do Clarity.
 */
export function createClarity(readConsent, getTags = () => ({})) {
  let isInjected = false; // o script que ESTE modulo pos na pagina; `window.clarity` alheio nao conta
  let hasFailed = false; // o script nao carregou (bloqueado): o stub enfileiraria para sempre
  let isGranted = false; // o ultimo estado de cookies enviado ao Clarity (o padrao enviado na injecao e negado)
  let hasTagged = false;
  let hasWarned = false;

  /**
   * @param {boolean} [isForSending=true] - `false` para só carregar; `true` (padrão) para enviar.
   * @returns {boolean} `true` quando o Clarity pode carregar ou enviar. Não depende do aviso: a coleta anônima é o padrão.
   */
  function isEligible(isForSending = true) {
    if (!CLARITY_ID_PATTERN.test(getClarityId())) return false;
    return !isForSending || (isInjected && !hasFailed && getClarity() !== undefined);
  }

  /**
   * Envia o estado de cookies ao Clarity (Consent API v2).
   * @param {boolean} isAnalyticsGranted - `true` libera os cookies de análise; `false` os nega.
   * @returns {void}
   */
  function sendConsent(isAnalyticsGranted) {
    isGranted = isAnalyticsGranted;
    try {
      getClarity()?.("consentv2", { ad_Storage: "denied", analytics_Storage: isAnalyticsGranted ? "granted" : "denied" });
    } catch { /* o tracker nao derruba a pagina */ }
  }

  /**
   * Idempotente: um script por carga de página. A primeira chamada põe o stub, enfileira o padrão negado e só então
   * carrega o script (sem corrida com o primeiro envio). Cada chamada alinha o Clarity com a resposta do aviso: `true`
   * libera `analytics_Storage`; qualquer outra volta a negá-lo. A recusa explícita (`false`), ou o aceite retirado,
   * expira `_clck` e `_clsk` mesmo sem script nesta carga (cookie de uma visita anterior que aceitou).
   * @returns {void}
   */
  function loadClarity() {
    const consent = readConsent();
    if (!isEligible(false)) {
      if (!hasWarned) { hasWarned = true; console.warn("[Clarity] ID não configurado ou inválido (VITE_CLARITY_ID): script não carregado"); }
      return;
    }
    if (!isInjected) {
      if (getTrackerWindow().clarity) return; // clarity de outra origem: este modulo nao assume o que nao carregou
      try {
        const clarity = /** @type {ClarityFunction} */ (function () {
          (clarity.q = clarity.q || []).push(arguments);
        });
        getTrackerWindow().clarity = clarity;
        sendConsent(false); // o padrao negado entra na fila antes do script existir
        const script = document.createElement("script");
        script.async = true;
        script.src = `https://www.clarity.ms/tag/${getClarityId()}`;
        script.onerror = () => { hasFailed = true; console.warn("[Clarity] script bloqueado (CSP, adblock ou rede)"); };
        document.head.appendChild(script);
        isInjected = true;
      } catch {
        return;
      }
    }
    const wasGranted = isGranted;
    if ((consent === true) !== isGranted) sendConsent(consent === true);
    if (consent === false || (consent !== true && wasGranted)) expireCookies(CLARITY_COOKIE_NAMES);
    if (!hasTagged) {
      hasTagged = true;
      for (const [key, value] of Object.entries(getTags())) if (value) setTag(key, value);
    }
  }

  /**
   * @param {string} key - Nome da tag (filtro no painel do Clarity).
   * @param {string} value - Valor da tag.
   * @returns {void}
   */
  function setTag(key, value) {
    try { if (isEligible()) getClarity()?.("set", key, value); } catch { /* o tracker nao derruba a pagina */ }
  }

  /**
   * @param {string} name - Nome do evento personalizado.
   * @returns {void}
   */
  function sendEvent(name) {
    try { if (isEligible()) getClarity()?.("event", name); } catch { /* o tracker nao derruba a pagina */ }
  }

  return { isEligible, loadClarity, setTag, sendEvent };
}
