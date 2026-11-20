const posthogKey = import.meta.env?.VITE_POSTHOG_KEY;
const posthogHost = import.meta.env?.VITE_POSTHOG_HOST;
let isInitialized = false;

if (!posthogKey) {
  if (import.meta.env?.DEV) {
    throw new Error("VITE_POSTHOG_KEY variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once VITE_POSTHOG_KEY is configured");
  }
} else if (!posthogHost && import.meta.env?.DEV) {
  throw new Error("VITE_POSTHOG_HOST variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once VITE_POSTHOG_HOST is configured");
}

function getPostHog() {
  const trackerWindow = /** @type {{posthog: import("posthog-js").PostHog}} */ (/** @type {unknown} */ (window));
  return trackerWindow.posthog;
}

const posthog = {
  /** @param {Parameters<import("posthog-js").PostHog["capture"]>[0]} eventName @param {Parameters<import("posthog-js").PostHog["capture"]>[1]} [properties] */
  capture(eventName, properties) { getPostHog().capture(eventName, properties); },
  /** @param {Parameters<import("posthog-js").PostHog["captureLog"]>[0]} options */
  captureLog(options) { getPostHog().captureLog(options); },
};

function initializePostHog() {
  if (isInitialized || !posthogKey || !posthogHost) return;
  const queue = /** @type {any} */ ([]);
  queue._i = [];
  queue.__SV = 1;
  for (const method of ["capture", "captureLog", "opt_in_capturing", "opt_out_capturing"]) {
    /** @param {...unknown} args */
    queue[method] = (...args) => queue.push([method, ...args]);
  }
  /** @param {string} token @param {import("posthog-js").PostHogConfig} options */
  queue.init = (token, options) => queue._i.push([token, options, "posthog"]);
  const trackerWindow = /** @type {{posthog: any}} */ (/** @type {unknown} */ (window));
  trackerWindow.posthog = queue;

  const scriptUrl = new URL(posthogHost);
  scriptUrl.pathname = `${scriptUrl.pathname.replace(/\/+$/, "")}/static/array.js`;
  const script = document.createElement("script");
  script.async = true;
  script.crossOrigin = "anonymous";
  script.src = scriptUrl.href;
  document.head.appendChild(script);

  queue.init(posthogKey, {
    api_host: posthogHost,
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
  isInitialized = true;
}

/** @param {boolean|null} hasConsent */
export function setPostHogConsent(hasConsent) {
  if (hasConsent === true) {
    if (isInitialized) getPostHog().opt_in_capturing();
    else initializePostHog();
  } else if (isInitialized) {
    getPostHog().opt_out_capturing();
  }
}

export const isPostHogInitialized = () => isInitialized;
export { posthog };
