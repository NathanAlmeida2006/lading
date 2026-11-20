import { useRef } from "react";
import { DotField } from "../components/visuals/DotField.jsx";
import { Faq } from "../components/ui/Faq.jsx";
import { CONTENT } from "../content/content.js";
import { revealLineMask, reveal, revealInCascade, useMotion } from "../sensory/index.js";
import { isMotionReduced } from "../sensory/tokens.js";
import { BLOCK, ENVELOPE, GRID_12, MASK } from "../app/ui.js";

/**
 * As perguntas frequentes, em acordeao, sobre o campo estelar (pontos que cintilam e somem).
 * @param {object} props - Sem props.
 * @returns {JSX.Element} A seção de perguntas frequentes.
 */
export function Objections() {
  const root = useRef(null);
  useMotion(() => {
    if (isMotionReduced()) return;
    const node = root.current;
    if (!node) return;
    revealLineMask(node.querySelector(".titulo"), { delay: 60 });
    // Revelar o item inteiro preserva a resposta após recolher e reabrir.
    revealInCascade(node.querySelectorAll(".dialogo > div"), { interval: 90 });
  }, []);

  return (
    <section id="objecoes" className={`${BLOCK} py-8 md:py-24`} ref={root}>
      <DotField variant="estelar" />
      <div className={`${ENVELOPE} relative z-1 ${GRID_12}`}>
        <div className="min-w-0 lg:col-[1/span_5] lg:sticky lg:top-24 lg:self-start">
          <h2 className={`titulo text-bone font-secundaria text-h1 uppercase lg:text-display ${MASK}`} data-revelar>
            {CONTENT.objecoesTitulo}
          </h2>
        </div>
        <div className="mt-6 min-w-0 lg:mt-0 lg:col-[6/span_7] lg:pt-4">
          <Faq items={CONTENT.objecoes} />
        </div>
      </div>
    </section>
  );
}
