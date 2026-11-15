import { lightUpInSequence, useMotion } from "./index.js";
import { isMotionReduced } from "./tokens.js";

// Ritmo da sequencia de palavras. Acompanha a altura do trilho declarada na secao.
const RHYTHM = 1.224;

/**
 * Manifesto: as palavras acendem com a rolagem, e o trilho so existe enquanto o texto cabe na janela.
 * @param {{ current: HTMLElement | null }} root - Ref da seção.
 */
export function useManifesto(root) {
  useMotion(() => {
    const node = root.current;
    if (!node) return;
    const text = node.querySelector(".manifesto__texto");
    if (!text) return;
    let isActive = true;
    let frame = 0;
    const docElement = document.documentElement;
    // `data-cabe` troca a altura da secao em ~1 tela. Medir contra `innerHeight`/`visualViewport` fazia
    // a barra do navegador (ou o zoom) virar o dado no meio da rolagem e a pagina pulava de secao.
    // `svh` nao muda com a barra: e a mesma unidade do `min-h-svh` do texto.
    const probe = document.createElement("div");
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText = "position:fixed;top:0;height:100svh;width:0;visibility:hidden;pointer-events:none";
    node.appendChild(probe);
    const measure = () => {
      frame = 0;
      if (!isActive) return;
      const top = parseFloat(getComputedStyle(text).top);
      // `offsetHeight` arredonda e o palco (`min-h-svh`) nao: em aparelho real o svh e fracionario
      // (ex.: 780,57) e o palco media 0,5 px a mais que a sonda, desligando o trilho inteiro.
      const height = probe.getBoundingClientRect().height;
      const isMotionAvailable = docElement.classList.contains("movimento-pronto") &&
        !docElement.classList.contains("movimento-falhou");
      const isFitting = isMotionAvailable && !isMotionReduced() && Number.isFinite(top) &&
        text.getBoundingClientRect().height + top * 2 <= height + 1;
      if (node.hasAttribute("data-cabe") !== isFitting) node.toggleAttribute("data-cabe", isFitting);
    };
    const schedule = () => {
      if (isActive && !frame) frame = requestAnimationFrame(measure);
    };
    // Observe apenas o texto: a altura da seção muda quando o sticky é habilitado.
    const observer = new ResizeObserver(schedule);
    observer.observe(text);
    // O trilho só existe enquanto a animação está disponível, inclusive após falha tardia.
    const motionObserver = new MutationObserver(schedule);
    motionObserver.observe(docElement, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("resize", schedule);
    document.fonts.ready.then(schedule);
    measure();
    lightUpInSequence(node.querySelectorAll(".palavra"), node, { isFixed: true, currentAttribute: "data-atual", rhythm: RHYTHM });
    return () => {
      isActive = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      motionObserver.disconnect();
      window.removeEventListener("resize", schedule);
      probe.remove();
      node.removeAttribute("data-cabe");
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- intencional: raiz e ref estavel e o efeito mede e acende as palavras uma vez na montagem; rodar de novo duplicaria os ouvintes e o acender
}
