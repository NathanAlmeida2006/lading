import { useEffect, useRef } from "react";
import { desenhar } from "../motion/index.js";

/**
 * Os quatro cantos da dobra. Kit de molduras do RF-G03, em SVG (RNF-L21).
 *
 * Sao quatro SVGs de tamanho fixo, um por canto, e nao um viewBox esticado
 * sobre a secao inteira: `preserveAspectRatio="none"` deformava o traco e
 * jogava os cantos para dentro do texto conforme a altura da dobra mudava.
 */
const CANTOS = [
  { classe: "moldura__canto--se", d: "M1 28 L1 1 L28 1" },
  { classe: "moldura__canto--sd", d: "M1 1 L28 1 L28 28" },
  { classe: "moldura__canto--id", d: "M28 1 L28 28 L1 28" },
  { classe: "moldura__canto--ie", d: "M28 28 L1 28 L1 1" },
];

export function Moldura() {
  const raiz = useRef(null);

  useEffect(() => {
    desenhar(raiz.current?.querySelectorAll("path"), {
      naRolagem: false,
      atraso: 120,
    });
  }, []);

  return (
    <div className="moldura" ref={raiz} aria-hidden="true">
      {CANTOS.map(({ classe, d }) => (
        <svg
          key={classe}
          className={`moldura__canto ${classe}`}
          viewBox="0 0 29 29"
          width="29"
          height="29"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d={d} />
        </svg>
      ))}
    </div>
  );
}
