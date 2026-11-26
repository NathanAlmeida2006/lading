import { useRef, useState } from "react";
import { CONTENT } from "../content/content.js";
import { Rails } from "../components/visuals/Rails.jsx";
import { useStoppable } from "../components/ui/useStoppable.js";
import { BLOCK, ENVELOPE } from "../app/ui.js";

const STEPS = CONTENT.demo.steps;
const STEP_MS = 7500;
const SCREEN_HEIGHT = 844; // a tela do app em px de CSS (390 x 844), a mesma das capturas

// Capturas reais do app (390 px de largura, a 2x), cortadas na altura `crop` (px de CSS) que a tela rola. `tab` é o centro (px) da aba
// de destino na barra de baixo, quando o passo seguinte nasce de um toque nela; `nav` é a barra com a aba atual acesa (o Treino não tem).
const SCREENS = {
  hoje: { crop: 1950, nav: true, tapNext: 122 },
  trilha: { crop: 1660, nav: true, tapNext: 195 },
  exercicios: { crop: 1340, nav: true, tapNext: null },
  treino: { crop: 1900, nav: false, tapNext: null },
};

// O aparelho: aro de aço (gradiente de 2 px, com a luz vindo de cima a esquerda), moldura preta de 6 px e a tela. 2 + 6 = os 8 px de
// antes, então a tela mede o mesmo. Os botões laterais saem 3 px do aro: volume e silêncio a esquerda, energia a direita.
const ACO = "bg-[linear-gradient(145deg,#5c5c66,#1d1d22_28%,#0b0b0d_58%,#3b3b43)]";
const BOTAO = "absolute w-[3px] bg-[#2f2f36]";

// O marcador da Trilha do app (`map-milestone`, 11 px) em cada aba: cheio e vermelho com anel no passo atual, vazio de fio claro nos
// já vistos, tracejado nos que faltam. Strings completas, para o Tailwind ver.
const MARCO = {
  atual: "border-accent bg-accent outline-1 outline-accent outline-offset-3",
  visto: "border-bone bg-void",
  falta: "border-dashed border-line-strong bg-void",
};

/**
 * O app Lithium no celular: as telas reais passam em loop, cada uma rolando como nas mãos de quem usa, e o toque na aba leva a
 * seguinte. O tempo de cada passo é a barra do passo ativo (ao fim dela vem o próximo); tudo para fora da tela, com o mouse em
 * cima, e sob movimento reduzido fica parado na primeira tela, com a troca por clique.
 *
 * No celular o seletor é uma fileira de quatro abas acima do aparelho (as barras das telas já vistas ficam cheias) com a
 * legenda do passo; o seletor e o aparelho ficam na mesma vista, e a doca fixa não cobre o controle. Do lg em diante, o acordeão de caixas ao lado do aparelho.
 * @param {object} props - Sem props.
 * @returns {JSX.Element} A seção do app em um celular.
 */
