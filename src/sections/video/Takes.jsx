import { useEffect, useRef, useState } from "react";
import { CtaButton } from "../../components/ui/CtaButton.jsx";
import { DotField } from "../../components/visuals/DotField.jsx";
import { FluidBackground } from "../../components/visuals/FluidBackground.jsx";
import { Model3D } from "./Model3D.jsx";
import { Frame } from "../../components/ui/Frame.jsx";
import { CONTENT } from "../../content/content.js";
import { padTwoDigits, OUTLINED } from "../../app/ui.js";
import { BEAT_MS, OBJECTS_3D, getDelay } from "./timing.js";

/**
 * Os takes que fecham o video, depois da logo (cada um dura um numero inteiro de batidas: o manifesto 8, os numeros 6, o
 * calendario 6, o arsenal 6; o ultimo fica). Cada um e uma camada de tela cheia (z-4), toda em CSS (as animacoes
 * `bate`, `cresce`, `entra-lado`, `roleta` e `marca` estao em styles/residual.css) e com o texto do proprio
 * site: o manifesto da dobra, os numeros do mapa, o checklist integrado, o que o Lithium entrega e o fechamento. Nenhum
 * take mostra preco. Sob movimento reduzido nada anima e cada take ja mostra o seu estado final.
 */
const PAGE = "absolute inset-0 z-4 overflow-clip [--respiro:24px] md:[--respiro:48px] font-secundaria font-extrabold uppercase";
const INNER = "relative mx-auto flex h-full w-full max-w-[1080px] flex-col justify-center px-(--respiro)";

/** A malha de pontos sobre o vermelho do take: pontos e fio num tom abaixo do --acento, e o ponto raro em preto. */
const RED_DOT_COLORS = { dot: "#7d0e18", thread: "#a5121e", accent: "#09090b" };

/**
 * Uma pancada: a palavra chega grande e assenta, no `delay` ms.
 * @param {number} delay - Atraso da pancada, em ms.
 * @param {string} [extraClass=""] - Classes extras.
 * @returns {{className: string, style: object}} Props do elemento que bate.
 */
const beat = (delay, extraClass = "") => ({ className: `block motion-safe:animate-bate ${extraClass}`.trim(), style: { animationDelay: `${delay}ms` } });

/**
 * O quadro de um take: comeca em 0 e sobe 1 a cada tempo de `times` (ms depois de `startAt`, a hora em que o estagio devia entrar).
 * @param {number|undefined} startAt - Hora em que o estágio devia entrar.
 * @param {number[]} times - Tempo, em ms, de cada passo do quadro.
 * @returns {number} Quadro atual, começando em 0.
 */
function useFrames(startAt, times) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const timers = times.map((ms, k) => setTimeout(() => setFrame(k + 1), getDelay(startAt, ms)));
    return () => timers.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- startAt e times ficam de fora: os relogios nascem uma vez por montagem, e tempos e um array novo a cada render
  return frame;
}

/**
 * A ponte (2 batidas) entre a Trilha e o Registro, as duas telas do app que rolam: o corte direto de uma rolagem para a outra
 * piscava, e aqui ele e um take de proposito, em dois quadros de uma batida cada. O vermelho do L, "Treinou hoje?", batendo
 * linha a linha, e, em corte seco, o osso, com o check e "Registre agora." (o ponto em rubro), que pede a tela do Registro.
 * @param {object} props
 * @param {number} props.startAt - Hora em que o estágio devia entrar.
 * @returns {JSX.Element} A ponte entre a Trilha e o Registro.
 */
export function TakeRecord({ startAt }) {
  const frame = useFrames(startAt, [BEAT_MS]);
  const text = "text-[length:min(calc((100vw-48px)/4.2),calc((100svh-160px)/3.2),220px)] leading-[1.04] tracking-[0.01em]";
  if (frame === 0) {
    return (
      <div className={`${PAGE} bg-acento text-void`} aria-hidden="true">
        <div className={`${INNER} ${text}`}>
          <p {...beat(0)}>Treinou</p>
          <p {...beat(BEAT_MS / 4)}>hoje?</p>
        </div>
      </div>
    );
  }
  return (
    <div className={`${PAGE} bg-bone text-void`} aria-hidden="true">
      <div className={`${INNER} ${text}`}>
        <svg viewBox="0 0 24 24" className="mb-[0.1em] block size-[1.1em] text-acento motion-safe:animate-bate" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="square" strokeLinejoin="miter"><path d="M3.5 12.5l5.5 5.5L20.5 6.5" /></svg>
        <p {...beat(BEAT_MS / 4)}>Registre</p>
        <p {...beat(BEAT_MS / 2)}>agora<span className="text-acento">.</span></p>
      </div>
    </div>
  );
}

