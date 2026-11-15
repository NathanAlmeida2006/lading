import { useEffect } from "react";
import { loadChoreographies } from "./loader.js";
import { openReadingMode } from "./reading.js";
import { subscribeToMotionPreference, isMotionReduced } from "./tokens.js";
import { isPaused } from "./pause.js";
export { startLenis } from "./scroll.js";

let currentScope = null;

/**
 * Efeitos são opcionais: exceção ou import rejeitado nunca derruba a raiz.
 * @param {() => (void | (() => void))} effect - Efeito da seção; pode devolver a função que o desfaz.
 * @param {Array} [deps=[]] - Dependências de quem chama; o eslint as confere pelo `additionalHooks`.
 */
export function useMotion(effect, deps = []) {
  useEffect(() => {
    if (!document.documentElement.classList.contains("js")) return;
    let scope;
    let isMounted = true;
    const clearScope = () => {
      if (!scope?.isActive) return;
      scope.isActive = false;
      for (const cleanup of scope.cleanup) {
        try { cleanup(); } catch (error) { console.error(error); }
      }
      scope.cleanup.clear();
    };
    const execute = () => {
      clearScope();
      if (!isMounted || !document.documentElement.classList.contains("js") ||
          document.documentElement.classList.contains("movimento-falhou")) return;
      scope = { isActive: true, cleanup: new Set() };
      const previous = currentScope;
      currentScope = scope;
      try {
        const cleanup = effect();
        if (typeof cleanup === "function") scope.cleanup.add(cleanup);
      } catch (error) {
        console.error(error);
        clearScope();
        openReadingMode();
      } finally {
        currentScope = previous;
      }
    };
    execute();
    const unsubscribePreference = subscribeToMotionPreference(execute);
    return () => { isMounted = false; unsubscribePreference(); clearScope(); };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps -- intencional: as deps sao as de quem chama o useMotion (a regra o confere pelo additionalHooks) e o efeito e a funcao do chamador, que e lida na montagem de cada rodada
}

/**
 * Carrega o chunk de coreografias e chama a função `name` exportada por ele.
 * @param {string} name - Nome exportado por `choreographies.js`.
 * @param {Array} args - Argumentos da coreografia.
 * @param {boolean} [withSignal=false] - Se true, passa o `AbortSignal` como último argumento.
 * @returns {() => void} Função que cancela e desfaz a coreografia.
 */
function callChoreography(name, args, withSignal = false) {
  const scope = currentScope;
  const controller = new AbortController();
  let isActive = true;
  let result;
  const cancel = () => {
    if (!isActive) return;
    isActive = false;
    controller.abort();
    try { result?.revert?.(); } catch (error) { console.error(error); }
    if (typeof result === "function") {
      try { result(); } catch (error) { console.error(error); }
    }
  };
  cancel.revert = cancel;
  scope?.cleanup.add(cancel);
  // Um clique no CTA também pode iniciar a carga. Ele segue seu href normal.
  loadChoreographies().then((choreographyModule) => {
    if (!isActive || (scope && !scope.isActive) || document.documentElement.classList.contains("movimento-falhou")) return;
    document.documentElement.classList.add("movimento-pronto");
    try {
      result = choreographyModule[name](...args, ...(withSignal ? [controller.signal] : []));
      if (result && typeof result.then === "function") {
        result.then((cleanup) => {
          result = cleanup;
          if (!isActive) {
            try {
              if (typeof cleanup === "function") cleanup();
              else cleanup?.revert?.();
            } catch (error) { console.error(error); }
          }
        }).catch((error) => {
          if (!isActive) return;
          console.error(error);
          openReadingMode();
        });
      }
    } catch (error) {
      console.error(error);
      openReadingMode();
    }
  }).catch(() => { if (isActive) openReadingMode(); }); // o erro da carga e registrado uma vez, em loader.js
  return cancel;
}

/**
 * Aparição simples ligada à rolagem.
 * @param {...any} args - Alvo e opções de `reveal` (`delay`, `offset`).
 * @returns {() => void} Função que desfaz a animação.
 */
export const reveal = (...args) => callChoreography("reveal", args);
/**
 * Revela vários alvos em cascata, cada um com o próprio gatilho.
 * @param {...any} args - Alvos e opções de `revealInCascade` (`interval`).
 * @returns {() => void} Função que desfaz as animações.
 */
export const revealInCascade = (...args) => callChoreography("revealInCascade", args);
/**
 * Revela o título linha a linha, com o recorte do `splitText`.
 * @param {Element} target - Título a dividir e revelar.
 * @param {object} [options={}] - Opções de `revealLineMask` (`delay`).
 * @returns {Promise<() => void>} Função que desfaz a divisão e a animação.
 */
export const revealLineMask = (target, options = {}) => callChoreography("revealLineMask", [target, options], true);
/**
 * Sobe as linhas de dentro do recorte, escalonadas.
 * @param {...any} args - Linhas e opções de `raiseLines` (`delay`, `interval`, `duration`).
 * @returns {() => void} Função que desfaz a animação.
 */
export const raiseLines = (...args) => callChoreography("raiseLines", args);
/**
 * Acende os alvos em sequência conforme a rolagem.
 * @param {...any} args - Alvos, contexto e opções de `lightUpInSequence`.
 * @returns {() => void} Função que remove o acendimento e os ouvintes.
 */
export const lightUpInSequence = (...args) => callChoreography("lightUpInSequence", args);
/**
 * Pulso curto de confirmação no botão. Não faz nada sob movimento reduzido ou pausa.
 * @param {Element} target - Elemento a pulsar.
 * @returns {(() => void) | undefined} Função que desfaz o pulso, ou undefined sem movimento.
 */
export const pulse = (target) => (isMotionReduced() || isPaused() ? undefined : callChoreography("pulse", [target]));
/**
 * Entrada do painel de tela cheia do fechamento.
 * @param {...any} args - Partes do painel de `openPanel` (`frame`, `threads`, `kicker`, `lines`, `body`, `action`, `footer`).
 * @returns {() => void} Função que desfaz as animações.
 */
export const openPanel = (...args) => callChoreography("openPanel", args);

/**
 * Rede de segurança nativa; independe do chunk de animação.
 * @returns {() => void} Função que remove o ouvinte de rolagem.
 */
export function ensureVisibility() {
  let timer;
  const sweep = () => {
    for (const element of document.querySelectorAll("[data-revelar]")) {
      const box = element.getBoundingClientRect();
      if (box.top >= innerHeight || box.bottom <= 0) continue;
      if (parseFloat(getComputedStyle(element).opacity) < 0.99) {
        element.style.opacity = "1";
        element.style.transform = "none";
      }
      for (const line of element.querySelectorAll("[data-line], .linha__texto")) {
        if (getComputedStyle(line).transform !== "none") line.style.transform = "none";
      }
    }
    for (const word of document.querySelectorAll(".palavra:not([data-acesa])")) {
      if (word.getBoundingClientRect().bottom < 0) word.setAttribute("data-acesa", "");
    }
  };
  const handleScroll = () => {
    if (timer) return;
    timer = setTimeout(() => { timer = 0; sweep(); }, 2500);
  };
  handleScroll();
  window.addEventListener("scroll", handleScroll, { passive: true });
  return () => { clearTimeout(timer); window.removeEventListener("scroll", handleScroll); };
}
