import { CONFIG } from "./config.js";
import { expireCookies, readCookieNames, removeStoredValues } from "./storage.js";

/* -------------------------------------------------------------------------
   PostHog
   ------------------------------------------------------------------------- */

// O SDK real vem do `array.js` do host do PostHog, sem versão fixa, como o fbevents.js da Meta e a tag do Clarity: decisão do
// gerente em 22/11/2026. Empacotar o `posthog-js` do npm somaria de 56 a 126 KB gz ao bundle e estouraria o teto de 130 KB
// do RNF-L04. O pacote do npm fica em devDependencies, só para os tipos do JSDoc.

/** @typedef {Pick<import("posthog-js").PostHog, "capture"|"captureLog"|"opt_in_capturing"|"opt_out_capturing">} PostHogApi O que este módulo usa do PostHog (o stub e o SDK real). */

// Toda propriedade de URL de um evento termina assim: `$current_url`, `$referrer`, `$initial_current_url`, `$session_entry_url`.
const URL_PROPERTY_PATTERN = /(?:url|referrer)$/i;

/**
 * `before_send` do PostHog: as URLs do evento saem sem query e sem hash, nas propriedades, no `$set` e no `$set_once`.
 * Segunda camada contra PII: a URL da barra ja foi limpa antes de qualquer rastreador carregar (params.js); esta cobre o
 * referrer, que vem de fora, e o que a URL ganhar depois. Valor que nao e URL (`$direct`) passa como esta.
 * @param {import("posthog-js").CaptureResult|null} event - O evento que o SDK vai enviar.
 * @returns {import("posthog-js").CaptureResult|null} O mesmo evento, com as URLs cortadas.
 */
