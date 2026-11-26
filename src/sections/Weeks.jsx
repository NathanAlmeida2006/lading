import { DotField } from "../components/visuals/DotField.jsx";
import { useRef } from "react";
import { CtaButton } from "../components/ui/CtaButton.jsx";
import { CardImage } from "../components/ui/CardImage.jsx";
import { CONTENT } from "../content/content.js";
import { reveal, revealInCascade, useMotion } from "../sensory/index.js";
import { BLOCK, ENVELOPE } from "../app/ui.js";

/**
 * O mapa do caminho: a grade de cards com capa, nome e legenda, em ziguezague vertical (nenhum card alinha
 * com o vizinho), a grade de números e o CTA. Um card por item de `CONTENT.roadmap.states`.
 * @param {object} props - Sem props.
 * @returns {JSX.Element} A seção Semanas, com o mapa do caminho.
 */
const STATES = CONTENT.roadmap.states;

/**
 * Os cards em ziguezague: três por linha no monitor, e o do meio desce uma
 * capa. Nenhum card alinha com o vizinho, que é o que faz a grade ler como
 * composição. A posição sai do índice, e não de `nth-child`.
 */
const OFFSETS = ["", "lg:mt-24", "lg:mt-48"];
// Largura real da imagem: o card (p-4, borda de 1px) menos 34; no lg é 1/3 da coluna (gap de 32), abaixo dele a coluna toda do envelope (cap de 720).
const SIZES =
  "(min-width: 1440px) 382px, (min-width: 1024px) 286px, (min-width: 720px) 654px, calc(100vw - 66px)";

export function Weeks() {
  const root = useRef(null);

  useMotion(() => {
    const node = root.current;
    if (!node) return;
    revealInCascade(node.querySelectorAll(".slide"), { interval: 80 });
    reveal(node.querySelector(".semanas__mais"));
  }, []);

  return (
    <section id="mapa" className={`${BLOCK} border-t-0! pb-16 md:pb-24`} ref={root}>
      <DotField variant="estelar" />
      <div className={`${ENVELOPE} relative z-1`}>
        <h2 className="sr-only">{CONTENT.roadmap.label}</h2>

        <div className="semanas__caminho">
          {/* Cada card: etiqueta (faixa e valor), nome, texto e imagem. */}
          <ol
            className="semanas__trilho flex flex-col gap-12 lg:grid lg:grid-cols-[repeat(3,1fr)] lg:items-start lg:gap-x-8 lg:gap-y-16"
            role="list"
          >
            {STATES.map((state, index) => (
              <li
                className={`slide relative isolate flex flex-col gap-3 p-4 border border-line-strong bg-surface-1 ${OFFSETS[index % 3]}`.trim()}
                key={state.name}
                data-passo={index + 1}
                data-revelar
              >
                <div
                  className="flex items-center justify-between text-overline font-secondary uppercase"
                  aria-hidden="true"
                >
                  <span className="text-silver">{state.range}</span>
                  <span className="text-accent tabular-nums">{state.cover}</span>
                </div>
                <h3 className="text-bone font-secondary text-h3">{state.name}</h3>
                <p className="max-w-prose text-justify hyphens-auto text-silver font-tertiary text-body lg:text-body-lg">
                  {state.text}
                </p>
                <CardImage
                  src={state.src}
                  sizes={SIZES}
                  className={`aspect-11/6 ${state.position ?? ""}`}
                />
              </li>
            ))}
          </ol>
        </div>

        {/* Grade de números no layout da seção "Why us" do Nakula: fio a esquerda e régua de marcas
            no topo de cada coluna. */}
        <div
          className="semanas__mais flex flex-col gap-8 mt-16 pt-8 border-t border-line"
          data-revelar
        >
          <ul className="grid grid-cols-2 lg:grid-cols-4" role="list">
            {CONTENT.roadmap.numbers.map(({ valor, label }) => (
              <li
                className="relative flex flex-col gap-8 border-l border-line px-6 pt-10 pb-6"
                key={label}
              >
                {/* Régua de 13 marcas no topo da coluna. */}
                <span
                  className="absolute top-0 left-[5%] h-2 w-[90%] bg-[repeating-linear-gradient(90deg,var(--line)_0_1px,transparent_1px_calc((100%-1px)/12))]"
                  aria-hidden="true"
                />
                <p className="font-secondary font-extrabold text-bone tabular-nums leading-[1.1] text-[length:clamp(56px,7vw,96px)]">
                  {valor}
                </p>
                <p className="max-w-[16ch] text-bone font-secondary text-body-lg">{label}</p>
              </li>
            ))}
          </ul>

          <div className="self-start">
            <CtaButton position="mapa" label={CONTENT.roadmap.cta} />
          </div>
        </div>
      </div>
    </section>
  );
}
