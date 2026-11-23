import { CONFIG } from "./config.js";
import { expireCookies } from "./storage.js";

/* -------------------------------------------------------------------------
   Pixel
   ------------------------------------------------------------------------- */

/**
 * @typedef Fbq O `fbq` que este módulo põe na página: o stub do snippet da Meta.
 * @property {{apply: (thisArg: unknown, args: IArguments) => void}} [callMethod] - Aparece quando o script da Meta assume o stub; o stub o chama por `apply`, com os `arguments` crus.
 * @property {unknown[]} queue - Fila de chamadas feitas antes de o script carregar.
 * @property {unknown} push - O próprio stub.
 * @property {boolean} loaded - Marca de carregado do snippet.
 * @property {string} version - Versão do snippet.
 */

/** @typedef {((...args: unknown[]) => void) & Fbq} FbqFunction */

// Tudo o que a pagina sabe enviar (RF-L28). Nome fora desta lista nao sai: `Purchase` nao tem como nascer aqui.
/** @type {Record<import("./contracts.js").PixelEventName, "track"|"trackCustom">} */
const PIXEL_METHOD_BY_EVENT = {
  PageView: "track",
  ViewContent: "track",
  InitiateCheckout: "track",
  SecaoAlcancada: "trackCustom",
};

const PIXEL_COOKIE_NAMES = ["_fbp", "_fbc"];

const getPixelId = () => String(CONFIG.pixel.id ?? "").trim();

/**
 * A janela com os dois globais da Meta, ainda `unknown`: vêm de fora do código.
 * @returns {Window & {fbq?: unknown, _fbq?: unknown}} A janela.
 */
const getTrackerWindow = () => window;

/**
 * O `fbq` da página, só se for função: `window.fbq` é `unknown` até passar por aqui.
 * @returns {FbqFunction|undefined} O `fbq`, ou `undefined` quando não há função.
 */
function getFbq() {
  const candidate = getTrackerWindow().fbq;
  return typeof candidate === "function" ? /** @type {FbqFunction} */ (candidate) : undefined;
}

/**
 * Fábrica do pixel: injeta o script da Meta uma vez, só com aceite e id, e envia os eventos permitidos.
 * @param {() => (boolean|null)} readConsent - Lê a resposta do consentimento; só `true` libera o pixel.
 * @returns {import("./contracts.js").PixelPort} A porta do pixel.
 */
export function createPixel(readConsent) {
  let isPixelInjected = false; // o script que ESTE modulo pos na pagina; `window.fbq` alheio nao conta
  let hasPixelFailed = false; // o script nao carregou (bloqueado): o stub enfileiraria para sempre, sem enviar
  let hasPageViewSent = false;
  let isRevoked = false; // o visitante tirou o aceite com o pixel ja carregado: sem eventos ate novo aceite

  /**
   * A guarda unica (RNF-L23). Carregar o pixel exige aceite e id; enviar exige, alem disso, o
   * script injetado por este modulo. Nada de terceiro acontece fora dela.
   * @param {boolean} [isForSending=true] - `false` para só carregar; `true` (padrão) para enviar.
   * @returns {boolean} `true` quando o pixel pode carregar ou enviar.
   */
  function isEligible(isForSending = true) {
    if (readConsent() !== true || !getPixelId()) return false;
    return !isForSending || (isPixelInjected && !hasPixelFailed && getFbq() !== undefined);
  }

  /**
   * Sem aceite. Revoga o pixel que este modulo carregou (`fbq("consent", "revoke")`, uma vez ate o proximo aceite) e expira
   * `_fbp` e `_fbc`. Na recusa explicita (`false`) expira sempre, mesmo sem pixel nesta carga: o cookie pode ser de uma
   * visita anterior que aceitou. Sem resposta (`null`) e sem pixel carregado nao ha o que fazer.
   * @param {boolean|null} consent - A resposta atual (qualquer uma menos `true`).
   * @returns {void}
   */
  function revokePixel(consent) {
    if (isPixelInjected && !isRevoked) {
      isRevoked = true;
      try { getFbq()?.("consent", "revoke"); } catch { /* o tracker nao derruba a pagina */ }
    }
    if (consent === false || isRevoked) expireCookies(PIXEL_COOKIE_NAMES);
  }

  /**
   * Idempotente: um script, um `init` e um PageView por carga de pagina. Sem aceite, revoga um pixel
   * ja carregado; com novo aceite depois de revogar, so devolve a permissao (`grant`), sem segundo script.
   * @returns {void}
   */
  function loadPixel() {
    const consent = readConsent();
    if (consent !== true) {
      revokePixel(consent);
      return;
    }
    if (!isEligible(false)) return;
    if (!isPixelInjected) {
      if (getTrackerWindow().fbq) return; // pixel de outra origem: este modulo nao assume o que nao carregou
      try {
        const fbq = /** @type {FbqFunction} */ (function () {
          fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments);
        });
        fbq.push = fbq; fbq.loaded = true; fbq.version = "2.0"; fbq.queue = [];
        const trackerWindow = getTrackerWindow();
        trackerWindow.fbq = fbq;
        trackerWindow._fbq ??= fbq;
        const script = document.createElement("script");
        script.async = true;
        script.src = "https://connect.facebook.net/en_US/fbevents.js";
        script.onerror = () => { hasPixelFailed = true; };
        document.head.appendChild(script);
        isPixelInjected = true;
        // A configuracao automatica le metadados da pagina e cliques sem evento declarado: desligada antes do init.
        fbq("set", "autoConfig", false, getPixelId());
        fbq("init", getPixelId());
      } catch {
        return;
      }
    } else if (isRevoked) {
      isRevoked = false;
      try { getFbq()?.("consent", "grant"); } catch { /* o tracker nao derruba a pagina */ }
    }
    if (!hasPageViewSent) hasPageViewSent = sendEvent("PageView");
  }

  /**
   * Devolve se o evento saiu. Erro do tracker morre aqui: nunca chega a quem chamou.
   * @param {import("./contracts.js").PixelEventName} name - Nome do evento; só os de `PIXEL_METHOD_BY_EVENT` saem.
   * @param {import("./contracts.js").PixelPayload} [data] - Payload do evento, quando há.
   * @returns {boolean} `true` quando o evento saiu.
   */
  function sendEvent(name, data) {
    try {
      const method = PIXEL_METHOD_BY_EVENT[name];
      const fbq = getFbq();
      if (!method || !isEligible() || !fbq) return false;
      if (data) fbq(method, name, data);
      else fbq(method, name);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Intenção de compra no clique de um CTA: cada clique legítimo é um evento, sem deduplicar. Síncrono e sem retorno: o clique
   * não espera nada daqui. A guarda do checkout confirmado mora em instrumentation.js (`trackCheckoutStart`), uma vez para os
   * três rastreadores.
   * @param {import("./contracts.js").CtaPosition} ctaPosition - Posição do CTA clicado (vai no payload como `posicaoCTA`).
   * @returns {void}
   */
  function trackCheckoutStart(ctaPosition) {
    sendEvent("InitiateCheckout", { posicaoCTA: ctaPosition, campanha: CONFIG.campanha });
  }

  return { isEligible, loadPixel, sendEvent, trackCheckoutStart };
}
