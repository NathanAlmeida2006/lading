import { useRef } from "react";
import { conteudo } from "../conteudo.js";
import { CampoDePontos } from "../components/CampoDePontos.jsx";
import { Botao } from "../components/Botao.jsx";
import { ImagemReservada } from "../components/ImagemReservada.jsx";
import { Rotulo } from "../components/Rotulo.jsx";
import { mascaraDeLinha, revelar, useMovimento } from "../motion/index.js";
import { usePilhaDeCartas } from "../motion/pilhaDeCartas.js";
import { bloco, doisDigitos, envelope, grade12, mascara } from "../ui.js";

// Situação e comportamento do protocolo; não são relatos nem antes/depois corporal.
const CARTAS = conteudo.espelho.cartas;
// Largura real da imagem: 7 das 12 colunas da grade no lg (1024: 584 do card menos 34 de borda e respiro; wide: 718), a coluna toda abaixo (cap de 720 do envelope).
const SIZES = "(min-width: 1440px) 718px, (min-width: 1024px) 550px, (min-width: 720px) 662px, calc(100vw - 58px)";

export function Espelho() {
  const raiz = useRef(null);
  const lista = useRef(null);

  useMovimento(() => {
    const no = raiz.current;
    if (!no) return;
    revelar(no.querySelector(".rotulo"));
    mascaraDeLinha(no.querySelector(".titulo"), { atraso: 60 });
    revelar(no.querySelector(".espelho__sub"), { atraso: 200 });
  }, []);
  usePilhaDeCartas(raiz, lista);

  return (
    <section id="espelho" className={`${bloco} isolate py-16 md:py-24`} ref={raiz}>
      <CampoDePontos variante="estelar" />
      <div className={`${envelope} relative z-1 ${grade12} lg:items-start`}>
        <header className="mb-8 lg:mb-0 lg:col-[1/span_5] lg:sticky lg:top-12">
          <Rotulo>hipertrofia · natural</Rotulo>
          <h2
            className={`titulo text-bone font-secundaria text-h1 uppercase lg:text-display [--text-h1:51.2px] lg:[--text-display:clamp(48px,6.2vw,89.6px)] ${mascara}`}
            data-revelar
          >
            {conteudo.espelho.titulo}
          </h2>
          <p
            className="espelho__sub max-w-prose mt-4 text-silver font-terciaria text-body lg:text-body-lg"
            data-revelar
          >
            {conteudo.espelho.sub}
          </p>
        </header>

        <div className="lg:col-[6/-1]">
        <ol className="flex flex-col gap-4 lg:gap-6" role="list" ref={lista}>
          {CARTAS.map((carta, indice) => (
            <li
              className="carta sticky top-[calc(--spacing(6)+var(--ordem)*--spacing(12))] isolate flex flex-col gap-4 p-3 md:p-4 bg-surface-1 even:bg-void border border-line-strong motion-reduce:static [[data-solta]_&]:static"
              key={carta.titulo}
              style={{ "--ordem": indice }}
            >
              <div className="relative">
                <ImagemReservada src={carta.src} sizes={SIZES} fixarProporcao className={`aspect-16/10${carta.src ? " brightness-60" : ""} ${carta.pos ?? ""}`} />
                <span className="absolute left-3 top-3 px-3 py-1 bg-void border border-line-strong text-bone font-terciaria text-mono-reg tabular-nums" aria-hidden="true">
                  {doisDigitos(indice + 1)}
                </span>
                <span className="absolute right-3 top-3 px-3 py-1 bg-acento text-bone font-secundaria text-overline uppercase">
                  {carta.lastro}
                </span>
              </div>
              <div className="flex flex-col gap-2 px-2 pb-2">
                <h3 className="text-bone font-secundaria text-h3-grande uppercase tracking-normal lg:text-h2-grande">
                  {carta.titulo}
                </h3>
                <p className="max-w-prose text-silver font-terciaria text-body lg:text-body-lg">{carta.depois}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-8">
          <Botao posicao="espelho" />
        </div>
        </div>
      </div>
    </section>
  );
}
