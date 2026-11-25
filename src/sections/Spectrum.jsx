import { useEffect, useRef, useState } from "react";
import { CONTENT } from "../content/content.js";
import { DotField } from "../components/visuals/DotField.jsx";
import { BLOCK, ENVELOPE } from "../app/ui.js";

const { areas, antes: BEFORE, depois: AFTER } = CONTENT.espectro;
const CENTER = 170;
const RADIUS = 205;
const RINGS = [0.25, 0.5, 0.75, 1];

const angleOf = (index) => (index / areas.length) * 2 * Math.PI - Math.PI / 2;
// Afastamento do nome em relacao a ponta, em unidades do viewBox.
const LABEL_GAP = 30;

/**
 * Ponto do radar: o eixo `index` comeca no topo e segue no sentido horario.
 * @param {number} index - Indice da area.
 * @param {number} scale - Fracao do raio (1 = a borda).
 * @returns {[number, number]} Coordenadas no viewBox.
 */
const point = (index, scale) => [CENTER + Math.cos(angleOf(index)) * RADIUS * scale, CENTER + Math.sin(angleOf(index)) * RADIUS * scale];

/**
 * Posicao do nome do eixo: LABEL_GAP para fora da ponta, e ancorado pelo lado (o texto cresce para longe da ponta).
 * Assim o vao e o mesmo para qualquer palavra; centrado, o nome mais largo chegava mais perto da ponta.
 * @param {number} index - Indice da area.
 * @returns {{x: number, y: number, anchor: "start"|"middle"|"end"}} Ponto e ancora do texto.
 */
const labelAt = (index) => {
  const [x, y] = point(index, 1);
  const cos = Math.cos(angleOf(index));
  return { x: x + cos * LABEL_GAP, y: y + Math.sin(angleOf(index)) * LABEL_GAP, anchor: Math.abs(cos) < 0.3 ? "middle" : cos > 0 ? "start" : "end" };
};
const ring = (scales) => scales.map((scale, index) => point(index, scale).join(",")).join(" ");
const flat = (scale) => areas.map(() => scale);
const DURATION = 700;

/**
 * Espectro: radar de cinco areas, antes e depois. Dados ilustrativos, avisados na propria secao.
 * @param {object} props - Sem props.
 * @returns {JSX.Element} A secao Espectro.
 */
export function Spectrum() {
  const [isAfter, setIsAfter] = useState(false);
  // progress: 0 = antes, 1 = depois; o poligono sai da interpolacao, entao a troca e uma animacao de forma.
  const [progress, setProgress] = useState(0);
  const current = useRef(0);
  const frame = useRef(0);

  useEffect(() => {
    cancelAnimationFrame(frame.current);
    const target = isAfter ? 1 : 0;
    const from = current.current;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      current.current = target;
      setProgress(target);
      return undefined;
    }
    const start = performance.now();
    const tick = (now) => {
      const k = Math.min((now - start) / DURATION, 1);
      current.current = from + (target - from) * (1 - (1 - k) ** 3);
      setProgress(current.current);
      if (k < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [isAfter]);

  return (
    <section id="espectro" className={`${BLOCK} isolate border-t-0! pb-16 md:pb-24`}>
      <DotField variant="estelar" />
      <div className={`${ENVELOPE} relative z-1 flex flex-col items-center text-center`}>
        <h2 className="mb-4 text-bone font-secundaria text-h1 uppercase [--text-h1:40px] md:[--text-h1:51.2px]">{CONTENT.espectro.titulo}</h2>
        <p className="mb-8 max-w-prose text-silver font-terciaria text-body-lg">{CONTENT.espectro.sub}</p>

        <svg viewBox="-168 -95 676 480" className="w-[calc(100%+2rem)] -mx-4 md:mx-0 md:w-full md:max-w-200" role="img" aria-label={`${CONTENT.espectro.titulo}: ${BEFORE} e ${AFTER}`}>
          {RINGS.map((scale) => (
            <polygon key={scale} points={ring(flat(scale))} className="fill-none stroke-line-strong" strokeWidth="1" />
          ))}
          {areas.map((area, index) => (
            <g key={area.nome}>
              <line x1={CENTER} y1={CENTER} x2={point(index, 1)[0]} y2={point(index, 1)[1]} className="stroke-line-strong" strokeWidth="1" />
              <text x={labelAt(index).x} y={labelAt(index).y} textAnchor={labelAt(index).anchor} dominantBaseline="middle" className="fill-bone font-secundaria text-[28.6px] uppercase">
                {area.nome}
              </text>
            </g>
          ))}
          <polygon
            points={ring(areas.map((a) => (a.antes + (a.depois - a.antes) * progress) / 100))}
            className={`transition-colors duration-700 ${isAfter ? "fill-acento/30 stroke-acento" : "fill-silver/20 stroke-silver"}`}
            strokeWidth="2"
          />
        </svg>

        {/* Controle segmentado e lista de barras de blocos, como na referencia; os blocos e o numero acompanham a animacao. */}
        <div role="group" aria-label="Comparar antes e depois" className="mt-12 grid grid-cols-2 w-full max-w-110 p-1 border border-line-strong">
          {[[BEFORE, false], [AFTER, true]].map(([label, value]) => (
            <button
              key={label}
              type="button"
              aria-pressed={isAfter === value}
              onClick={() => setIsAfter(value)}
              className="px-4 py-4 text-bone font-secundaria text-[20px] leading-none tracking-[0.08em] font-semibold uppercase cursor-pointer aria-pressed:bg-acento aria-pressed:text-bone"
            >
              {label}
            </button>
          ))}
        </div>

        <ul className="mt-6 w-full max-w-110 font-terciaria text-[14.3px] leading-[1.2] font-medium tabular-nums text-bone">
          {areas.map((area) => {
            const value = Math.round(area.antes + (area.depois - area.antes) * progress);
            return (
              <li key={area.nome} className="flex items-center gap-3 px-2 py-3.5">
                <span className="flex-1 text-left">{area.nome}</span>
                <span className="flex gap-1" aria-hidden="true">
                  {Array.from({ length: 10 }, (_, block) => (
                    <i key={block} className={`size-3.5 ${block < Math.round(value / 10) ? "bg-acento" : "bg-line-strong"}`} />
                  ))}
                </span>
                <b className="w-8 text-right text-bone">{value}</b>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 max-w-110 text-silver font-terciaria text-caption-grande">{CONTENT.espectro.nota}</p>

      </div>
    </section>
  );
}
