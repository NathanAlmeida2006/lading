import { useEffect, useState } from "react";

/**
 * O que um carrossel automático precisa para não andar sozinho onde ninguém vê: só roda com a seção na faixa central da
 * tela, para com o mouse (não o toque) ou o foco de teclado em cima e aceita pausa manual (`togglePause`). `isSeen` vira
 * verdadeiro na primeira vez que a seção aparece (a entrada do primeiro item só toca aí).
 * @param {{current: HTMLElement | null}} root - Ref da seção observada.
 * @returns {{isStopped: boolean, isInView: boolean, isSeen: boolean, isPaused: boolean, togglePause: () => void, holdProps: object}} O estado e os ouvintes para espalhar na área que segura o carrossel.
 */
export function useStoppable(root) {
  const [isPaused, setIsPaused] = useState(false);
  const [isHeld, setIsHeld] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [isSeen, setIsSeen] = useState(false);

  useEffect(() => {
    const node = root.current;
    if (!node) return undefined;
    // A janela é que decide, não a fração da seção: com `threshold: 0.4` uma seção mais alta que a tela (ou o celular
    // deitado) nunca mostrava 40% de si e o carrossel não andava, e a seção só "acordava" com boa parte dela na tela
    // enquanto o telefone já estava visível. Aqui a seção conta quando toca a faixa central da tela (15% de folga em cima
    // e embaixo), qualquer que seja a altura dela. Mesma ideia de `reach.js`.
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
        if (entry.isIntersecting) setIsSeen(true);
      },
      { rootMargin: "-15% 0px -15% 0px", threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [root]);

  return {
    isStopped: isPaused || isHeld || !isInView,
    isInView,
    isSeen,
    isPaused,
    togglePause: () => setIsPaused((paused) => !paused),
    holdProps: {
      // Só mouse e foco de teclado seguram: o toque dispara o "mouseenter" emulado e deixa o foco no botão tocado, e o carrossel
      // pararia para sempre no celular.
      onPointerEnter: (event) => setIsHeld(event.pointerType === "mouse"),
      onPointerLeave: () => setIsHeld(false),
      onFocus: (event) => setIsHeld(event.target.matches(":focus-visible")),
      onBlur: () => setIsHeld(false),
    },
  };
}
