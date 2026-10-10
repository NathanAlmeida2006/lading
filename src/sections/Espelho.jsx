import { useRef } from "react";
import { conteudo } from "../conteudo.js";
import { Botao } from "../components/Botao.jsx";
import { Rotulo } from "../components/Rotulo.jsx";
import { mascaraDeLinha, revelar, useMovimento } from "../motion/index.js";
import { bloco, envelope, mascara } from "../ui.js";

// Situação e comportamento do protocolo; não são relatos nem antes/depois corporal.
const CARTAS = conteudo.espelho.cartas;

export function Espelho({ params }) {
  const raiz = useRef(null);
  const lista = useRef(null);

  useMovimento(() => {
    const no = raiz.current;
    if (!no) return;
    revelar(no.querySelector(".rotulo"));
    mascaraDeLinha(no.querySelector(".titulo"), { atraso: 60 });
    revelar(no.querySelector(".espelho__sub"), { atraso: 200 });

    // A pilha so serve se cada card, grudado no seu degrau, cabe inteiro na janela: senao
    // ela SOLTA (`data-solta`) e os cards seguem em fila. So se mede com o grude ligado: sob
    // movimento reduzido o `top` e `auto`, a conta vira NaN e a pilha continua como esta.
    const pilha = lista.current;
    const cartas = [...no.querySelectorAll(".carta")];
    const medir = () => {
      pilha.removeAttribute("data-solta");
      const cabe = cartas.every((carta, i) =>
        i === cartas.length - 1 || !(parseFloat(getComputedStyle(carta).top) + carta.offsetHeight > window.innerHeight));
      pilha.toggleAttribute("data-solta", !cabe);
    };
    // So a LARGURA reage: a barra do navegador no celular muda a altura a cada rolagem.
    let largura = window.innerWidth;
    const aoRedimensionar = () => {
      if (window.innerWidth === largura) return;
      largura = window.innerWidth;
      medir();
    };
    medir();
    document.fonts?.ready.then(medir);
    window.addEventListener("resize", aoRedimensionar);
    return () => window.removeEventListener("resize", aoRedimensionar);
  }, []);

  return (
    <section id="espelho" className={`${bloco} py-16 md:py-24`} data-theme="cartaz" ref={raiz}>
      <div className={`${envelope} lg:grid lg:grid-cols-[repeat(12,1fr)] lg:gap-x-8 lg:items-start`}>
        <header className="mb-8 lg:mb-0 lg:col-[1/span_4] lg:sticky lg:top-12">
          <Rotulo>a troca de régua</Rotulo>
          <h2
            className={`titulo text-bone font-secundaria text-h1 uppercase lg:text-display ${mascara}`}
            data-revelar
          >
            O que muda quando a régua muda
          </h2>
          <p
            className="espelho__sub max-w-prose mt-4 text-silver font-terciaria text-body lg:text-body-lg"
            data-revelar
          >
            Cinco situações do treino e o que o protocolo organiza em cada uma.
          </p>
        </header>

        <div className="lg:col-[6/-1]">
        <ol className="flex flex-col gap-4 lg:gap-6" role="list" ref={lista}>
          {CARTAS.map((carta, indice) => (
            <li
              className="carta sticky top-[calc(--spacing(6)+var(--ordem)*--spacing(12))] isolate flex flex-col gap-3 p-6 md:p-8 bg-surface-1 even:bg-void border border-line-strong motion-reduce:static [[data-solta]_&]:static"
              key={carta.titulo}
              style={{ "--ordem": indice }}
            >
              <span className="text-silver font-terciaria text-mono-reg tabular-nums" aria-hidden="true">
                {String(indice + 1).padStart(2, "0")}
              </span>
              <h3 className="text-bone font-secundaria text-h3 normal-case tracking-normal lg:text-h2">
                {carta.titulo}
              </h3>
              <p className="max-w-prose text-bone font-terciaria text-body-lg">{carta.depois}</p>
              <p className="text-silver font-terciaria text-body lg:text-body-lg">
                <span className="mr-1 text-silver font-secundaria text-overline uppercase">{conteudo.espelho.rotuloSituacao}</span>{" "}
                <s className="line-through decoration-2 decoration-line-strong">{carta.hoje}</s>
              </p>
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 mt-2 pt-4 border-t border-line">
                <span className="text-silver font-terciaria text-mono-reg tabular-nums">[{carta.lastro}]</span>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-8">
          <Botao params={params} posicao="espelho" />
        </div>
        </div>
      </div>
    </section>
  );
}
