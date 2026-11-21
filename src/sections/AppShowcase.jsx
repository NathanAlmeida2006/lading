import { useRef, useState } from "react";
import { CONTENT } from "../content/content.js";
import { DotField } from "../components/visuals/DotField.jsx";
import { useStoppable } from "../components/ui/useStoppable.js";
import { BLOCK, ENVELOPE } from "../app/ui.js";

const STEPS = CONTENT.demo.passos;
const STEP_MS = 7500;
const SCREEN_HEIGHT = 844; // a tela do app em px de CSS (390 x 844), a mesma das capturas

// Capturas reais do app (390 px de largura, a 2x), cortadas na altura `crop` (px de CSS) que a tela rola. `tab` e o centro (px) da aba
// de destino na barra de baixo, quando o passo seguinte nasce de um toque nela; `nav` e a barra com a aba atual acesa (o Treino nao tem).
const SCREENS = {
  hoje: { crop: 1950, nav: true, tapNext: 122 },
  trilha: { crop: 1660, nav: true, tapNext: 195 },
  exercicios: { crop: 1340, nav: true, tapNext: null },
  treino: { crop: 1900, nav: false, tapNext: null },
};

/**
 * O app Lithium no celular: as telas reais passam em loop, cada uma rolando como nas maos de quem usa, e o toque na aba leva a
 * seguinte. O tempo de cada passo e a barra do passo ativo (ao fim dela vem o proximo); tudo para fora da tela, com o mouse em
 * cima, e sob movimento reduzido fica parado na primeira tela, com a troca por clique.
 * @param {object} props - Sem props.
 * @returns {JSX.Element} A secao do app em um celular.
 */
export function AppShowcase() {
  const [index, setIndex] = useState(0);
  const root = useRef(null);
  const { isStopped, holdProps } = useStoppable(root);
  const playState = { animationPlayState: isStopped ? "paused" : "running" };

  return (
    <section id="app" ref={root} className={`${BLOCK} isolate py-20 md:py-32`} aria-label={CONTENT.demo.titulo}>
      <DotField variant="estelar" />
      <div className={`${ENVELOPE} relative z-1 flex flex-col gap-12 lg:grid lg:grid-cols-12 lg:items-center lg:gap-x-8`} {...holdProps}>
        <h2 className="sr-only">{CONTENT.demo.titulo}</h2>

        <div className="relative mx-auto w-[min(100%,300px)] lg:col-[8/-1] lg:w-77.5 lg:order-2" aria-hidden="true">
          <div
            className="absolute -inset-[25%] -z-1 bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--acento)_38%,transparent),transparent)] animate-app-brilho motion-reduce:animate-none"
            style={playState}
          />
          <div className="relative p-2 rounded-[40px] bg-black border border-line-strong">
            <div className="absolute z-10 top-[18px] left-1/2 h-5 w-[26%] -translate-x-1/2 rounded-full bg-black" />
            <div className="relative aspect-[390/844] overflow-clip rounded-[32px] bg-void">
              {STEPS.map(({ id }, i) => {
                const { crop, nav, tapNext } = SCREENS[id];
                const isActive = i === index;
                return (
                  <div key={id} className={`absolute inset-0 ${isActive ? "" : "invisible"}`}>
                    <img
                      src={`/images/app-${id}.webp`}
                      alt=""
                      width={780}
                      height={crop * 2}
                      loading="lazy"
                      decoding="async"
                      className={`absolute inset-x-0 top-0 w-full h-auto ${isActive ? "animate-app-rola motion-reduce:animate-none" : ""}`}
                      style={{ "--rola": `-${((crop - SCREEN_HEIGHT) / crop) * 100}%`, ...playState }}
                    />
                    {nav && <img src={`/images/app-nav-${id}.webp`} alt="" width={780} height={160} loading="lazy" decoding="async" className="absolute inset-x-0 bottom-0 w-full h-auto" />}
                    {isActive && tapNext && (
                      <span
                        className="absolute bottom-[4.7%] size-11 -ml-[22px] rounded-full bg-white/25 ring-2 ring-white/60 opacity-0 animate-app-toque motion-reduce:hidden"
                        style={{ left: `${(tapNext / 390) * 100}%`, ...playState }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <ol className="flex flex-col gap-3 lg:col-[1/7] lg:order-1" role="list">
          {STEPS.map(({ id, nome, texto }, i) => {
            const isActive = i === index;
            return (
              <li key={id}>
                {/* Botao de verdade: caixa com borda, "+" que vira "-" (a convencao dos cards do app), mao e realce ao passar. */}
                <button
                  type="button"
                  aria-current={isActive}
                  onClick={() => setIndex(i)}
                  className={`group relative flex w-full cursor-pointer flex-col overflow-clip border p-4 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento motion-reduce:transition-none lg:p-6 ${
                    isActive ? "border-acento bg-surface-1" : "border-line-strong hover:border-silver hover:bg-surface-1"
                  }`}
                >
                  <span className="flex w-full items-center justify-between gap-4">
                    <span className="font-secundaria font-extrabold uppercase leading-none text-bone text-[length:clamp(30px,8vw,40px)] lg:text-[length:clamp(40px,4.4vw,64px)]">{nome}</span>
                    <span
                      className={`grid size-9 shrink-0 place-items-center border font-terciaria text-[22px] leading-none ${isActive ? "border-acento bg-acento text-bone" : "border-line-strong text-bone group-hover:border-silver"}`}
                      aria-hidden="true"
                    >
                      {isActive ? "\u2212" : "+"}
                    </span>
                  </span>
                  <span className={`grid transition-[grid-template-rows] duration-300 motion-reduce:transition-none ${isActive ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                    <span className="overflow-hidden">
                      <span className="block max-w-[44ch] pt-1 pb-2 text-silver font-terciaria text-body lg:text-body-lg">{texto}</span>
                    </span>
                  </span>
                  {isActive && (
                    <span className="absolute inset-x-0 bottom-0 h-[3px] bg-line-strong">
                      <span
                        className="absolute inset-0 origin-left bg-acento animate-regua motion-reduce:animate-none"
                        style={{ animationDuration: `${STEP_MS}ms`, ...playState }}
                        onAnimationEnd={() => setIndex((current) => (current + 1) % STEPS.length)}
                      />
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