export function AppShowcase() {
  const [index, setIndex] = useState(0);
  const root = useRef(null);
  const { isStopped, isInView, holdProps } = useStoppable(root);
  const playState = { animationPlayState: isStopped ? "paused" : "running" };

  return (
    <section
      id="app"
      ref={root}
      className={`${BLOCK} isolate py-16 md:py-32`}
      aria-label={CONTENT.demo.title}
    >
      <Rails isRunning={isInView} />
      <div
        className={`${ENVELOPE} relative z-1 flex flex-col gap-8 lg:grid lg:grid-cols-12 lg:items-center lg:gap-x-8`}
        {...holdProps}
      >
        {/* Uma linha só, toda em contorno (a receita da dobra), centrada. O tamanho acompanha a coluna (a linha mede ~6,7x a fonte, medido):
            largura da tela menos os 32 px da página e os 24 do `px-3`. Do lg em diante fica só para leitor de tela. */}
        <h2
          className={`px-3 text-center text-nowrap font-secondary text-display uppercase [--text-display:min(calc((100vw-56px)/6.9),72px)] lg:sr-only`}
        >
          {CONTENT.demo.title}
        </h2>

        {/* `lg:contents`: do lg em diante o acordeao vira filho direto da grade, ao lado do aparelho. */}
        <div className="flex flex-col gap-5 px-3 lg:contents">
          <ol
            className="grid grid-cols-4 gap-1 lg:col-[1/7] lg:order-1 lg:flex lg:flex-col lg:gap-3"
            role="list"
          >
            {STEPS.map(({ id, name, text }, i) => {
              const isActive = i === index;
              return (
                <li key={id}>
                  {/* Aba no celular; do lg em diante, botão de verdade em caixa com borda, "+" que vira "-" (a convenção dos cards do app), mão e realce ao passar. */}
                  <button
                    type="button"
                    aria-current={isActive}
                    onClick={() => setIndex(i)}
                    className={`group relative flex w-full min-h-12 cursor-pointer flex-col items-center px-0 pt-[23px] pb-2 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none lg:min-h-0 lg:items-stretch lg:overflow-clip lg:border lg:p-6 ${
                      isActive
                        ? "lg:border-accent lg:bg-surface-1"
                        : "lg:border-line-strong lg:bg-void lg:hover:border-silver lg:hover:bg-surface-1"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`absolute top-0 left-1/2 z-1 size-[11px] -translate-x-1/2 border shadow-[0_0_0_3px_var(--void)] transition-colors duration-150 motion-reduce:transition-none lg:hidden ${isActive ? MARCO.atual : i < index ? MARCO.visto : MARCO.falta}`}
                    />
                    <span className="flex w-full items-center justify-center gap-4 lg:justify-between">
                      <span
                        className={`font-secondary font-extrabold uppercase leading-none tracking-[0.04em] text-[length:clamp(13px,4vw,15px)] transition-colors duration-150 motion-reduce:transition-none lg:tracking-normal lg:text-bone lg:text-[length:clamp(40px,4.4vw,64px)] ${
                          isActive ? "text-bone" : "text-silver"
                        }`}
                      >
                        {name}
                      </span>
                      <span
                        className={`hidden size-9 shrink-0 place-items-center border font-tertiary text-[22px] leading-none lg:grid ${isActive ? "border-accent bg-accent text-bone" : "border-line-strong text-bone group-hover:border-silver"}`}
                        aria-hidden="true"
                      >
                        {isActive ? "−" : "+"}
                      </span>
                    </span>
                    <span
                      className={`hidden transition-[grid-template-rows] duration-300 motion-reduce:transition-none lg:grid ${isActive ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                    >
                      <span className="overflow-hidden">
                        <span className="block max-w-[44ch] pt-1 pb-2 text-silver font-tertiary text-body lg:text-body-lg">
                          {text}
                        </span>
                      </span>
                    </span>
                    {/* A barra de tempo. No celular ocupa a célula inteira e passa por trás do marcador, em todas as abas (cheia nas já vistas); no lg, a base do card ativo. */}
                    <span
                      className={`absolute inset-x-0 top-1 h-[3px] lg:top-auto lg:bottom-0 lg:bg-line-strong ${i < index ? "bg-silver" : "bg-line-strong"} ${isActive ? "" : "lg:hidden"}`}
                    >
                      {isActive && (
                        <span
                          className="absolute inset-0 origin-left bg-accent animate-ruler motion-reduce:animate-none"
                          style={{ animationDuration: `${STEP_MS}ms`, ...playState }}
                          onAnimationEnd={() => setIndex((current) => (current + 1) % STEPS.length)}
                        />
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          {/* A legenda do celular, com a barra vermelha que o app põe ao lado dos próprios títulos. As quatro ocupam a mesma célula da grade (a altura e a da maior, nada pula ao trocar) e trocam em fade. */}
          <div className="grid lg:hidden">
            {STEPS.map(({ id, text }, i) => (
              <p
                key={id}
                aria-hidden={i !== index}
                className={`col-start-1 row-start-1 max-w-[38ch] self-start border-l-2 border-accent pl-4 font-tertiary text-body text-pretty text-silver transition-opacity duration-300 motion-reduce:transition-none ${i === index ? "" : "opacity-0"}`}
              >
                {text}
              </p>
            ))}
          </div>
        </div>

        <div
          className="relative mx-auto w-[min(66vw,300px)] lg:col-[8/-1] lg:w-77.5 lg:order-2"
          aria-hidden="true"
        >
          <span className={`${BOTAO} -left-[3px] top-[16%] h-[4%] rounded-l-[2px]`} />
          <span className={`${BOTAO} -left-[3px] top-[23%] h-[7%] rounded-l-[2px]`} />
          <span className={`${BOTAO} -left-[3px] top-[32%] h-[7%] rounded-l-[2px]`} />
          <span className={`${BOTAO} -right-[3px] top-[26%] h-[11%] rounded-r-[2px]`} />
          <div className={`relative rounded-[40px] p-0.5 ${ACO}`}>
            <div className="relative rounded-[38px] bg-[#000] p-1.5">
              <div className="absolute z-10 top-[11px] left-1/2 h-[18px] w-[22%] -translate-x-1/2 rounded-full bg-[#000]" />
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
                        className={`absolute inset-x-0 top-0 w-full h-auto ${isActive ? "animate-app-scroll motion-reduce:animate-none" : ""}`}
                        style={{
                          "--scroll": `-${((crop - SCREEN_HEIGHT) / crop) * 100}%`,
                          ...playState,
                        }}
                      />
                      {nav && (
                        <img
                          src={`/images/app-nav-${id}.webp`}
                          alt=""
                          width={780}
                          height={160}
                          loading="lazy"
                          decoding="async"
                          className="absolute inset-x-0 bottom-0 w-full h-auto"
                        />
                      )}
                      {isActive && tapNext && (
                        <span
                          className="absolute bottom-[4.7%] size-11 -ml-[22px] rounded-full bg-bone/25 ring-2 ring-bone/60 opacity-0 animate-app-tap motion-reduce:hidden"
                          style={{ left: `${(tapNext / 390) * 100}%`, ...playState }}
                        />
                      )}
                    </div>
                  );
                })}
                {/* O reflexo do vidro: um clarão suave no canto de cima, parado. */}
                <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(125deg,rgba(255,255,255,0.07),transparent_30%)]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
