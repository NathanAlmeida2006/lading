import { CHAPTERS, TIMELINE, VIDEO_MS, getBeatTime } from "./timing.js";

// Onde cada capitulo comeca na barra (0 a 1): a batida do estagio em que ele entra, em relacao a duracao toda.
const STARTS = CHAPTERS.map(([, stage]) => getBeatTime(TIMELINE.find(([, s]) => s === stage)[0]) / VIDEO_MS);

/**
 * A linha do tempo do video: a barra enche em VIDEO_MS (so CSS, sem JS por quadro), os marcos sao os capitulos e a legenda
 * diz em qual deles o video esta. Sob movimento reduzido a barra nao anda; os marcos e a legenda seguem o estagio.
 * @param {object} props
 * @param {number} props.stage - Estágio atual do vídeo (-1 antes de começar).
 * @param {boolean} props.isPlaying - O clique já aconteceu.
 * @param {number} props.round - Cada repetição reinicia a barra.
 * @param {string} props.idle - Legenda antes do play.
 * @returns {JSX.Element} A barra e a legenda.
 */
export function Timeline({ stage, isPlaying, round, idle }) {
  const current = CHAPTERS.findLastIndex(([, from]) => stage >= from);
  return (
    <div className="mt-6 w-full">
      <div className="relative h-1.5 bg-line-strong" role="progressbar" aria-label="Progresso do vídeo" aria-valuemin={0} aria-valuemax={CHAPTERS.length} aria-valuenow={current + 1}>
        {isPlaying && (
          <div key={round} className="absolute inset-0 origin-left bg-acento motion-safe:animate-progresso" style={{ animationDuration: `${VIDEO_MS}ms`, animationTimingFunction: "linear" }} />
        )}
        {STARTS.map((start, index) => (
          <i key={index} className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 size-3 rounded-full border-2 border-void ${index <= current ? "bg-bone" : "bg-line-strong"}`} style={{ left: `${start * 100}%` }} />
        ))}
      </div>
      <p className="mt-3 flex justify-between gap-4 text-left text-silver font-terciaria text-caption-grande tabular-nums" aria-live="off">
        <span className="text-bone">{current < 0 ? idle : CHAPTERS[current][0]}</span>
        <span>{current < 0 ? "" : `${String(current + 1).padStart(2, "0")} / ${String(CHAPTERS.length).padStart(2, "0")}`}</span>
      </p>
    </div>
  );
}
