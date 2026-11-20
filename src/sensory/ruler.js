import { useEffect } from "react";
import { subscribeToMotionPreference, getEasing, isMotionReduced } from "./tokens.js";

/**
 * A regua do mapa (Weeks.jsx): quantos passos ja foram lidos, medido no trilho de cards que
 * permanece no fluxo (a regua sticky apenas exibe), e o "engolir" quando ela chega ao fim.
 * A secao so fornece o DOM, o numero de passos e a frase.
 */

/**
 * Onde um elemento comeca no conteudo `until` (offsetTop acumulado: nao muda com o `transform` do reveal). Sem `until`, sobe ate o topo.
 * @param {HTMLElement} element - Elemento medido.
 * @param {HTMLElement} [until] - Ancestral que marca o zero da conta.
 * @returns {number} Distância em pixels, em relação a `until`.
 */
export const getTopWithin = (element, until) => {
  let top = 0;
  for (let node = element; node && node !== until; node = node.offsetParent) top += node.offsetTop;
  return top;
};

/**
 * Os marcos de leitura de cada card, relativos ao trilho. So mudam quando o layout do trilho muda,
 * entao saem do quadro de rolagem: sao medidos uma vez e refeitos a cada mudanca de tamanho.
 */
function measureMarks(rail) {
  const origin = getTopWithin(rail);
  const marks = Array.from(rail.children, (card) => ({
    top: getTopWithin(card) - origin,
    step: Number(card.dataset.passo),
  }));
  return { marks, trackHeight: rail.offsetHeight };
}

function stepOnRail(position, marks, steps) {
  if (position < marks[0].top) return 0;
  for (let index = 0; index < marks.length - 1; index += 1) {
    const start = marks[index];
    const end = marks[index + 1];
    if (position >= end.top) continue;
    const ratio = (position - start.top) / (end.top - start.top);
    return Math.floor(start.step + ratio * (end.step - start.step));
  }
  return steps;
}

/**
 * Chegou ao ultimo passo: o retangulo vermelho dele cresce ate engolir a propria regua (so ela),
 * o texto sobe em tinta no meio e, passada a leitura, a cortina se ergue e devolve os numeros.
 * E imagem, nao interface: a regua ja e `aria-hidden`. Devolve a limpeza (cancela e remove, se a
 * secao sair antes do fim).
 */
const EXPO_IN_OUT = "cubic-bezier(0.76, 0, 0.24, 1)";

function swallowRuler(step, phrase) {
  const ruler = step.parentElement;
  const outer = ruler.getBoundingClientRect();
  const rect = step.getBoundingClientRect();
  // A origem e a marca de 6px do ultimo passo, em coordenadas da propria regua.
  const left = rect.left - outer.left;
  const right = outer.right - rect.right;
  const top = rect.top - outer.top;
  const bottom = outer.height - top - 6;
  const covering = document.createElement("div");
  covering.className = "absolute inset-0 z-1 flex items-center justify-center bg-acento text-void pointer-events-none overflow-clip";
  covering.setAttribute("aria-hidden", "true");
  const text = document.createElement("p");
  // O corpo da frase cabe na regua: pela altura dela e, no celular, pela largura.
  const bodySize = Math.min(outer.height * 0.5, outer.width / (phrase.length * 0.62));
  text.className = "flex justify-center gap-[0.3em] font-secundaria font-extrabold uppercase leading-none tracking-[0.02em] whitespace-nowrap";
  text.style.fontSize = `${bodySize}px`;
  const letters = [];
  for (const word of phrase.split(" ")) {
    const block = document.createElement("span");
    block.className = "inline-flex overflow-clip pb-[0.2em] -mb-[0.2em]";
    for (const letter of word) {
      const element = document.createElement("span");
      element.className = "inline-block";
      element.textContent = letter;
      block.append(element);
      letters.push(element);
    }
    text.append(block);
  }
  covering.append(text);
  ruler.append(covering);

  const fill = "both";
  const enter = covering.animate(
    [{ clipPath: `inset(${top}px ${right}px ${bottom}px ${left}px)` }, { clipPath: "inset(0px 0px 0px 0px)" }],
    { duration: 800, easing: EXPO_IN_OUT, fill },
  );
  const animations = [enter];
  const easing = getEasing("--ease-expo");
  letters.forEach((element, i) => {
    animations.push(element.animate(
      [{ transform: "translateY(120%)" }, { transform: "translateY(0)" }],
      { duration: 650, delay: 550 + i * 40, easing: easing, fill },
    ));
  });
  const exitDelay = 550 + letters.length * 40 + 650 + 1100; // a ultima letra assenta e a frase fica lida
  const end = covering.animate(
    [{ clipPath: "inset(0px 0px 0px 0px)" }, { clipPath: "inset(0px 0px 100% 0px)" }],
    { duration: 700, delay: exitDelay, easing: EXPO_IN_OUT, fill: "forwards" },
  );
  animations.push(end);
  end.onfinish = () => covering.remove();
  return () => { animations.forEach((animation) => animation.cancel()); covering.remove(); };
}

