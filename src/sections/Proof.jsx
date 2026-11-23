import { Fragment, useRef, useState } from "react";
import { CONTENT } from "../content/content.js";
import { DotField } from "../components/visuals/DotField.jsx";
import { useStoppable } from "../components/ui/useStoppable.js";
import { Nota } from "../components/ui/Nota.jsx";
import { BLOCK, ENVELOPE, padTwoDigits } from "../app/ui.js";

const SLIDES = CONTENT.prova.depoimentos;
const RATING = CONTENT.prova.avaliacao; // `null` sem nota publicável (validation.js): o bloco da nota some

/**
 * Trecho que sobe de dentro de um recorte (a mesma mascara das headlines do site). Entra subindo, escalonado por
 * `delay`; sai subindo mais rapido; fora de cena fica abaixo do recorte, sem transicao, pronto para a proxima entrada.
 * @param {object} props
 * @param {"in"|"out"|"wait"} props.phase - Entrando (ativo), saindo (o anterior) ou esperando.
 * @param {number} [props.delay=0] - Atraso da entrada, em ms.
 * @param {import("react").ReactNode} props.children - Conteudo.
 * @returns {JSX.Element} O trecho mascarado.
 */
function Rise({ phase, delay = 0, children }) {
  return (
    <span className="inline-block overflow-y-clip align-bottom pt-[0.12em] pb-[0.12em] -my-[0.12em]">
      <span
        className={`inline-block motion-reduce:transition-none ${
          phase === "in" ? "translate-y-0 transition-transform duration-700 ease-(--ease-default)"
            : phase === "out" ? "-translate-y-[140%] transition-transform duration-300 ease-in"
              : "js:translate-y-[140%]"
        }`}
        style={{ transitionDelay: phase === "in" ? `${delay}ms` : undefined }}
      >
        {children}
      </span>
    </span>
  );
}

/**
 * Prova social: um depoimento por vez, em loop. A troca e a subida de palavras dentro de um recorte, como nas headlines do
 * site: o depoimento atual sai para cima e o proximo sobe palavra a palavra. O tempo de cada um e a propria regua de baixo: ela enche
 * em 5 s e, ao fim, passa ao proximo. A regua para com o mouse ou o foco em cima;
 * sob movimento reduzido ela nao anda e a troca e so por clique.
 * @param {object} props - Sem props.
 * @returns {JSX.Element} A secao de prova social.
 */
export function Proof() {
  const [{ index, prev }, setPosition] = useState({ index: 0, prev: -1 });
  const goTo = (next) => setPosition((current) => (next === current.index ? current : { index: next, prev: current.index }));
  const root = useRef(null);
  const { isStopped, isSeen, holdProps } = useStoppable(root);

  return (
    <section id="prova-social" ref={root} className={`${BLOCK} isolate py-20 md:py-32`} aria-roledescription="carrossel" aria-label={CONTENT.prova.titulo}>
      <DotField variant="estelar" />
      <div className={`${ENVELOPE} relative z-1`} {...holdProps}>
        <h2 className="sr-only">{CONTENT.prova.titulo}</h2>

        <div className="grid" aria-live={isStopped ? "polite" : "off"}>
          {SLIDES.map((slide, i) => {
            const isActive = i === index;
            const isLeaving = i === prev;
            const phase = isActive && isSeen ? "in" : isLeaving ? "out" : "wait";
            return (
              <figure
                key={slide.nome}
                className={`col-start-1 row-start-1 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between lg:gap-16 ${isActive || isLeaving ? "" : "invisible"} ${isActive ? "" : "pointer-events-none"}`}
                aria-hidden={!isActive}
                aria-roledescription="slide"
                aria-label={`${i + 1} de ${SLIDES.length}`}
              >
                <div className="flex flex-col gap-4">
                  <div>
                    <span className="block font-secundaria font-extrabold text-acento text-[120px] leading-[0.7] h-14 lg:text-[200px] lg:h-24" aria-hidden="true">&ldquo;</span>
                  </div>
                  <blockquote className="max-w-[24ch] text-bone font-secundaria font-bold leading-[1.04] text-[length:clamp(30px,8.4vw,72px)] lg:max-w-[28ch] lg:text-[length:clamp(44px,5vw,76px)]">
                    {slide.texto.split(" ").map((word, w) => (
                      <Fragment key={`${word}-${w}`}>
                        <Rise phase={phase} delay={120 + w * 45}>{word}</Rise>{" "}
                      </Fragment>
                    ))}
                  </blockquote>
                </div>

                <figcaption className="flex items-center gap-4 lg:flex-col lg:items-start lg:w-64 lg:shrink-0 lg:pb-2">
                  <span className="size-14 overflow-clip" aria-hidden="true">
                    <img
                      src={slide.src}
                      alt=""
                      width="56"
                      height="56"
                      loading="lazy"
                      decoding="async"
                      className={`block size-full object-cover bg-surface-1 motion-reduce:transition-none ${
                        phase === "in" ? "translate-y-0 transition-transform duration-500 ease-(--ease-default) delay-300"
                          : phase === "out" ? "-translate-y-[140%] transition-transform duration-300 ease-in" : "js:translate-y-[140%]"
                      }`}
                    />
                  </span>
                  <span className="flex flex-col gap-1">
                    <span className="block text-bone font-secundaria text-label-grande uppercase"><Rise phase={phase} delay={450}>{slide.nome}</Rise></span>
                    <span className="block text-silver font-terciaria text-caption-grande"><Rise phase={phase} delay={520}>{slide.contexto}</Rise></span>
                  </span>
                </figcaption>
              </figure>
            );
          })}
        </div>

        <div className="flex items-center gap-4 mt-12 lg:mt-16">
          <div className="grid flex-1 gap-2" style={{ gridTemplateColumns: `repeat(${SLIDES.length}, 1fr)` }}>
            {SLIDES.map((slide, i) => (
              <button
                key={slide.nome}
                type="button"
                aria-label={`Depoimento ${i + 1} de ${SLIDES.length}`}
                aria-current={i === index}
                onClick={() => goTo(i)}
                className="group relative h-8 cursor-pointer"
              >
                <span className="absolute inset-x-0 bottom-3 h-[3px] overflow-clip bg-line-strong group-hover:bg-silver">
                  <span
                    className={`absolute inset-0 origin-left bg-acento ${i === index ? "scale-x-100 animate-regua motion-reduce:animate-none" : "scale-x-0"}`}
                    style={{ animationPlayState: isStopped ? "paused" : "running" }}
                    onAnimationEnd={() => setPosition((current) => ({ index: (current.index + 1) % SLIDES.length, prev: current.index }))}
                  />
                </span>
              </button>
            ))}
          </div>
          <span className="font-terciaria text-mono-grande tabular-nums text-silver" aria-hidden="true">
            [{padTwoDigits(index + 1)}/{padTwoDigits(SLIDES.length)}]
          </span>
        </div>

        {RATING && <Nota nota={RATING.nota} maximo={RATING.maximo} rotulo={RATING.rotulo} className="mt-12 lg:mt-16" />}
      </div>
    </section>
  );
}
