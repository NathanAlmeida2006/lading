/**
 * Os quatro cantos da dobra. Kit de molduras do RF-G03, em SVG (RNF-L21).
 *
 * São quatro SVGs de tamanho fixo, um por canto, e não um viewBox esticado
 * sobre a seção inteira: `preserveAspectRatio="none"` deformava o traço e
 * jogava os cantos para dentro do texto conforme a altura da dobra mudava.
 *
 * `entrance`: na dobra os cantos se desenham por CSS (`css`, sem esperar o pacote de
 * JavaScript); no fechamento, só quando a seção chega (`js`: quem desenha é o
 * `openPanel`, que acha os `path` por `.moldura path`). Em CSS o traço usa
 * `pathLength="1"` e anima o `stroke-dashoffset`.
 */
const CORNERS = [
  { positionClass: "top-0 left-0", d: "M1 28 L1 1 L28 1" },
  { positionClass: "top-0 right-0", d: "M1 1 L28 1 L28 28" },
  { positionClass: "right-0 bottom-0", d: "M28 1 L28 28 L1 28" },
  { positionClass: "bottom-0 left-0", d: "M28 28 L1 28 L1 1" },
];

// 100 ms de atraso, 60 ms de escalonamento (o `drawStroke` do `openPanel`).
const STROKE_DELAYS = ["[--delay:100ms]", "[--delay:160ms]", "[--delay:220ms]", "[--delay:280ms]"];

/**
 * @param {object} props
 * @param {"js"|"css"} [props.entrance="js"] - Como os cantos se desenham: por CSS na dobra, por JavaScript no fechamento.
 * @returns {JSX.Element}
 */
export function Frame({ entrance = "js" }) {
  const isCss = entrance === "css";

  return (
    <div
      className="moldura absolute inset-2 z-0 text-line-strong pointer-events-none"
      aria-hidden="true"
    >
      {CORNERS.map(({ positionClass, d }, i) => (
        <svg
          key={positionClass}
          className={`absolute ${positionClass}`}
          viewBox="0 0 29 29"
          width="29"
          height="29"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          {isCss ? (
            <path
              className={`[stroke-dasharray:1] animate-draw motion-reduce:animate-emerge ${STROKE_DELAYS[i]}`}
              d={d}
              pathLength="1"
            />
          ) : (
            <path d={d} />
          )}
        </svg>
      ))}
    </div>
  );
}
