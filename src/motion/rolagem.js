import Lenis from "lenis";

// StrictMode pode iniciar o proximo efeito antes de a limpeza anterior,
// registrada pelo useMovimento em microtask, chegar. So o dono atual restaura.
let donoDaAncora = null;

export function ligarLenis() {
  if (typeof window === "undefined") return () => {};
  const lenis = new Lenis({ autoRaf: false, anchors: true, lerp: 0.1, syncTouch: false, respectReducedMotion: true });

  // O intervalo entre quadros desta tela (6,9 ms a 144 Hz, 16,7 ms a 60 Hz), medido; usado so
  // para por o relogio um quadro atras ao acordar.
  let intervalo = 1000 / 60;
  let ultimo = 0;
  let quadro = 0;
  let quadroMedicaoA = 0;
  let quadroMedicaoB = 0;
  let vivo = true;

  // Na retomada, o navegador restaura a posicao do layout completo antes de
  // o chunk habilitar os trechos sticky. Ancorar esse crescimento somaria
  // novamente a altura anterior. A restauracao continua sendo do navegador.
  const documento = document.documentElement;
  const navegacao = performance.getEntriesByType("navigation")[0]?.type;
  let ancoraPendente = navegacao === "reload" || navegacao === "back_forward";
  const ancoraAnterior = donoDaAncora?.valor ?? documento.style.getPropertyValue("overflow-anchor");
  const prioridadeAncora = donoDaAncora?.prioridade ?? documento.style.getPropertyPriority("overflow-anchor");
  const dono = ancoraPendente ? { valor: ancoraAnterior, prioridade: prioridadeAncora } : null;
  let observadorAncora;
  let quadroAncoraA = 0;
  let quadroAncoraB = 0;
  const liberarAncora = () => {
    if (!ancoraPendente) return;
    ancoraPendente = false;
    observadorAncora?.disconnect();
    cancelAnimationFrame(quadroAncoraA);
    cancelAnimationFrame(quadroAncoraB);
    if (donoDaAncora !== dono) return;
    donoDaAncora = null;
    if (ancoraAnterior) documento.style.setProperty("overflow-anchor", ancoraAnterior, prioridadeAncora);
    else documento.style.removeProperty("overflow-anchor");
  };
  if (ancoraPendente) {
    donoDaAncora = dono;
    documento.style.setProperty("overflow-anchor", "none");
    let fontesProntas = false;
    const conferirAncora = () => {
      if (!vivo || !ancoraPendente || !fontesProntas || quadroAncoraA || quadroAncoraB) return;
      if (!documento.classList.contains("movimento-pronto") &&
          !documento.classList.contains("movimento-falhou") && documento.classList.contains("js")) return;
      // Os medidores de layout respondem a mesma mudanca de classe em RAF.
      // Dois quadros deixam essas medidas aplicadas antes de devolver a ancora.
      quadroAncoraA = requestAnimationFrame(() => {
        quadroAncoraA = 0;
        if (!vivo || !ancoraPendente) return;
        quadroAncoraB = requestAnimationFrame(() => {
          quadroAncoraB = 0;
          liberarAncora();
        });
      });
    };
    observadorAncora = new MutationObserver(conferirAncora);
    observadorAncora.observe(documento, { attributes: true, attributeFilter: ["class"] });
    Promise.resolve(document.fonts?.ready).then(() => {
      fontesProntas = true;
      conferirAncora();
    });
  }
  const bater = (t) => {
    quadro = 0;
    if (ultimo) intervalo = Math.max(4, Math.min(34, t - ultimo));
    else lenis.time = t - intervalo;
    ultimo = t;
    lenis.raf(t);
    if (lenis.isScrolling === "smooth" && vivo) quadro = requestAnimationFrame(bater);
    else ultimo = 0;
  };
  const acordar = () => {
    if (!quadro && vivo) quadro = requestAnimationFrame(bater);
  };
  // A roda acorda o laco pelo evento do PROPRIO Lenis, nao por um ouvinte nosso em `window`: um segundo
  // ouvinte de `wheel` fazia o Chrome entregar o primeiro evento depois do sono como nao cancelavel, e a
  // pagina dava um quadro de rolagem nativa (400 px de uma vez) antes de o Lenis assumir.
  // So a roda: o toque e nativo (`syncTouch: false`), e acordar o laco por ele seria um quadro por `touchmove`.
  const soltarVirtual = lenis.on("virtual-scroll", ({ event }) => {
    if (event.type.includes("wheel") || event.type.includes("touch")) liberarAncora();
    if (event.type.includes("wheel")) acordar();
  });
  const aoClicarAncora = (evento) => {
    const ancora = evento.target instanceof Element ? evento.target.closest("a[href]") : null;
    if (!ancora || !ancora.hash || ancora.origin !== location.origin || ancora.pathname !== location.pathname) return;
    liberarAncora();
    acordar();
  };
  window.addEventListener("click", aoClicarAncora);
  const aoRolarPorTeclado = (evento) => {
    if (evento.defaultPrevented || evento.altKey || evento.ctrlKey || evento.metaKey ||
        !["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(evento.key)) return;
    const alvo = evento.target;
    if (alvo instanceof Element && (alvo.isContentEditable ||
        alvo.closest("input, textarea, select, button, a, [contenteditable], [role='button'], [role='slider'], [role='spinbutton'], [role='textbox'], [role='combobox'], [role='listbox'], [role='menu'], [role='tree'], [role='grid']"))) return;
    liberarAncora();
    if (lenis.isScrolling !== "smooth" || lenis.isStopped) return;
    // A tecla fica nativa. Sem cancelar a interpolacao, o quadro seguinte
    // sobrescreveria o movimento de PageDown ao terminar uma ancora.
    lenis.stop();
    lenis.start();
    cancelAnimationFrame(quadro);
    quadro = 0;
    ultimo = 0;
  };
  window.addEventListener("keydown", aoRolarPorTeclado, { passive: true });
  quadroMedicaoA = requestAnimationFrame((a) => {
    if (!vivo) return;
    quadroMedicaoB = requestAnimationFrame((b) => {
      if (vivo) intervalo = Math.max(4, Math.min(34, b - a));
    });
  });

  const faixas = [...document.querySelectorAll(".marquise")];
  const perto = new Set();
  const escrito = new Map();
  let velocidadeAgora = "0.00";
  // So escreve quando o valor muda: 0,00 repetido nao muda nada, e cada escrita invalida a faixa.
  const escrever = (faixa, v) => {
    if (escrito.get(faixa) === v) return;
    escrito.set(faixa, v);
    faixa.style.setProperty("--scroll-velocity", v);
  };
  const observador =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entradas) => {
            for (const e of entradas) {
              // Ao entrar, a faixa recebe a velocidade de agora; ao sair, volta a 0. Uma faixa fora da tela
              // NAO pode ficar com a inclinacao velha: o evento que zera (400 ms depois de a rolagem parar)
              // chegaria quando ela ja saiu, e ela ficaria torta, transbordando a pagina em alguns pixels.
              if (e.isIntersecting) {
                perto.add(e.target);
                escrever(e.target, velocidadeAgora);
              } else {
                perto.delete(e.target);
                escrever(e.target, "0.00");
              }
            }
          },
          { rootMargin: "100% 0px" },
        )
      : null;
  // Sem IntersectionObserver, todas as faixas valem: o comportamento de antes.
  if (observador) for (const faixa of faixas) observador.observe(faixa);
  else for (const faixa of faixas) perto.add(faixa);

  const soltarScroll = lenis.on("scroll", ({ velocity }) => {
    velocidadeAgora = Math.max(-18, Math.min(18, velocity)).toFixed(2);
    for (const faixa of perto) escrever(faixa, velocidadeAgora);
  });
  return () => {
    vivo = false;
    cancelAnimationFrame(quadro);
    cancelAnimationFrame(quadroMedicaoA);
    cancelAnimationFrame(quadroMedicaoB);
    soltarVirtual();
    soltarScroll();
    window.removeEventListener("click", aoClicarAncora);
    window.removeEventListener("keydown", aoRolarPorTeclado);
    liberarAncora();
    observador?.disconnect();
    lenis.destroy();
    for (const faixa of faixas) faixa.style.removeProperty("--scroll-velocity");
  };
}