export function stripEventUrls(event) {
  for (const properties of [event?.properties, event?.$set, event?.$set_once]) {
    if (!properties) continue;
    for (const [key, value] of Object.entries(properties)) {
      if (typeof value === "string" && URL_PROPERTY_PATTERN.test(key)) properties[key] = value.split(/[?#]/, 1)[0];
    }
  }
  return event;
}

/**
 * A janela com o global do PostHog, ainda `unknown`: vem de fora do código.
 * @returns {Window & {posthog?: unknown}} A janela.
 */
const getTrackerWindow = () => window;

/**
 * Apaga o que o PostHog grava no aparelho: os cookies `ph_*` (no domínio registrável também) e, no localStorage e no
 * sessionStorage, os `ph_*` e o consentimento dele (`__ph_opt_in_out_*`).
 * @returns {void}
 */
function expirePostHogStorage() {
  expireCookies(readCookieNames().filter((name) => name.startsWith("ph_")));
  /** @param {string} key */
  const isPostHogKey = (key) => key.startsWith("ph_") || key.startsWith("__ph_opt_in_out_");
  removeStoredValues("localStorage", isPostHogKey);
  removeStoredValues("sessionStorage", isPostHogKey);
}

/**
 * Fábrica do PostHog: injeta o SDK uma vez, só com aceite, chave e host, e sincroniza o opt-in dele com a resposta do
 * aviso a cada carga e a cada resposta. O opt-out do SDK fica gravado no localStorage e sobrevive ao F5, e a resposta do
 * aviso mora no sessionStorage: por isso o padrão do SDK é fora (`opt_out_capturing_by_default`) e todo aceite chama
 * `opt_in_capturing`. Falha (host inválido, sem https, ou script bloqueado pelo `onerror`) desliga o PostHog desta carga,
 * com um aviso no console. Um `window.posthog` de outra origem não é usado nem sobrescrito.
 * @param {() => (boolean|null)} readConsent - Lê a resposta do consentimento; só `true` libera o PostHog.
 * @returns {import("./contracts.js").PostHogPort} A porta do PostHog.
 */
export function createPostHog(readConsent) {
  let isInjected = false; // o SDK que ESTE modulo pos na pagina; `window.posthog` alheio nao conta
  let hasFailed = false; // host invalido ou script bloqueado (adblock, CSP, rede): nada mais e tentado nem enfileirado nesta carga
  let isRevoked = false; // o aceite foi retirado com o SDK ja carregado: opt-out ate novo aceite
  let hasWarned = false;

  /**
   * Um aviso por carga: o motivo de o PostHog não rodar vai ao console sem repetir.
   * @param {string} message - O aviso.
   * @returns {void}
   */
  const warnOnce = (message) => {
    if (hasWarned) return;
    hasWarned = true;
    console.warn(message);
  };

  /**
   * O `posthog` da página, só o que este módulo injetou e só se tiver `capture`.
   * @returns {PostHogApi|undefined} O PostHog, ou `undefined`.
   */
  function getPostHog() {
    const candidate = /** @type {{capture?: unknown}|undefined} */ (getTrackerWindow().posthog);
    return isInjected && !hasFailed && typeof candidate?.capture === "function" ? /** @type {PostHogApi} */ (/** @type {unknown} */ (candidate)) : undefined;
  }

  /**
   * O stub do snippet oficial (fila de chamadas até o SDK chegar), o script do SDK e o `init`. A URL do script sai antes de
   * qualquer efeito: host inválido ou sem https lança aqui e nada fica na página.
   * @param {string} key - Chave pública do projeto.
   * @param {string} host - Host de ingestão.
   * @returns {void}
   */
  function inject(key, host) {
    const scriptUrl = new URL(host);
    scriptUrl.pathname = `${scriptUrl.pathname.replace(/\/+$/, "")}/static/array.js`;
    if (scriptUrl.protocol !== "https:") throw new Error("host sem https");
    const queue = /** @type {any} */ ([]);
    queue._i = [];
    queue.__SV = 1;
    for (const method of ["capture", "captureLog", "opt_in_capturing", "opt_out_capturing"]) {
      /** @param {...unknown} args */
      queue[method] = (...args) => queue.push([method, ...args]);
    }
    /** @param {string} token @param {Partial<import("posthog-js").PostHogConfig>} options */
    queue.init = (token, options) => queue._i.push([token, options, "posthog"]);
    getTrackerWindow().posthog = queue;

    const script = document.createElement("script");
    script.async = true;
    script.crossOrigin = "anonymous";
    script.src = scriptUrl.href;
    script.onerror = () => {
      hasFailed = true;
      console.warn("[PostHog] script bloqueado (CSP, adblock ou rede)");
    };
    document.head.appendChild(script);

    queue.init(key, {
      api_host: host,
      opt_out_capturing_by_default: true, // fora ate o opt_in desta carga
      opt_out_persistence_by_default: true, // fora, nada gravado no aparelho
      disable_session_recording: true, // quem grava a visita é o Clarity (política de privacidade): dois gravadores pesariam no celular
      before_send: stripEventUrls,
      capture_exceptions: {
        capture_unhandled_errors: true,
        capture_unhandled_rejections: true,
        capture_console_errors: false,
      },
      logs: {
        serviceName: "fluor-landing",
        environment: import.meta.env?.MODE,
      },
    });
  }

  /**
   * Idempotente: um SDK por carga. Com aceite, liga a captura (`opt_in_capturing`) a cada chamada: é o que desfaz o opt-out
   * que uma visita anterior deixou gravado. Sem aceite, desliga o SDK desta carga (`opt_out_capturing`, uma vez até o
   * próximo aceite) e apaga o que o PostHog gravou; na recusa explícita apaga sempre, mesmo sem SDK nesta carga. Falha de
   * host (inválido ou sem https) ou de script bloqueado avisa uma vez e não tenta de novo nesta carga.
   * @returns {void}
   */
  function loadPostHog() {
    const consent = readConsent();
    if (consent !== true) {
      if (isInjected && !isRevoked) {
        isRevoked = true;
        try { getPostHog()?.opt_out_capturing(); } catch { /* o tracker nao derruba a pagina */ }
      }
      if (consent === false || isRevoked) expirePostHogStorage();
      return;
    }
    if (hasFailed) return;
    const key = String(CONFIG.posthog.key ?? "").trim();
    const host = String(CONFIG.posthog.host ?? "").trim();
    if (!key || !host) {
      warnOnce("[PostHog] chave ou host não configurados (VITE_POSTHOG_KEY, VITE_POSTHOG_HOST): script não carregado");
      return;
    }
    if (!isInjected) {
      if (getTrackerWindow().posthog) return; // PostHog de outra origem: este módulo não assume o que não carregou
      try {
        inject(key, host);
        isInjected = true;
      } catch {
        hasFailed = true;
        warnOnce("[PostHog] VITE_POSTHOG_HOST inválido (precisa ser URL https): script não carregado");
        return;
      }
    }
    isRevoked = false;
    try { getPostHog()?.opt_in_capturing(); } catch { /* o tracker nao derruba a pagina */ }
  }

  /**
   * Envia um evento; sem aceite, ou sem o SDK desta carga, não sai.
   * @param {Parameters<PostHogApi["capture"]>[0]} name - Nome do evento.
   * @param {Parameters<PostHogApi["capture"]>[1]} [properties] - Propriedades do evento.
   * @returns {void}
   */
  function capture(name, properties) {
    try { if (readConsent() === true) getPostHog()?.capture(name, properties); } catch { /* o tracker nao derruba a pagina */ }
  }

  /**
   * Envia um log; sem aceite, ou sem o SDK desta carga, não sai.
   * @param {Parameters<PostHogApi["captureLog"]>[0]} options - O log.
   * @returns {void}
   */
  function captureLog(options) {
    try { if (readConsent() === true) getPostHog()?.captureLog(options); } catch { /* o tracker nao derruba a pagina */ }
  }

  return { loadPostHog, capture, captureLog };
}