/**
 * Estado local de leitura, medido no trilho que permanece no fluxo.
 * @param {{ current: HTMLElement | null }} root - Ref da seção.
 * @param {{ current: HTMLElement | null }} rail - Ref do trilho de cards.
 * @param {number} steps - Número de passos da régua.
 * @param {string} phrase - Frase que a régua mostra ao chegar ao fim.
 */
export function useRailRuler(root, rail, steps, phrase) {
  useEffect(() => {
    const node = rail.current;
    if (!node) return;
    const items = Array.from(root.current?.querySelectorAll(".regua__passo") ?? []);
    const docElement = document.documentElement;
    const viewport = window.visualViewport;
    let isActive = true;
    let frame = 0;
    let last = null;
    // Medidos fora do quadro de rolagem: so a rolagem le do cache; o resto o invalida.
    let measured = null;
    // Passo lido na medicao anterior; o engolir so dispara ao CHEGAR ao fim rolando, nunca ao
    // carregar a pagina ja depois dele, e so uma vez por visita.
    let previous = null;
    let cleanupSwallow = null;
    const write = (lit, current) => {
      const state = `${lit}:${current}`;
      if (state === last) return;
      last = state;
      for (const [index, step] of items.entries()) {
        step.toggleAttribute("data-acesa", index < lit);
        step.toggleAttribute("data-atual", index === current);
      }
    };
    const update = () => {
      frame = 0;
      if (!isActive) return;
      const isReadComplete = isMotionReduced() || docElement.hasAttribute("data-pausado") ||
        !docElement.classList.contains("movimento-pronto") ||
        docElement.classList.contains("movimento-falhou");
      const box = node.getBoundingClientRect();
      if (isReadComplete || box.height <= 0) {
        write(items.length, -1);
        previous = steps;
        return;
      }
      const viewportHeight = Math.min(window.innerHeight, viewport.height);
      const readingLine = viewport.offsetTop + viewportHeight / 2;
      measured ??= measureMarks(node);
      const { marks, trackHeight } = measured;
      // O caminho está lido quando o fim do último card entra na tela, antes do CTA.
      const finalMark = { top: Math.max(marks[marks.length - 1].top, trackHeight - viewportHeight / 2), step: steps };
      // A posição acompanha a leitura dos cards, um passo por card.
      const lit = stepOnRail(readingLine - box.top, [...marks, finalMark], steps);
      write(lit, lit - 1);
      if (previous !== null && previous < steps && lit >= steps && !cleanupSwallow) {
        cleanupSwallow = swallowRuler(items[items.length - 1], phrase);
      }
      previous = lit;
    };
    const schedule = () => {
      if (isActive && !frame) frame = requestAnimationFrame(update);
    };
    const remeasure = () => {
      measured = null;
      schedule();
    };
    const sizeObserver = new ResizeObserver(remeasure);
    sizeObserver.observe(node);
    for (const card of node.children) sizeObserver.observe(card);
    const motionObserver = new MutationObserver(remeasure);
    motionObserver.observe(docElement, { attributes: true, attributeFilter: ["class", "data-pausado"] });
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", remeasure);
    window.addEventListener("pageshow", remeasure);
    viewport.addEventListener("resize", remeasure);
    viewport.addEventListener("scroll", schedule, { passive: true });
    const unsubscribePreference = subscribeToMotionPreference(remeasure);
    document.fonts.ready.then(remeasure);
    update();
    return () => {
      isActive = false;
      cancelAnimationFrame(frame);
      sizeObserver.disconnect();
      motionObserver.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", remeasure);
      window.removeEventListener("pageshow", remeasure);
      viewport.removeEventListener("resize", remeasure);
      viewport.removeEventListener("scroll", schedule);
      unsubscribePreference();
      cleanupSwallow?.();
      write(items.length, -1);
    };
  }, [root, rail, steps, phrase]);
}
