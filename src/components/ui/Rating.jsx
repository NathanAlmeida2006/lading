import { useEffect, useRef, useState } from "react";

// A estrela é um SVG, e não o glifo `★`: a fonte do site não tem esse caractere e cada aparelho cai numa fonte de reserva com largura,
// margens e altura próprias. O viewBox corta o traçado rente à estrela (20 x 19), então a caixa é a própria estrela.
const STAR_PATH =
  "M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z";
const STAR_MS = 220; // o tempo de encher uma estrela inteira; as estrelas enchem em fila

/**
 * Uma estrela da nota: base cinza e, por cima, a parte vermelha numa janela que vai de 0 até a fração `fill`. A janela é uma largura
 * (`--f`) e não um clip-path, para o estado final valer sem JavaScript (o `js:w-0` só existe com a classe `js` no <html>).
 * @param {object} props
 * @param {number} props.fill - Quanto da estrela e vermelho, de 0 a 1.
 * @param {number} props.index - Posição da estrela, que define quando ela começa a encher.
 * @param {boolean} props.isSeen - Verdadeiro quando o bloco já apareceu: a janela abre.
 * @returns {JSX.Element}
 */
function Star({ fill, index, isSeen }) {
  return (
    <span className="relative block aspect-[20/19]" style={{ "--f": fill }}>
      <svg viewBox="2 2 20 19" className="absolute inset-0 size-full fill-line-strong">
        <path d={STAR_PATH} />
      </svg>
      {fill > 0 && (
        <span
          className={`absolute inset-y-0 left-0 w-[calc(var(--f)*100%)] overflow-clip transition-[width] ease-linear motion-reduce:transition-none ${isSeen ? "" : "js:w-0"}`}
          style={{
            transitionDelay: `${index * STAR_MS}ms`,
            transitionDuration: `${fill * STAR_MS}ms`,
          }}
        >
          <svg
            viewBox="2 2 20 19"
            className="block h-full w-[calc(100%/var(--f))] max-w-none fill-accent"
          >
            <path d={STAR_PATH} />
          </svg>
        </span>
      )}
    </span>
  );
}

/**
 * A nota: o número grande (com o "/5" ao lado) e, embaixo, as estrelas. No celular as estrelas
 * têm exatamente a largura da linha do número (um retângulo só); do md em diante o número fica à esquerda e as estrelas à direita.
 * Cada estrela mostra a fração real (4,5 enche a quinta pela metade) e elas enchem em fila, da esquerda para a direita, uma vez, quando o
 * bloco entra na tela (sob movimento reduzido a mudança é instantânea; sem JavaScript já vem cheia). Tudo é ornamento para o leitor de
 * tela: a nota inteira vai no `aria-label`.
 * @param {object} props
 * @param {number} props.nota - A nota (ex.: 4.5).
 * @param {number} props.maximo - A nota máxima (ex.: 5).
 * @param {string} [props.className=""] - Classes do bloco (a margem de cima vem de quem o usa).
 * @returns {JSX.Element}
 */
export function Rating({ note, max, className = "" }) {
  const root = useRef(null);
  const [isSeen, setIsSeen] = useState(false);
  const text = note.toLocaleString("pt-BR");

  useEffect(() => {
    const node = root.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setIsSeen(true);
        observer.disconnect();
      },
      { threshold: 0.6 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={root}
      role="img"
      aria-label={`Nota ${text} de ${max} estrelas`}
      className={`grid grid-cols-[max-content] gap-6 border-t border-line-strong pt-6 [--n:clamp(77px,24vw,109px)] md:flex md:items-center md:justify-between md:gap-16 ${className}`.trim()}
    >
      {/* O número e, ao lado, "/5" no topo: a coluna tem a altura dos algarismos (0,795 do corpo), e centrada neles. */}
      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="font-secondary font-extrabold text-bone leading-none text-[length:var(--n)]">
          {text}
        </span>
        <div className="flex h-[calc(var(--n)*0.795)] flex-col items-start">
          <span className="-mt-[0.1em] font-secondary font-bold text-silver leading-none text-[length:calc(var(--n)*0.3)]">
            /{max}
          </span>
        </div>
      </div>

      <div
        className="grid grid-cols-5 gap-1.5 md:w-[clamp(240px,29vw,368px)] md:shrink-0"
        aria-hidden="true"
      >
        {Array.from({ length: max }, (_, i) => (
          <Star key={i} index={i} isSeen={isSeen} fill={Math.min(Math.max(note - i, 0), 1)} />
        ))}
      </div>
    </div>
  );
}
