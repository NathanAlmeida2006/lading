/**
 * Lê as durações e curvas do CSS, em vez de repeti-las aqui.
 *
 * RNF-L17 não admite valor solto: os tokens de movimento vivem em
 * `tokens/motion.css`, que é tradução do mestre visual §10. Duplicar
 * "180ms" neste arquivo criaria a segunda fonte da verdade que o RNF-G16
 * proíbe, e ela envelheceria em silêncio.
 */
const DEFAULTS = {
  "--motion-fast": 120,
  "--motion-slow": 280,
};

let cache = null;

/**
 * Duração de um token de movimento, lida do CSS; cai na constante de reserva se o CSS não der um valor.
 * @param {string} name - Propriedade CSS, como `--motion-fast`.
 * @returns {number} Duração em milissegundos.
 */
export function getDuration(name) {
  if (!cache) {
    cache = {};
    const style = getComputedStyle(document.documentElement);
    for (const key of Object.keys(DEFAULTS)) {
      const raw = style.getPropertyValue(key).trim();
      const ms = raw.endsWith("ms")
        ? parseFloat(raw)
        : raw.endsWith("s")
          ? parseFloat(raw) * 1000
          : NaN;
      cache[key] = Number.isFinite(ms) ? ms : DEFAULTS[key];
    }
  }
  return cache[name];
}

// Uma consulta só para a página inteira: `.matches` é vivo, e há quem leia a cada quadro de rolagem.
let motionQuery = null;
const getMotionQuery = () =>
  (motionQuery ??= window.matchMedia("(prefers-reduced-motion: reduce)"));

/**
 * Movimento nunca comunica sozinho (mestre §10). Com a preferencia ligada,
 * tudo vira opacidade: sem deslocamento, sem corte, sem desenho.
 * @returns {boolean} true quando o visitante pediu movimento reduzido.
 */
export function isMotionReduced() {
  return getMotionQuery().matches;
}

// Idem para o toque: o dedo rola e a CPU do celular é curta, então o fundo anima mais devagar.
let touchQuery = null;

/**
 * Ponteiro grosso (dedo): os fundos animados desenham menos e congelam enquanto a página rola.
 * @returns {boolean} true quando o ponteiro principal é grosso (toque).
 */
export function isTouchPointer() {
  return (touchQuery ??= window.matchMedia("(pointer: coarse)")).matches;
}

/**
 * Reexecuta efeitos quando a preferência muda sem deixar um listener órfão.
 * @param {() => void} listener - Chamado a cada mudança da preferência.
 * @returns {() => void} Função que remove o listener.
 */
export function subscribeToMotionPreference(listener) {
  const mediaQuery = getMotionQuery();
  mediaQuery.addEventListener("change", listener);
  return () => mediaQuery.removeEventListener("change", listener);
}
