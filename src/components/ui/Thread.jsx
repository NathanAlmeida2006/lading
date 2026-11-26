/**
 * Fio de 1px como grade de painel. Entra desenhado, da esquerda: por CSS na dobra
 * (`delay`, em ms) e por JavaScript no fechamento, que o desenha quando a seção chega.
 * @param {object} props
 * @param {number} [props.delay] - Atraso da animação CSS, em ms. Sem ele, o fio e desenhado por JavaScript.
 * @returns {JSX.Element}
 */
export function Thread({ delay }) {
  const isCss = delay !== undefined;
  return (
    <svg
      className="painel__fio w-full h-px text-line-strong overflow-visible"
      viewBox="0 0 100 1"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <line
        className={
          isCss
            ? "[stroke-dasharray:1] animate-draw-thread motion-reduce:animate-emerge"
            : undefined
        }
        style={isCss ? { "--delay": `${delay}ms` } : undefined}
        x1="0"
        y1="0.5"
        x2="100"
        y2="0.5"
        stroke="currentColor"
        strokeWidth="1"
        pathLength={isCss ? "1" : undefined}
      />
    </svg>
  );
}