/**
 * Take 1, o manifesto, em dois quadros: o preto, com "O feed esconde quem usa bomba." batendo palavra a palavra, e a
 * "bomba" em vermelho; e, em corte seco aos 1,3 s, o vermelho, com "Natural" e "Cresce." crescendo do pequeno ao tamanho cheio.
 * @param {object} props
 * @param {number} props.startAt - Hora em que o estágio devia entrar.
 * @returns {JSX.Element} O take do manifesto.
 */
export function TakeManifesto({ startAt }) {
  const frame = useFrames(startAt, [4 * BEAT_MS]);

  if (frame === 0) {
    return (
      <div className={`${PAGE} bg-void text-bone`} aria-hidden="true">
        <FluidBackground />
        <div className={`${INNER} text-[length:min(calc((100vw-48px)/3.7),calc((100svh-160px)/4.3),200px)] leading-[1.04] tracking-[0.01em]`}>
          <p {...beat(0)}>O feed</p>
          <p {...beat(BEAT_MS / 2)}>esconde</p>
          <p {...beat(BEAT_MS)}>quem usa</p>
          <p className="w-fit text-acento">
            <span {...beat(1.5 * BEAT_MS)}>bomba.</span>
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className={`${PAGE} bg-acento text-void`} aria-hidden="true">
      <DotField variant="estelar" colors={RED_DOT_COLORS} />
      <div className={INNER}>
        <p className="text-[length:min(calc((100vw-48px)/3.6),calc((100svh-200px)/2.8),220px)] leading-[1.04] tracking-[0.01em]">
          <span {...beat(0)}>Natural</span>
          <span className="block origin-bottom-left motion-safe:animate-cresce" style={{ animationDelay: `${BEAT_MS}ms` }}>Cresce.</span>
        </p>
        <p className="mt-6 max-w-[34ch] font-terciaria text-body-lg font-normal normal-case motion-safe:animate-revelar" style={{ "--atraso": `${3 * BEAT_MS}ms` }}>{CONTENT.dobra.promessa.texto}</p>
      </div>
    </div>
  );
}

/**
 * Uma roleta de numero: cada digito e uma coluna que gira e para no valor, uma a uma (o caca-niquel).
 * @param {object} props
 * @param {number} props.value - Número exibido.
 * @param {number} props.delay - Atraso da rolagem das colunas, em ms.
 * @returns {JSX.Element} Um número em roleta.
 */
function Roulette({ value, delay }) {
  return (
    <span className="inline-flex h-[1em] overflow-clip leading-none tabular-nums" role="img" aria-label={String(value)}>
      {[...String(value)].map((digito, i) => {
        const final = (2 + i) * 10 + Number(digito);
        return (
          <span className="block h-[1em] w-[0.47em] overflow-clip text-center" key={i}>
            <span className="flex flex-col motion-safe:animate-roleta" style={{ "--final": final, animationDelay: `${delay + i * 90}ms` }}>
              {Array.from({ length: final + 1 }, (_, k) => <span className="block h-[1em] leading-[1em]" key={k}>{k % 10}</span>)}
            </span>
          </span>
        );
      })}
    </span>
  );
}

/**
 * Take 2, os numeros do mapa (1 app, 3 protocolos, 12 semanas, 1 objetivo): quatro linhas que entram de lados alternados e rolam ate o valor.
 * @param {object} props - Sem props.
 * @returns {JSX.Element} O take dos números do mapa.
 */
export function TakeNumbers() {
  return (
    <div className={`${PAGE} bg-void text-bone`} aria-hidden="true">
      <div className={`${INNER} !justify-stretch`}>
        {CONTENT.mapa.numeros.map(({ valor, rotulo, destaque }, i) => (
          <div
            className="flex flex-1 items-center justify-between gap-4 border-t border-line-strong motion-safe:animate-entra-lado"
            style={{ "--lado": i % 2 ? 1 : -1, animationDelay: `${i * BEAT_MS}ms` }}
            key={rotulo}
          >
            <span className={`text-[length:min(calc(100svh/6),32vw)] leading-none tracking-[0.01em] ${destaque ? "text-acento" : ""}`}>
              <Roulette value={valor} delay={i * BEAT_MS + 120} />
            </span>
            <span className="text-right text-[length:min(5svh,7vw)] leading-none tracking-[0.04em] text-silver">{rotulo}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const WEEK_DAYS = ["D", "S", "T", "Q", "Q", "S", "S"];
const LEGEND = [["Treino", "var(--rubro)"], ["Dieta", "var(--praga)"], ["Sono", "var(--vigilia)"]];

/**
 * Take 3, "a disciplina visivel": o calendario de um mes (outubro de 2026, que comeca numa quinta) se preenchendo em onda,
 * cada dia acendendo no acento e assentando com as tres marcas dos protocolos (treino, dieta e sono), como o do app.
 * @param {object} props - Sem props.
 * @returns {JSX.Element} O take do calendário.
 */
export function TakeCalendar() {
  return (
    <div className={`${PAGE} bg-void text-bone`} aria-hidden="true">
      <DotField variant="estelar" />
      <div className={`${INNER} gap-4`}>
        <p className="font-secundaria text-overline tracking-[0.08em] text-silver">(disciplina visível)</p>
        <h2 className="text-[length:min(calc((100vw-48px)/4.2),calc((100svh-120px)/10.5),110px)] leading-[1.04] tracking-[0.01em]">
          <span className={`block ${OUTLINED}`}>Disciplina</span>
          <span className="block">visível.</span>
        </h2>
        <div className="w-full max-w-[min(100%,calc((100svh-330px)*7/6))]">
          <div className="mb-1 grid grid-cols-7 gap-1 text-center font-terciaria text-caption font-normal text-silver">{WEEK_DAYS.map((d, i) => <span key={i}>{d}</span>)}</div>
          <ol className="grid grid-cols-7 gap-1" role="list">
            {Array.from({ length: 4 }, (_, i) => <li key={`v${i}`} />)}
            {DAYS.map((day, i) => (
              <li
                className="relative flex aspect-square flex-col justify-between border border-line bg-surface-1 p-1 font-terciaria text-caption font-normal tabular-nums motion-safe:animate-marca"
                style={{ animationDelay: `${(i + 4) * 57}ms` }}
                key={day}
              >
                <span className="text-silver">{day}</span>
                <span className="flex gap-[3px]">{LEGEND.map(([name, color]) => <i className="size-1.5" style={{ background: color }} key={name} />)}</span>
              </li>
            ))}
          </ol>
        </div>
        <p className="max-w-[40ch] font-terciaria text-body normal-case font-normal text-silver motion-safe:animate-revelar" style={{ "--atraso": `${4 * BEAT_MS}ms` }}>
          Você bate o olho e marca o que já executou no dia.
        </p>
      </div>
    </div>
  );
}

/**
 * O que o Lithium entrega (a pilha de valor do site, sem os valores): cada item ocupa a tela inteira por uma batida,
 * numa pancada, com a cor do protocolo no fundo (a mesma das capas) e a contagem "01/06" no canto.
 * @param {object} props
 * @param {number} props.startAt - Hora em que o estágio devia entrar.
 * @returns {JSX.Element} O take do arsenal, um item por corte.
 */
const ARSENAL = [
  { label: "Protocolo", lines: ["Hipertrofia"], background: "var(--rubro)", ink: "var(--void)" },
  { label: "Protocolo", lines: ["Dieta"], background: "var(--praga)", ink: "var(--void)" },
  { label: "Protocolo", lines: ["Sono"], background: "var(--vigilia)", ink: "var(--void)" },
  { label: "Mentalidade", lines: ["Social", "Vibe"], background: "var(--bone)", ink: "var(--void)" },
  { label: "Disciplina", lines: ["Checklist", "Integrado"], background: "var(--rubro)", ink: "var(--void)" },
  { label: "No seu celular", lines: ["App", "Exclusivo"], background: "var(--void)", ink: "var(--bone)" },
];

/**
 * Take 4, o arsenal: os seis itens em seis pancadas, uma por tela, em cortes secos.
 * @param {object} props
 * @param {number} props.startAt - Hora em que o estágio devia entrar.
 * @returns {JSX.Element} O take do arsenal.
 */
export function TakeArsenal({ startAt }) {
  const index = useFrames(startAt, ARSENAL.slice(1).map((_, k) => (k + 1) * BEAT_MS));
  const { label, lines, background, ink } = ARSENAL[index];
  return (
    <div className={PAGE} style={{ background: background, color: ink }} aria-hidden="true" key={index}>
      <div className={INNER}>
        <p className="absolute left-(--respiro) top-6 font-secundaria text-overline tracking-[0.08em] opacity-70">({padTwoDigits(index + 1)}/{padTwoDigits(ARSENAL.length)})</p>
        <p className="mb-2 text-[length:min(4.4svh,7vw)] leading-none tracking-[0.04em] opacity-75 motion-safe:animate-revelar">{label}</p>
        <p className="text-[length:min(calc((100vw-48px)/5.2),calc((100svh-160px)/2.5),230px)] leading-[1.04] tracking-[0.01em]">
          {lines.map((line, k) => <span {...beat(k * 70)} key={line}>{line}</span>)}
        </p>
      </div>
    </div>
  );
}

/**
 * Take 5, o fechamento ("Apenas faca."), o ultimo e o que fica: a headline do fechamento do site em escala de cartaz, a
 * primeira linha em contorno e a segunda cheia, batendo, com os cantos se desenhando e o botao do site (sem preco) e, depois, o de replay (`onRepeat`).
 * @param {object} props
 * @param {() => void} props.onRepeat - Repete o vídeo pelo botão de replay.
 * @param {number} props.replayAt - Tempo, em ms, até o replay aparecer.
 * @returns {JSX.Element} O take de fechamento.
 */
export function TakeDoIt({ onRepeat, replayAt }) {
  const replay = useFrames(undefined, [replayAt]) > 0;
  const [primeira, segunda] = CONTENT.fechamento.headline.linhas;
  return (
    <div className={`${PAGE} bg-void text-bone`}>
      <FluidBackground />
      <Frame entrance="css" />
      <p className="absolute left-(--respiro) top-6 font-secundaria text-overline tracking-[0.08em] text-silver motion-safe:animate-revelar">(o caminho começa aqui)</p>
      <p className="absolute bottom-6 left-(--respiro) font-secundaria text-overline tracking-[0.08em] text-silver motion-safe:animate-revelar [--atraso:600ms]">({CONTENT.mecanismo.semanas} semanas · treino, dieta e sono · app exclusivo)</p>
      <div className={`${INNER} items-start`}>
        <h2 className="text-[length:min(calc((100vw-48px)/3.3),calc((100svh-260px)/2.4),240px)] leading-[1.04] tracking-[0.01em]">
          <span {...beat(0, OUTLINED)}>{primeira}</span>
          <span {...beat(180)}>{segunda}</span>
        </h2>
        <div className="mt-8 w-full motion-safe:animate-revelar [--atraso:600ms]">
          <CtaButton position="video" />
        </div>
        {/* O replay, escondido (e ocupando o lugar, para nada pular) ate `replayEm` ms, 2 s depois de a musica parar: recomeca o video do play, e o clique vale como o gesto que o audio pede. */}
        <button
          type="button"
          className={`${replay ? "motion-safe:animate-surgir" : "invisible"} mt-4 inline-flex min-h-12 items-center gap-3 border border-line-strong px-5 py-3 font-secundaria text-label uppercase tracking-[0.04em] text-bone transition-[background,color] duration-(--motion-fast) hover:bg-bone hover:text-void focus-visible:bg-bone focus-visible:text-void`}
          onClick={onRepeat}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
          Assistir de novo
        </button>
      </div>
    </div>
  );
}

/** O giro de todos: de frente (como o L chato do play) por 0,25 s e depois acelerando, o mesmo giro de um objeto para o outro. */
const spin = (t) => [0, t < 0.25 ? 0 : Math.pow(t - 0.25, 1.7) * 3.2, 0];

/**
 * Take A (6 batidas), o L em 3D: no drop, o L chato do play vira, em corte seco no mesmo lugar e no mesmo vermelho, o L do app em
 * arestas, de frente, que comeca a girar; da batida 2 em diante, a cada meia batida, o objeto troca pelos outros 3D do app (raio,
 * engrenagem, espada, medalha, relogio, perfil, cruz), todos no mesmo giro, e a ultima batida e o "lithium" em 3D, que fica ate o corte.
 * @param {object} props
 * @param {number} props.startAt - Hora em que o estágio devia entrar.
 * @returns {JSX.Element} O take do L em 3D.
 */
export function TakeL3D({ startAt }) {
  const frame = useFrames(startAt, [2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5].map((beat) => beat * BEAT_MS));
  const start = useRef(performance.now()); // o giro e um so, do inicio do take: segue de um objeto para o outro
  return (
    <div className={`${PAGE} flex items-center justify-center bg-acento [--u:min(1svh,1.7vw)]`} aria-hidden="true">
      <Model3D
        model={OBJECTS_3D[frame]}
        color="#09090b"
        origin={start.current}
        pose={spin}
        shouldFloat={false}
        className={`${frame === OBJECTS_3D.length - 1 ? "h-[calc(60*var(--u))] w-[calc(150*var(--u))]" : "h-[calc(80*var(--u))] w-[calc(80*var(--u))]"} max-w-full motion-safe:animate-batida`}
        key={frame}
      />
    </div>
  );
}

// As anilhas do take da carga, da maior (a de dentro) a menor, e a cor de cada uma.
const PLATES = [{ h: 92, w: 16, color: "var(--bone)" }, { h: 80, w: 14, color: "var(--bone)" }, { h: 66, w: 12, color: "var(--acento)" }, { h: 52, w: 10, color: "var(--acento)" }];
// Cada placa e deslocada da anterior pela largura dela mais 3.
const plates = PLATES.map((plate, k) => ({ ...plate, k, dx: PLATES.slice(0, k).reduce((sum, previous) => sum + previous.w + 3, 0) }));

/**
 * Take B (4 batidas), a carga: uma barra de musculacao vista de lado recebe uma anilha de cada lado por batida, da maior a menor,
 * cada uma caindo com uma pancada. O nome e o da sessao 05 da trilha do app, "Progressao no piloto automatico": e o que a barra
 * mostra (a carga que sobe sozinha).
 * @param {object} props - Sem props.
 * @returns {JSX.Element} O take da carga.
 */
export function TakeLoad() {
  return (
    <div className={`${PAGE} text-bone`} aria-hidden="true">
      <div className={`${INNER} gap-6`}>
        <p className="font-secundaria text-overline tracking-[0.08em] text-silver">(sessão 05 · hipertrofia)</p>
        <h2 className="text-[length:min(calc((100vw-48px)/4.6),calc((100svh-340px)/5.6),150px)] leading-[1.04] tracking-[0.01em]">
          <span {...beat(0)}>Progressão</span>
          <span {...beat(BEAT_MS, "text-acento")}>no piloto</span>
          <span {...beat(1.5 * BEAT_MS)}>automático</span>
        </h2>
        <svg viewBox="0 0 400 100" className="w-full max-w-[min(1000px,calc((100svh-420px)*4))] overflow-visible" role="presentation">
          <rect x="6" y="47" width="388" height="6" fill="var(--silver)" />
          <rect x="176" y="43" width="48" height="14" fill="var(--line-strong)" />
          {[-1, 1].map((side) => plates.map(({ h, w, color, k, dx }) => (
            <rect
              className="origin-center [transform-box:fill-box] motion-safe:animate-placa"
              style={{ animationDelay: `${k * BEAT_MS}ms` }}
              x={side < 0 ? 168 - dx - w : 232 + dx}
              y={50 - h / 2}
              width={w}
              height={h}
              fill={color}
              key={`${side}${k}`}
            />
          )))}
        </svg>
      </div>
    </div>
  );
}
