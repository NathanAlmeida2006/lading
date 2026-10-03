/**
 * Fio de 1px como grade de painel. Entra desenhado, da esquerda: por CSS na dobra
 * (`atraso`, em ms) e por JavaScript no fechamento, que o desenha quando a secao chega.
 */
export function Fio({ atraso }) {
  const css = atraso !== undefined;
  return (
    <svg
      className="painel__fio w-full h-px text-line-strong overflow-visible"
      viewBox="0 0 100 1"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <line
        className={css ? "[stroke-dasharray:1] animate-tracar-fio motion-reduce:animate-surgir" : undefined}
        style={css ? { "--atraso": `${atraso}ms` } : undefined}
        x1="0"
        y1="0.5"
        x2="100"
        y2="0.5"
        stroke="currentColor"
        strokeWidth="1"
        pathLength={css ? "1" : undefined}
      />
    </svg>
  );
}
