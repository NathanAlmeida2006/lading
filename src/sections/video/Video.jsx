import { useEffect, useEffectEvent, useRef, useState } from "react";
import { DotField } from "../../components/visuals/DotField.jsx";
import { warmUpFluid } from "../../components/visuals/FluidBackground.jsx";
import { FloatingTips } from "../../components/visuals/CoverBackground.jsx";
import { createSound, prepareSound } from "./sound.js";
import { watchPlayback } from "./playback.js";
import { isPaused, setPaused } from "../../sensory/pause.js";
import { useTimeline } from "./schedule.js";
import { DO_IT_BEAT, DROP_MS, STAGES, MUSIC_END, TIMELINE, getBeatTime } from "./timing.js";
import { Timeline } from "./Timeline.jsx";
import { CONTENT } from "../../content/content.js";
import { BLOCK, ENVELOPE } from "../../app/ui.js";
import { trackVideoStart } from "../../infra/instrumentation.js";

/** O botão de play da seção de vídeo. */
const playButton =
  "group relative [--u:min(1svh,1.7vw)] grid place-items-center size-40 lg:size-64 rounded-full bg-accent " +
  "before:content-[''] before:absolute before:inset-0 before:rounded-full before:border-2 before:border-accent " +
  "motion-safe:before:animate-ring text-void transition-transform duration-(--motion-fast) hover:scale-105 " +
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bone " +
  "data-tocando:before:hidden data-tocando:pointer-events-none z-3";

/** O botão de parar: no canto do player, por cima do palco, só enquanto o vídeo toca. */
const stopButton =
  "absolute right-3 top-3 z-10 inline-flex items-center justify-center min-h-12 min-w-12 px-4 border border-line-strong rounded-xs " +
  "bg-void text-bone font-secondary text-label uppercase cursor-pointer hover:border-bone " +
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bone";

/**
 * Seção de vídeo, código puro: tela cheia, fundo preto e o play no meio. O clique toca um som e abre
 * a introdução: o gancho (Takes.jsx, TakeHook) cobre o primeiro 1,5 s e sai; sob ele, um único círculo vermelho sai do play e cobre a seção, e o
 * triângulo preto do play vira um L enorme (Big Shoulders) e o "ithium" sobe na vertical, alinhado ao topo e à direita do L. As próximas partes do vídeo entram depois, sobre esse vermelho.
 * Sob movimento reduzido não há círculo: o fundo vai direto ao vermelho.
 * @param {object} props - Sem props.
 * @returns {JSX.Element} A seção de vídeo.
 */
