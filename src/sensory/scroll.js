import Lenis from "lenis";

/**
 * Liga a rolagem suave (Lenis) e o laço de quadros que a conduz.
 * @returns {() => void} Função que destrói o Lenis e remove os ouvintes.
 */
export function startLenis() {
  const lenis = new Lenis({ autoRaf: false, anchors: true, lerp: 0.1, syncTouch: false, respectReducedMotion: true });

  // O intervalo entre quadros desta tela (6,9 ms a 144 Hz, 16,7 ms a 60 Hz), medido; usado so
  // para por o relogio um quadro atras ao acordar.
  let interval = 1000 / 60;
  let last = 0;
  let frame = 0;
  let measureFrameA = 0;
  let measureFrameB = 0;
  let isAlive = true;

  // Na retomada, o navegador restaura a posicao do layout completo antes de
  // o chunk habilitar os trechos sticky. Ancorar esse crescimento somaria
  // novamente a altura anterior. A restauracao continua sendo do navegador.
  const root = document.documentElement;
  const navigationType = performance.getEntriesByType("navigation")[0]?.type;
  let isAnchorPending = navigationType === "reload" || navigationType === "back_forward";
  let anchorObserver;
  let anchorFrameA = 0;
  let anchorFrameB = 0;
  const releaseAnchor = () => {
    if (!isAnchorPending) return;
    isAnchorPending = false;
    anchorObserver?.disconnect();
    cancelAnimationFrame(anchorFrameA);
    cancelAnimationFrame(anchorFrameB);
    root.style.removeProperty("overflow-anchor");
  };
  if (isAnchorPending) {
    root.style.setProperty("overflow-anchor", "none");
    let isFontsReady = false;
    const checkAnchor = () => {
      if (!isAlive || !isAnchorPending || !isFontsReady || anchorFrameA || anchorFrameB) return;
      if (!root.classList.contains("movimento-pronto") &&
          !root.classList.contains("movimento-falhou") && root.classList.contains("js")) return;
      // Os medidores de layout respondem a mesma mudanca de classe em RAF.
      // Dois quadros deixam essas medidas aplicadas antes de devolver a ancora.
      anchorFrameA = requestAnimationFrame(() => {
        anchorFrameA = 0;
        if (!isAlive || !isAnchorPending) return;
        anchorFrameB = requestAnimationFrame(() => {
          anchorFrameB = 0;
          releaseAnchor();
        });
      });
    };
    anchorObserver = new MutationObserver(checkAnchor);
    anchorObserver.observe(root, { attributes: true, attributeFilter: ["class"] });
    document.fonts.ready.then(() => {
      isFontsReady = true;
      checkAnchor();
    });
  }
  const tick = (time) => {
    frame = 0;
    if (last) interval = Math.max(4, Math.min(34, time - last));
    else lenis.time = time - interval;
    last = time;
    lenis.raf(time);
    if (lenis.isScrolling === "smooth" && isAlive) frame = requestAnimationFrame(tick);
    else last = 0;
  };
  const wake = () => {
    if (!frame && isAlive) frame = requestAnimationFrame(tick);
  };
  // A roda acorda o laco pelo evento do PROPRIO Lenis, nao por um ouvinte nosso em `window`: um segundo
  // ouvinte de `wheel` fazia o Chrome entregar o primeiro evento depois do sono como nao cancelavel, e a
  // pagina dava um quadro de rolagem nativa (400 px de uma vez) antes de o Lenis assumir.
  // So a roda: o toque e nativo (`syncTouch: false`), e acordar o laco por ele seria um quadro por `touchmove`.
  const unsubscribeVirtual = lenis.on("virtual-scroll", ({ event }) => {
    if (event.type.includes("wheel") || event.type.includes("touch")) releaseAnchor();
    if (event.type.includes("wheel")) wake();
  });
  const handleAnchorClick = (event) => {
    const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
    if (!anchor || !anchor.hash || anchor.origin !== location.origin || anchor.pathname !== location.pathname) return;
    releaseAnchor();
    wake();
  };
  window.addEventListener("click", handleAnchorClick);
  const handleKeyScroll = (event) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey ||
        !["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) return;
    const target = event.target;
    if (target instanceof Element && (target.isContentEditable ||
        target.closest("input, textarea, select, button, a, [contenteditable], [role='button'], [role='slider'], [role='spinbutton'], [role='textbox'], [role='combobox'], [role='listbox'], [role='menu'], [role='tree'], [role='grid']"))) return;
    releaseAnchor();
    if (lenis.isScrolling !== "smooth" || lenis.isStopped) return;
    // A tecla fica nativa. Sem cancelar a interpolacao, o quadro seguinte
    // sobrescreveria o movimento de PageDown ao terminar uma ancora.
    lenis.stop();
    lenis.start();
    cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
  };
  window.addEventListener("keydown", handleKeyScroll, { passive: true });
  measureFrameA = requestAnimationFrame((startTime) => {
    if (!isAlive) return;
    measureFrameB = requestAnimationFrame((endTime) => {
      if (isAlive) interval = Math.max(4, Math.min(34, endTime - startTime));
    });
  });

  return () => {
    isAlive = false;
    cancelAnimationFrame(frame);
    cancelAnimationFrame(measureFrameA);
    cancelAnimationFrame(measureFrameB);
    unsubscribeVirtual();
    window.removeEventListener("click", handleAnchorClick);
    window.removeEventListener("keydown", handleKeyScroll);
    releaseAnchor();
    lenis.destroy();
  };
}
