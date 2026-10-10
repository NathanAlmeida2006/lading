import { useEffect } from "react";

/**
 * Cortina: a secao fica PINADA pela base enquanto a proxima sobe por cima dela (o efeito da
 * secao "FAQs" do Rep Republic). So funciona dentro de um conteiner que contem a secao e a que
 * a cobre: o `sticky` vale ate o fim desse conteiner, onde a secao ja esta toda coberta.
 *
 * O `top` e `innerHeight - altura` (negativo, quando a secao e mais alta que a janela): a base
 * da secao prende na base da janela, e nenhuma parte dela some antes da cobertura. A secao
 * precisa de `isolate`, para o `z-index` dos filhos nao vazar para cima da que a cobre.
 *
 * Nada pode aparecer fatiado pela borda da que sobe: ate `FADE` px acima da borda, a secao
 * pinada esmaece por mascara, entao o conteudo some inteiro em vez de ser cortado no meio.
 * Sob movimento reduzido nao pina: as secoes seguem em fila.
 */
const FADE = 140;

export function useCortina(ref) {
  useEffect(() => {
    const el = ref.current;
    const cobre = el?.parentElement?.children[[...el.parentElement.children].indexOf(el) + 1];
    if (!el || !cobre || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let quadro = 0;
    let topo = 0;
    const medir = () => {
      topo = Math.min(0, window.innerHeight - el.offsetHeight);
    };
    const mascarar = () => {
      quadro = 0;
      // Toda coberta: o pino sai (o layout nao muda, o `sticky` so desloca o desenho) e a secao
      // deixa de contar como "na tela" para os observadores (a doca, o alcance).
      const coberta = cobre.getBoundingClientRect().top <= 0;
      el.style.position = coberta ? "relative" : "sticky";
      el.style.top = coberta ? "" : `${topo}px`;
      // Posicao da borda de cima da que cobre, medida a partir do topo da pinada.
      const y = cobre.getBoundingClientRect().top - el.getBoundingClientRect().top;
      const m = y >= el.offsetHeight ? "" : `linear-gradient(to bottom, #000 ${Math.max(0, y - FADE)}px, transparent ${Math.max(0, y)}px)`;
      el.style.maskImage = m;
      el.style.webkitMaskImage = m;
    };
    const pedir = () => {
      if (!quadro) quadro = requestAnimationFrame(mascarar);
    };
    const aoMudar = () => {
      medir();
      pedir();
    };
    aoMudar();
    const obs = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(aoMudar);
    obs?.observe(el);
    window.addEventListener("resize", aoMudar);
    window.addEventListener("scroll", pedir, { passive: true });
    return () => {
      cancelAnimationFrame(quadro);
      obs?.disconnect();
      window.removeEventListener("resize", aoMudar);
      window.removeEventListener("scroll", pedir);
      el.style.position = "";
      el.style.top = "";
      el.style.maskImage = "";
      el.style.webkitMaskImage = "";
    };
  }, [ref]);
}
