import { useEffect } from "react";
import { isMotionReduced } from "./tokens.js";

/**
 * Cortina: a secao fica PINADA pela base enquanto a proxima sobe por cima dela (o efeito da
 * secao "FAQs" do Rep Republic). So funciona dentro de um conteiner que contem a secao e a que
 * a cobre: o `sticky` vale ate o fim desse conteiner, onde a secao ja esta toda coberta.
 *
 * O `top` e `innerHeight - height` (negativo, quando a secao e mais alta que a janela): a base
 * da secao prende na base da janela, e nenhuma parte dela some antes da cobertura. A secao
 * precisa de `isolate`, para o `z-index` dos filhos nao vazar para cima da que a cobre.
 *
 * Nada pode aparecer fatiado pela borda da que sobe: ate `FADE` px acima da borda, a secao
 * pinada esmaece por mascara, entao o conteudo some inteiro em vez de ser cortado no meio.
 * Sob movimento reduzido nao pina: as secoes seguem em fila.
 * @param {{ current: HTMLElement | null }} ref - Ref da seção que é pinada.
 */
const FADE = 140;

export function useCurtain(ref) {
  useEffect(() => {
    const element = ref.current;
    const cover = element?.nextElementSibling;
    if (!element || !cover || isMotionReduced()) return;
    let frame = 0;
    let top = 0;
    let height = 0;
    // O ultimo valor escrito de cada estilo: a rolagem reescrevia os quatro a cada quadro, mesmo iguais.
    let position;
    let topCss;
    let mask;
    const measure = () => {
      height = element.offsetHeight;
      top = Math.min(0, window.innerHeight - height);
    };
    const applyMask = () => {
      frame = 0;
      const coverTop = cover.getBoundingClientRect().top;
      // Toda coberta: o pino sai (o layout nao muda, o `sticky` so desloca o desenho) e a secao
      // deixa de contar como "na tela" para os observadores (a doca, o alcance).
      // `< 1`, nao `<= 0`: o topo real pode ficar em fracao de pixel (0,234 medido) e a secao ficaria presa atras, desenhando sem ninguem ver.
      const isCovered = coverTop < 1;
      const nextPosition = isCovered ? "relative" : "sticky";
      const nextTop = isCovered ? "" : `${top}px`;
      if (nextPosition !== position) element.style.position = position = nextPosition;
      if (nextTop !== topCss) element.style.top = topCss = nextTop;
      // Posicao da borda de cima da que cobre, medida a partir do topo da pinada.
      const y = coverTop - element.getBoundingClientRect().top;
      const maskValue = y >= height ? "" : `linear-gradient(to bottom, #000 ${Math.max(0, y - FADE)}px, transparent ${Math.max(0, y)}px)`;
      if (maskValue !== mask) {
        mask = maskValue;
        element.style.maskImage = maskValue;
        element.style.webkitMaskImage = maskValue;
      }
    };
    const requestUpdate = () => {
      if (!frame) frame = requestAnimationFrame(applyMask);
    };
    const handleChange = () => {
      measure();
      requestUpdate();
    };
    handleChange();
    const observer = new ResizeObserver(handleChange);
    observer.observe(element);
    window.addEventListener("resize", handleChange);
    window.addEventListener("scroll", requestUpdate, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", handleChange);
      window.removeEventListener("scroll", requestUpdate);
      element.style.position = "";
      element.style.top = "";
      element.style.maskImage = "";
      element.style.webkitMaskImage = "";
    };
  }, [ref]);
}