export function Video() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [stage, setStage] = useState(-1);
  const [isCovered, setIsCovered] = useState(false); // o círculo vermelho já cobriu a seção: a malha e as pontas dela, atrás dele, deixam de ser desenhadas
  const [round, setRound] = useState(0); // cada repetição remonta o play e o círculo, para as animações recomeçarem
  const [stageModule, setStageModule] = useState(null); // o módulo do palco; se a carga falhar, o vídeo fica no vermelho e a página segue
  const load = () =>
    import("./Stage.jsx").then((m) => {
      setStageModule(m);
      return m;
    });
  const timeline = useTimeline(setStage);
  const origin = useRef(0);
  const sound = useRef(null);
  const schedule = useRef({}); // a hora (performance.now) em que cada estágio devia entrar: quem anima por dentro conta dela, e não de quando montou
  const section = useRef(null);
  const player = useRef(null);
  const playButtonRef = useRef(null);
  const shouldFocusPlay = useRef(false); // a parada veio do botão Parar: o foco volta ao play, e não cai no body
  useEffect(
    () => () => {
      sound.current?.stop(200);
    },
    [],
  );

  // Perto de aparecer na tela, desce o palco, para o primeiro corte não depender da rede; a música só desce com a intenção de tocar.
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          load().catch(() => {});
          obs.disconnect();
        }
      },
      { rootMargin: "800px 0px" },
    );
    obs.observe(section.current);
    return () => obs.disconnect();
  }, []);

  const play = (isRepeat = false) => {
    if (isPlaying && !isRepeat) return;
    // Quem toca o play quer movimento: a pausa das animações sai, senão as animações de CSS congelariam e os takes ficariam
    // em branco com a música tocando.
    if (isPaused()) setPaused(false);
    if (!isRepeat) trackVideoStart();
    timeline.stop();
    sound.current?.stop(250);
    if (isRepeat) {
      setStage(-1);
      setIsCovered(false);
      setRound((count) => count + 1);
    }
    const session = (sound.current = createSound());
    session.music(DROP_MS); // o fade-in sobe, suave, até o drop
    session.effect(getBeatTime(DO_IT_BEAT));
    session.fadeOutIn(getBeatTime(MUSIC_END.beat), MUSIC_END.duration);
    load()
      .then((m) => m.prepareModels())
      .catch(() => {});
    const t0 = performance.now();
    origin.current = t0;
    setIsPlaying(true);
    // Cada estágio entra na sua batida, no relógio do clique (nenhum depende de a rolagem acabar).
    Object.assign(schedule.current, timeline.start(TIMELINE, t0));
    setStage(STAGES.hook); // o gancho já está na tela no quadro do clique, sem esperar o timer
    // O gancho cobre o 1,5 s em que a tela ficava parada entre o fim do círculo e o L, que só anda aos 1500 ms.
    timeline.after(800, warmUpFluid);
  };

  /**
   * Para o vídeo e volta ao play: a música some num fade curto (e o áudio dorme), os estágios agendados caem e o palco
   * desmonta, levando o laço 3D e a rolagem das telas. Retomar do ponto exato exige o relógio único do vídeo (cartão T-L47).
   */
  const stop = () => {
    timeline.stop();
    sound.current?.stop(250);
    sound.current = null;
    setIsPlaying(false);
    setStage(-1);
    setIsCovered(false);
    setRound((count) => count + 1);
  };
  const stopFromWatch = useEffectEvent(stop);
  // Tocando, o vídeo para sozinho fora da tela ou com a pausa das animações (playback.js).
  useEffect(
    () => (isPlaying ? watchPlayback(player.current, stopFromWatch) : undefined),
    [isPlaying],
  );
  // Quem parou pelo botão continua no player: o play remontado (key={round}) recebe o foco que o botão Parar levou ao sumir.
  useEffect(() => {
    if (isPlaying || !shouldFocusPlay.current) return;
    shouldFocusPlay.current = false;
    playButtonRef.current?.focus();
  }, [isPlaying]);

  // Da carga em diante tudo o que entra cobre a seção: o play (o L e o "ithium") e o vermelho que ficam atrás não tem mais o que
  // mostrar, e qualquer quadro em que uma tela ainda não pintou (celular lento) deixava a logo aparecer. Escondidos, só sobra o escuro.
  const isCoveredByStage = stage >= STAGES.load;
  return (
    <section
      id="video"
      ref={section}
      className={`${BLOCK} flex flex-col items-center py-16 md:py-24 [--k:0.8] md:[--k:0.7]`}
    >
      <div className={`${ENVELOPE} flex flex-col items-center text-center`}>
        <h2 className="mb-4 text-bone font-secondary text-h1 uppercase [--text-h1:40px] md:[--text-h1:51.2px]">
          {CONTENT.video.title}
        </h2>
        <p className="mb-8 max-w-prose text-silver font-tertiary text-body-lg">
          {CONTENT.video.sub}
        </p>
      </div>
      {/* O player: uma caixa com a proporção da tela, menor que ela (--k). O palco por dentro continua do tamanho da tela (100vw x 100svh, de onde os takes tiram as medidas) e só é encolhido por `scale`; assim nenhum take muda. */}
      <div
        ref={player}
        className="relative isolate overflow-clip border border-line-strong w-[calc(100vw*var(--k))] h-[calc(100svh*var(--k))]"
      >
        <div className="absolute left-0 top-0 w-screen h-svh origin-top-left scale-(--k) bg-void">
          {/* O campo estelar de pontos do player, atrás de tudo; as pontas e o círculo do clique ficam por cima dela. */}
          {!isCovered && <DotField variant="estelar" />}
          {/* Os triângulos que surgem e somem, atrás do play (z-1); o círculo vermelho do clique (z-2) os cobre. Sob movimento reduzido não há círculo nem evento: seguem montados (e parados). */}
          {!isCovered && <FloatingTips layer="z-1" />}
          <div className="absolute inset-0 grid place-items-center">
            <button
              type="button"
              key={round}
              ref={playButtonRef}
              className={`${playButton}${isCoveredByStage ? " invisible" : ""}`}
              aria-label="Reproduzir vídeo"
              data-tocando={isPlaying ? "" : undefined}
              onClick={() => play()}
              onPointerEnter={prepareSound}
              onFocus={prepareSound}
            >
              <span
                className="block w-1/2 h-1/2 bg-current [clip-path:polygon(35%_17%,62%_33.5%,89%_50%,62%_66.5%,35%_83%,35%_50%)] group-data-tocando:animate-letter motion-reduce:[animation-delay:0ms]"
                aria-hidden="true"
              />
              <span
                className="absolute right-[calc(50%-15*var(--u))] top-[calc(50%-31*var(--u)-0.12em)] rotate-180 [writing-mode:vertical-rl] font-secondary font-extrabold uppercase leading-[0.75] tracking-[0.12em] text-[length:calc(15.2*var(--u))]"
                aria-hidden="true"
              >
                {[..."ithium"].map((letter, i) => (
                  <span
                    className="ithium-letter opacity-0 group-data-tocando:animate-ithium-letter"
                    style={{ animationDelay: `${2300 + i * 55}ms` }}
                    key={i}
                  >
                    {letter}
                  </span>
                ))}
              </span>
              {isPlaying && (
                <span
                  className="absolute inset-0 rounded-full border-2 border-bone motion-safe:animate-wave pointer-events-none"
                  aria-hidden="true"
                />
              )}
            </button>
          </div>

          {isPlaying && (
            <div
              className={`absolute inset-0 z-2 pointer-events-none ${isCoveredByStage ? "bg-void" : "bg-accent"} motion-safe:animate-cut`}
              aria-hidden="true"
              onAnimationEnd={() => setIsCovered(true)}
              key={round}
            />
          )}

          {isPlaying && stageModule && (
            <stageModule.default
              stage={stage}
              schedule={schedule}
              origin={origin}
              onRepeat={() => play(true)}
            />
          )}
        </div>
        {isPlaying && (
          <button
            type="button"
            className={stopButton}
            onClick={() => {
              shouldFocusPlay.current = true;
              stop();
            }}
            aria-label="Parar o vídeo"
          >
            Parar
          </button>
        )}
      </div>
      <div className="w-[calc(100vw*var(--k))]">
        <Timeline stage={stage} isPlaying={isPlaying} round={round} idle={CONTENT.video.idle} />
      </div>
    </section>
  );
}
