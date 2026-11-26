import { useEffect, useRef, useState } from "react";
import { CONTENT } from "../content/content.js";
import { DotField } from "../components/visuals/DotField.jsx";
import { Label } from "../components/ui/Label.jsx";
import { Rating } from "../components/ui/Rating.jsx";
import { BLOCK, ENVELOPE, padTwoDigits } from "../app/ui.js";

const PRINTS = CONTENT.proof.testimonials;
const RATING = CONTENT.proof.assessment; // `null` sem nota publicável (validation.js): o bloco da nota some

// A pista sangra até a borda do envelope (margem negativa + o mesmo recuo de volta): o primeiro print alinha com o título, e o último
// que cabe espia pela direita, o que diz "role". `scroll-px` faz o encaixe respeitar esse recuo.
const TRACK_BLEED =
  "-mx-4 px-4 scroll-px-4 md:-mx-8 md:px-8 md:scroll-px-8 lg:-mx-12 lg:px-12 lg:scroll-px-12 wide:-mx-16 wide:px-16 wide:scroll-px-16";

/**
 * Uma seta do carrossel: caixa quadrada de 48 px (alvo de toque) com o fio de 1px do site; apagada quando não há mais para onde ir.
 * @param {object} props
 * @param {-1|1} props.direction - -1 volta, 1 avança.
 * @param {string} props.label - Nome acessível do botão.
 * @param {boolean} props.disabled - Sem mais prints naquele sentido.
 * @param {() => void} props.onClick - Rola um print.
 * @returns {JSX.Element}
 */
function Arrow({ direction, label, disabled, onClick }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-12 cursor-pointer place-items-center border border-line-strong text-bone transition-colors duration-150 hover:border-bone disabled:cursor-default disabled:opacity-30 disabled:hover:border-line-strong motion-reduce:transition-none"
    >
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
        strokeLinejoin="miter"
        className={direction < 0 ? "-scale-x-100" : undefined}
        aria-hidden="true"
      >
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </button>
  );
}

/**
 * A vaga de um print que ainda não chegou: quadro vazio, cortado pelo X de prancheta, com o número e o rótulo no centro.
 * @param {object} props
 * @param {number} props.index - Posição da vaga, de 0.
 * @returns {JSX.Element}
 */
function Placeholder({ index }) {
  return (
    <>
      <svg
        viewBox="0 0 9 19"
        preserveAspectRatio="none"
        fill="none"
        stroke="currentColor"
        className="absolute inset-0 size-full text-line-strong"
        aria-hidden="true"
      >
        <path d="M0 0 9 19M9 0 0 19" vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="absolute inset-0 grid place-content-center">
        <span className="grid justify-items-center gap-2 bg-surface-1 px-5 py-4">
          <span className="font-secondary font-extrabold leading-none text-bone text-[40px]">
            {padTwoDigits(index + 1)}
          </span>
          <span className="font-tertiary text-mono-large uppercase text-silver">
            Print do cliente
          </span>
        </span>
      </span>
    </>
  );
}

/**
 * Prova social: o carrossel de prints de clientes que testaram o app. A pista é uma lista com rolagem nativa e encaixe (arrastar no
 * toque, rodinha ou setas do teclado com a pista em foco); as duas setas rolam um print, e a linha de baixo mostra onde a janela está.
 * Não anda sozinho: um print é para ser lido. `print: null` no CONFIG desenha a vaga (Placeholder); com arquivo, o print inteiro
 * (`object-contain`: recortar a conversa de um cliente passaria a ideia de edição) sobre o fundo do quadro.
 * @param {object} props - Sem props.
 * @returns {JSX.Element} A seção de prova social.
 */
export function Proof() {
  const track = useRef(null);
  // Onde a janela está, em fração da largura rolável: `start` é o quanto já passou e `size`, o quanto ela cobre. Começa "tudo
  // cabe" (setas apagadas, sem marcador) até a primeira medida: sem JavaScript a pista ainda rola, só as setas ficam de fora.
  const [view, setView] = useState({ start: 0, size: 1 });

  useEffect(() => {
    const node = track.current;
    if (!node) return undefined;
    const measure = () =>
      setView({
        start: node.scrollLeft / node.scrollWidth,
        size: node.clientWidth / node.scrollWidth,
      });
    node.addEventListener("scroll", measure, { passive: true });
    const observer = new ResizeObserver(measure); // dispara ao observar: é a primeira medida
    observer.observe(node);
    return () => {
      node.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, []);

  // Um print por clique: a distância de um cartão ao próximo (largura mais vão). O `scroll-smooth` só vale sem movimento reduzido.
  const page = (direction) => {
    const [first, second] = track.current.children;
    track.current.scrollBy({ left: direction * (second.offsetLeft - first.offsetLeft) });
  };
  const isAtStart = view.start < 0.005;
  const isAtEnd = view.start + view.size > 0.995;

  return (
    <section
      id="prova-social"
      className={`${BLOCK} isolate border-t-0! pb-20 md:pb-32`}
      aria-roledescription="carrossel"
      aria-label={CONTENT.proof.title}
    >
      <DotField variant="estelar" />
      <div className={`${ENVELOPE} relative z-1`}>
        <header className="mb-10 grid gap-4 border-t border-line-strong pt-6 lg:mb-14">
          <Label margin="mb-0">{CONTENT.proof.label}</Label>
          <h2 className="m-0 text-bone font-secondary text-h1 uppercase [--text-h1:40px] md:[--text-h1:51.2px]">
            {CONTENT.proof.title}
          </h2>
        </header>

        <ol
          ref={track}
          tabIndex={0}
          aria-label="Prints de clientes"
          className={`flex items-start gap-4 list-none m-0 overflow-x-auto overscroll-x-contain snap-x snap-mandatory motion-safe:scroll-smooth [scrollbar-width:none] md:gap-6 ${TRACK_BLEED}`}
        >
          {PRINTS.map(({ src, alt }, i) => (
            <li
              key={src ?? i}
              className="w-[min(64vw,280px)] flex-none snap-start lg:w-80 wide:w-85"
              aria-roledescription="slide"
              aria-label={`${i + 1} de ${PRINTS.length}`}
            >
              <div className="relative aspect-[540/1144] overflow-clip border border-line-strong bg-surface-1">
                {src ? (
                  <img
                    src={src}
                    alt={alt}
                    width="540"
                    height="1144"
                    loading="lazy"
                    decoding="async"
                    className="size-full object-contain"
                  />
                ) : (
                  <Placeholder index={i} />
                )}
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex items-center gap-6 lg:mt-10">
          <div className="relative h-[3px] flex-1 overflow-clip bg-line-strong" aria-hidden="true">
            <span
              className={`absolute inset-0 origin-left bg-accent ${view.size < 1 ? "" : "invisible"}`}
              style={{ transform: `translateX(${view.start * 100}%) scaleX(${view.size})` }}
            />
          </div>
          <div className="flex gap-2">
            <Arrow
              direction={-1}
              label="Print anterior"
              disabled={isAtStart}
              onClick={() => page(-1)}
            />
            <Arrow direction={1} label="Próximo print" disabled={isAtEnd} onClick={() => page(1)} />
          </div>
        </div>

        {RATING && (
          <Rating
            note={RATING.note}
            max={RATING.max}
            className="mt-12 lg:mt-16"
          />
        )}
      </div>
    </section>
  );
}
