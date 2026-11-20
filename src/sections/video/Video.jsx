import { useEffect, useRef, useState } from "react";
import { DotField } from "../../components/visuals/DotField.jsx";
import { warmUpFluid } from "../../components/visuals/FluidBackground.jsx";
import { FloatingTips } from "../../components/visuals/CoverBackground.jsx";
import { createSound, prepareSound } from "./sound.js";
import { useTimeline } from "./schedule.js";
import { DO_IT_BEAT, DROP_MS, STAGES, MUSIC_END, TIMELINE, getBeatTime } from "./timing.js";
import { BLOCK, ENVELOPE } from "../../app/ui.js";
import { trackVideoStart } from "../../infra/instrumentation.js";

/** O botao de play da secao de video. */
const playButton =
  "group relative [--u:min(1svh,1.7vw)] grid place-items-center size-40 lg:size-64 rounded-full bg-acento " +
  "before:content-[''] before:absolute before:inset-0 before:rounded-full before:border-2 before:border-acento " +
  "motion-safe:before:animate-anel text-void transition-transform duration-(--motion-fast) hover:scale-105 " +
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bone " +
  "data-tocando:before:hidden data-tocando:pointer-events-none z-3";

/**
 * Secao de video, codigo puro: tela cheia, fundo preto e o play no meio. O clique toca um som e abre
 * a introducao: um unico circulo vermelho sai do play e cobre a secao, e o triangulo preto do play vira um L
 * enorme (Big Shoulders) e o "ithium" sobe na vertical, alinhado ao topo e a direita do L. As proximas partes do video entram depois, sobre esse vermelho.
 * Sob movimento reduzido nao ha circulo: o fundo vai direto ao vermelho.
 * @param {object} props - Sem props.
 * @returns {JSX.Element} A seção de vídeo.
 */
export function Video() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [stage, setStage] = useState(-1);
  const [isCovered, setIsCovered] = useState(false); // o circulo vermelho ja cobriu a secao: a malha e as pontas dela, atras dele, deixam de ser desenhadas
  const [round, setRound] = useState(0); // cada repeticao remonta o play e o circulo, para as animacoes recomecarem
  const [stageModule, setStageModule] = useState(null); // o modulo do palco; se a carga falhar, o video fica no vermelho e a pagina segue
  const load = () => import("./Stage.jsx").then((m) => { setStageModule(m); return m; });
  const timeline = useTimeline(setStage);
  const origin = useRef(0);
  const sound = useRef(null);
  const schedule = useRef({}); // a hora (performance.now) em que cada estagio devia entrar: quem anima por dentro conta dela, e nao de quando montou
  const speed = useRef(undefined); // a da rolagem da Trilha: o Registro anda na mesma velocidade
  const section = useRef(null);
  useEffect(() => () => { sound.current?.stop(200); }, []);

  // Perto de aparecer na tela, desce o palco, para o primeiro corte nao depender da rede; a musica so desce com a intencao de tocar.
  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { load().catch(() => {}); obs.disconnect(); } }, { rootMargin: "800px 0px" });
    obs.observe(section.current);
    return () => obs.disconnect();
  }, []);

  const play = (isRepeat = false) => {
    if (isPlaying && !isRepeat) return;
    if (!isRepeat) trackVideoStart();
    timeline.stop();
    sound.current?.stop(250);
    if (isRepeat) { setStage(-1); setIsCovered(false); setRound((count) => count + 1); }
    const session = (sound.current = createSound());
    session.music(DROP_MS); // o fade-in sobe, suave, ate o drop
    session.effect(getBeatTime(DO_IT_BEAT));
    session.fadeOutIn(getBeatTime(MUSIC_END.beat), MUSIC_END.duration);
    load().then((m) => m.prepareModels()).catch(() => {});
    const t0 = performance.now();
    origin.current = t0;
    setIsPlaying(true);
    // Cada estagio entra na sua batida, no relogio do clique (nenhum depende de a rolagem acabar).
    Object.assign(schedule.current, timeline.start(TIMELINE, t0));
    // A tela fica parada entre o fim do circulo e o L, que so anda aos 1500 ms.
    timeline.after(800, warmUpFluid);
  };

  // Da carga em diante tudo o que entra cobre a secao: o play (o L e o "ithium") e o vermelho que ficam atras nao tem mais o que
  // mostrar, e qualquer quadro em que uma tela ainda nao pintou (celular lento) deixava a logo aparecer. Escondidos, so sobra o escuro.
  const isCoveredByStage = stage >= STAGES.load;
  return (
    <section id="video" ref={section} className={`${BLOCK} flex flex-col justify-center min-h-svh py-16 md:py-24`}>
      {/* O campo estelar de pontos do player, atras de tudo; as pontas e o circulo do clique ficam por cima dela. */}
      {!isCovered && <DotField variant="estelar" />}
      {/* Os triangulos que surgem e somem, atras do play (z-1); o circulo vermelho do clique (z-2) os cobre. Sob movimento reduzido nao ha circulo nem evento: seguem montados (e parados). */}
      {!isCovered && <FloatingTips layer="z-1" />}
      <div className={ENVELOPE}>
        <div className="grid place-items-center">
          <button
            type="button"
            key={round}
            className={`${playButton}${isCoveredByStage ? " invisible" : ""}`}
            aria-label="Reproduzir vídeo"
            data-tocando={isPlaying ? "" : undefined}
            onClick={() => play()}
            onPointerEnter={prepareSound}
            onFocus={prepareSound}
          >
            <span
              className="block w-1/2 h-1/2 bg-current [clip-path:polygon(35%_17%,62%_33.5%,89%_50%,62%_66.5%,35%_83%,35%_50%)] group-data-tocando:animate-letra motion-reduce:[animation-delay:0ms]"
              aria-hidden="true"
            />
            <span
              className="absolute right-[calc(50%-15*var(--u))] top-[calc(50%-31*var(--u)-0.12em)] rotate-180 [writing-mode:vertical-rl] font-secundaria font-extrabold uppercase leading-[0.75] tracking-[0.12em] text-[length:calc(15.2*var(--u))]"
              aria-hidden="true"
            >
              {[..."ithium"].map((letter, i) => (
                <span className="ithium-letra opacity-0 group-data-tocando:animate-ithium-letra" style={{ animationDelay: `${2300 + i * 55}ms` }} key={i}>{letter}</span>
              ))}
            </span>
            {isPlaying && <span className="absolute inset-0 rounded-full border-2 border-bone motion-safe:animate-onda pointer-events-none" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {isPlaying && <div className={`absolute inset-0 z-2 pointer-events-none ${isCoveredByStage ? "bg-void" : "bg-acento"} motion-safe:animate-corte`} aria-hidden="true" onAnimationEnd={() => setIsCovered(true)} key={round} />}

      {isPlaying && stageModule && <stageModule.default stage={stage} schedule={schedule} origin={origin} speed={speed} onRepeat={() => play(true)} />}
    </section>
  );
}
