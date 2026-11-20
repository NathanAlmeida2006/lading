import { useRef } from "react";
import { CONTENT } from "../content/content.js";
import { DotField } from "../components/visuals/DotField.jsx";
import { CtaButton } from "../components/ui/CtaButton.jsx";
import { CardImage } from "../components/ui/CardImage.jsx";
import { revealLineMask, reveal, useMotion } from "../sensory/index.js";
import { useCardStack } from "../sensory/card-stack.js";
import { BLOCK, padTwoDigits, ENVELOPE, GRID_12, MASK } from "../app/ui.js";

// Situação e comportamento do protocolo; não são relatos nem antes/depois corporal.
const CARDS = CONTENT.espelho.cartas;
// Largura real da imagem: 7 das 12 colunas da grade no lg (1024: 584 do card menos 34 de borda e respiro; wide: 718), a coluna toda abaixo (cap de 720 do envelope).
const SIZES = "(min-width: 1440px) 718px, (min-width: 1024px) 550px, (min-width: 720px) 662px, calc(100vw - 58px)";

/**
 * Espelho: as cartas de situação e comportamento do protocolo, empilhadas ao rolar. Não são relatos nem antes e depois corporal.
 * @param {object} props - Sem props.
 * @returns {JSX.Element} A seção Espelho.
 */
export function Mirror() {
  const root = useRef(null);
  const list = useRef(null);

  useMotion(() => {
    const node = root.current;
    if (!node) return;
    revealLineMask(node.querySelector(".titulo"), { delay: 60 });
    reveal(node.querySelector(".espelho__sub"), { delay: 200 });
  }, []);
  useCardStack(root, list);

  return (
    <section id="espelho" className={`${BLOCK} isolate py-16 md:py-24`} ref={root}>
      <DotField variant="estelar" />
      <div className={`${ENVELOPE} relative z-1 ${GRID_12} lg:items-start`}>
        <header className="mb-8 lg:mb-0 lg:col-[1/span_5] lg:sticky lg:top-12">
          <h2
            className={`titulo text-bone font-secundaria text-h1 uppercase lg:text-display [--text-h1:51.2px] lg:[--text-display:clamp(48px,6.2vw,89.6px)] ${MASK}`}
            data-revelar
          >
            {CONTENT.espelho.titulo}
          </h2>
          <p
            className="espelho__sub max-w-prose mt-4 text-silver font-terciaria text-body lg:text-body-lg"
            data-revelar
          >
            {CONTENT.espelho.sub}
          </p>
        </header>

        <div className="lg:col-[6/-1]">
        <ol className="flex flex-col gap-4 lg:gap-6" role="list" ref={list}>
          {CARDS.map((card, index) => (
            <li
              className="carta sticky top-[calc(--spacing(6)+var(--ordem)*--spacing(12))] isolate flex flex-col gap-4 p-3 md:p-4 bg-surface-1 even:bg-void border border-line-strong motion-reduce:static [[data-solta]_&]:static"
              key={card.titulo}
              style={{ "--ordem": index }}
            >
              <div className="relative">
                <CardImage src={card.src} sizes={SIZES} isDimmed={!card.src} className={`aspect-16/10${card.src ? " brightness-60" : ""} ${card.pos ?? ""}`} />
                <span className="absolute left-3 top-3 px-3 py-1 bg-void border border-line-strong text-bone font-terciaria text-mono-reg tabular-nums" aria-hidden="true">
                  {padTwoDigits(index + 1)}
                </span>
                <span className="absolute right-3 top-3 px-3 py-1 bg-acento text-bone font-secundaria text-overline uppercase">
                  {card.lastro}
                </span>
              </div>
              <div className="flex flex-col gap-2 px-2 pb-2">
                {/* Mobile: uma linha so. O maior titulo mede ~14x o corpo (medido), e a largura util do card e a tela menos 74px; do lg em diante quebra normal. */}
                <h3 className="text-bone font-secundaria text-h3-grande [--text-h3-grande:min(24px,calc((100vw-74px)/14.4))] whitespace-nowrap uppercase tracking-normal lg:whitespace-normal lg:text-h2-grande">
                  {card.titulo}
                </h3>
                <p className="max-w-prose text-justify hyphens-auto text-silver font-terciaria text-body lg:text-body-lg">{card.depois}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-8">
          <CtaButton position="espelho" label={CONTENT.espelho.cta} />
        </div>
        </div>
      </div>
    </section>
  );
}
