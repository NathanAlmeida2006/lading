import { useRef } from "react";
import { useMotion } from "../../sensory/index.js";
import { DotField } from "./DotField.jsx";

/**
 * As dez pontas soltas: posicao, tamanho e o keyframe de cada uma
 * (`--animate-vagar-N`, em styles/residual.css). Ornamento: somem sob movimento
 * reduzido.
 */
const TIPS = [
  "top-[8%] left-[8%] size-7.5 animate-vagar-1",
  "top-[13%] left-[76%] size-5.5 animate-vagar-2",
  "top-[6%] left-[42%] size-9.5 animate-vagar-3",
  "top-[4%] left-[60%] size-6.5 animate-vagar-4",
  "top-[16%] left-[24%] size-8.5 animate-vagar-5",
  "top-[10%] left-[90%] size-6 animate-vagar-6",
  "top-[45%] left-[15%] size-7.5 animate-vagar-7",
  "top-[60%] left-[55%] size-9 animate-vagar-8",
  "top-[78%] left-[30%] size-7 animate-vagar-9",
  "top-[85%] left-[68%] size-8 animate-vagar-10",
];

/**
 * As dez pontas soltas, sozinhas: triangulos que surgem, vagam e somem, cada um no seu tempo. `layer` e a classe do z-index
 * (por cima de tudo na dobra, por baixo do conteudo em outras secoes). Pausam fora da tela (ver abaixo).
 *
 * As pontas (e a seta da dobra) sao animacoes de CSS infinitas, e o Chrome reavalia o estilo de cada
 * uma a cada quadro em que a thread principal desenha QUALQUER coisa (medido: ~0,9 ms por quadro so
 * por elas, a pagina inteira, inclusive a 16.000 px de distancia). Fora da tela, a secao ganha
 * `data-fora` e o CSS (residual.css) pausa as duas; ao voltar, elas seguem de onde pararam.
 * @param {object} props
 * @param {string} [props.layer="z-3"] - Classe de z-index das pontas.
 * @returns {JSX.Element[]}
 */
export function FloatingTips({ layer = "z-3" }) {
  const first = useRef(null);

  useMotion(() => {
    const section = first.current?.parentElement;
    if (!section) return;
    const observer = new IntersectionObserver(([entry]) => section.toggleAttribute("data-fora", !entry.isIntersecting), {
      rootMargin: "200px 0px",
    });
    observer.observe(section);
    return () => {
      observer.disconnect();
      section.removeAttribute("data-fora");
    };
  }, []);

  return TIPS.map((positionClass, index) => (
    <svg
      key={positionClass}
      ref={index === 0 ? first : undefined}
      className={`ponta absolute ${layer} opacity-0 pointer-events-none fill-acento motion-reduce:hidden ${positionClass}`}
      viewBox="0 0 200 200"
      aria-hidden="true"
    >
      <path d="M71.6 12.5L128.4 12.5L100.0 58.0Z" />
    </svg>
  ));
}

/** O fundo animado dos paineis de tela cheia: malha de pontos e as pontas soltas por cima. */
/**
 * @returns {JSX.Element} O campo de pontos e as pontas soltas, em camadas.
 */
export function CoverBackground() {
  return (
    <>
      <DotField />
      <FloatingTips />
    </>
  );
}
