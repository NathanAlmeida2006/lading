/**
 * Os quatro cantos da dobra. Kit de molduras do RF-G03, em SVG (RNF-L21).
 *
 * Sao quatro SVGs de tamanho fixo, um por canto, e nao um viewBox esticado
 * sobre a secao inteira: `preserveAspectRatio="none"` deformava o traco e
 * jogava os cantos para dentro do texto conforme a altura da dobra mudava.
 *
 * `entrada`: na dobra os cantos se desenham por CSS (`css`, sem esperar o pacote de
 * JavaScript); no fechamento, so quando a secao chega (`js`: quem desenha e o
 * `abrirPainel`, que acha os `path` por `.moldura path`). Em CSS o traco usa
 * `pathLength="1"` e anima o `stroke-dashoffset`.
 */
const CANTOS = [
  { classe: "top-0 left-0", d: "M1 28 L1 1 L28 1" },
  { classe: "top-0 right-0", d: "M1 1 L28 1 L28 28" },
  { classe: "right-0 bottom-0", d: "M28 1 L28 28 L1 28" },
  { classe: "bottom-0 left-0", d: "M28 28 L1 28 L1 1" },
];

// 100 ms de atraso, 60 ms de escalonamento (o `desenhar` do `abrirPainel`).
const TRACO = ["[--atraso:100ms]", "[--atraso:160ms]", "[--atraso:220ms]", "[--atraso:280ms]"];

export function Moldura({ entrada = "js" }) {
  const css = entrada === "css";

  return (
    <div className="moldura absolute inset-2 z-0 text-line-strong pointer-events-none" aria-hidden="true">
      {CANTOS.map(({ classe, d }, i) => (
        <svg
          key={classe}
          className={`absolute ${classe}`}
          viewBox="0 0 29 29"
          width="29"
          height="29"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          {css ? (
            <path className={`[stroke-dasharray:1] animate-tracar motion-reduce:animate-surgir ${TRACO[i]}`} d={d} pathLength="1" />
          ) : (
            <path d={d} />
          )}
        </svg>
      ))}
    </div>
  );
}
