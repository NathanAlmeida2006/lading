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
 * Fábrica do Clarity: injeta o script uma vez, só com aceite e id, e envia tags e eventos.
 * O Clarity grava a sessão (replay): por isso espera o mesmo aceite do pixel e para quando ele é retirado.
 * @param {() => (boolean|null)} readConsent - Lê a resposta do consentimento; só `true` libera o Clarity.
 * @param {() => Record<string, string|undefined>} [getTags] - Tags a gravar na sessão ao carregar (`{criativo: utm_content}`); valor vazio é ignorado.
 * @returns {import("./contracts.js").ClarityPort} A porta do Clarity.
 */
export function createClarity(readConsent, getTags = () => ({})) {
  let isInjected = false; // o script que ESTE modulo pos na pagina; `window.clarity` alheio nao conta
  let hasFailed = false; // o script nao carregou (bloqueado): o stub enfileiraria para sempre
  let isRevoked = false;
  let hasTagged = false;
  let hasWarned = false;

  /**
   * @param {boolean} [isForSending=true] - `false` para só carregar; `true` (padrão) para enviar.
   * @returns {boolean} `true` quando o Clarity pode carregar ou enviar.
   */
  function isEligible(isForSending = true) {
    if (readConsent() !== true || !CLARITY_ID_PATTERN.test(getClarityId())) return false;
    return !isForSending || (isInjected && !hasFailed && getClarity() !== undefined);
  }

  /**
   * Idempotente: um script por carga de página. Sem aceite, revoga um Clarity já carregado (`consent` falso). Na recusa
   * explícita (`false`) expira `_clck` e `_clsk`, mesmo sem script nesta carga; com novo aceite, só devolve a permissão.
   * @returns {void}
   */
  function loadClarity() {
    const consent = readConsent();
    if (consent !== true) {
      if (isInjected && !isRevoked) {
        isRevoked = true;
        try { getClarity()?.("consent", false); } catch { /* o tracker nao derruba a pagina */ }
      }
      // Recusa explicita apaga `_clck` e `_clsk` mesmo sem script nesta carga (cookie de uma visita anterior que aceitou).
      if (consent === false || isRevoked) expireCookies(CLARITY_COOKIE_NAMES);
      return;
    }
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
        const script = document.createElement("script");
        script.async = true;
        script.src = `https://www.clarity.ms/tag/${getClarityId()}`;
        script.onerror = () => { hasFailed = true; console.warn("[Clarity] script bloqueado (CSP, adblock ou rede)"); };
        document.head.appendChild(script);
        isInjected = true;
      } catch {
        return;
      }
    } else if (isRevoked) {
      isRevoked = false;
      try { getClarity()?.("consent", true); } catch { /* o tracker nao derruba a pagina */ }
    }
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
