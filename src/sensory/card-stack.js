import { useMotion } from "./index.js";

/**
 * Pilha de cartas (Espelho): solta a pilha (`data-solta`) quando algum card nao cabe inteiro na janela.
 * @param {{ current: HTMLElement | null }} root - Ref da seção.
 * @param {{ current: HTMLElement | null }} list - Ref da lista de cards.
 */
export function useCardStack(root, list) {
  useMotion(() => {
    const node = root.current;
    if (!node) return;
    // A pilha so serve se cada card, grudado no seu degrau, cabe inteiro na janela: senao
    // ela SOLTA (`data-solta`) e os cards seguem em fila. So se mede com o grude ligado: sob
    // movimento reduzido o `top` e `auto`, a conta vira NaN e a pilha continua como esta.
    const stack = list.current;
    const cards = [...node.querySelectorAll(".carta")];
    const measure = () => {
      stack.removeAttribute("data-solta");
      const isFitting = cards.every((card, i) =>
        i === cards.length - 1 || !(parseFloat(getComputedStyle(card).top) + card.offsetHeight > window.innerHeight));
      stack.toggleAttribute("data-solta", !isFitting);
    };
    // So a LARGURA reage: a barra do navegador no celular muda a altura a cada rolagem.
    let width = window.innerWidth;
    const handleResize = () => {
      if (window.innerWidth === width) return;
      width = window.innerWidth;
      measure();
    };
    let isActive = true;
    measure();
    document.fonts.ready.then(() => { if (isActive) measure(); });
    window.addEventListener("resize", handleResize);
    return () => {
      isActive = false;
      window.removeEventListener("resize", handleResize);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- intencional: raiz e lista sao refs estaveis e a pilha e medida uma vez na montagem, com o redimensionamento cuidando da largura; rodar de novo duplicaria os ouvintes
}
