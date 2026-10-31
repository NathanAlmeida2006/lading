import { Fragment, useRef } from "react";
import { CampoDePontos } from "../components/CampoDePontos.jsx";
import { ImagemReservada } from "../components/ImagemReservada.jsx";
import { Rotulo } from "../components/Rotulo.jsx";
import { acenderEmSequencia, revelar, revelarEmCascata, useMovimento } from "../motion/index.js";
import { conteudo } from "../conteudo.js";
import { bloco, doisDigitos, envelope, grao, palavra as PALAVRA } from "../ui.js";

/**
 * O que voce leva. A cabeca fica centrada e grudada no meio da tela, e os cards
 * passam por cima dela ao rolar, em ziguezague de tres posicoes no monitor e
 * empilhados no celular.
 *
 * A fala de cada card e o beneficio, na voz do parceiro de treino. Nao ha
 * depoimento, e nenhum e inventado.
 */

// A imagem (quadrada, object-cover) preenche o card inteiro, e o card e mais alto que largo no celular e no lg (min-h-95 / lg:min-h-115): a largura desenhada e a ALTURA (460 no lg, com folga). No celular o `sizes` fica de proposito um pouco abaixo dela (356 contra 378 a 390 px): com DPR 3 isso escolhe a variante de 1080 em vez do original de 1440, a 2,86x em vez de 3x.
const SIZES = "(min-width: 1024px) 480px, (min-width: 720px) 686px, calc(100vw - 34px)";

/**
 * O ziguezague do monitor: um PAR (esquerda, e a direita nascendo 15vh mais
 * baixa) e depois um card sozinho no centro, e de novo. Coluna em flex, nao
 * grade: a direita sobe para o lado da esquerda por margem negativa, e para a
 * conta fechar o card tem altura fixa (460px). A posicao sai do indice, e nao
 * de `nth-child`, porque duas utilitarias do mesmo variante nao tem ordem
 * garantida.
 */
const ZIGUEZAGUE = [
  "lg:self-start lg:mt-0",
  "lg:self-end lg:mt-[calc(15vh_-_--spacing(115))]",
  "lg:self-center lg:mt-32",
];

export function Leva() {
  const raiz = useRef(null);
  const palco = useRef(null);

  useMovimento(() => {
    const no = raiz.current;
    if (!no) return;
    revelar(no.querySelector(".rotulo"));
    revelarEmCascata(no.querySelectorAll(".voz"), { intervalo: 80 });
    // O trilho `fixo` e o palco: 190svh, 90svh de titulo pinado. Ele nasce acima do
    // titulo (o titulo pina no meio da tela) para a conta comecar quando o titulo pina.
    acenderEmSequencia(no.querySelectorAll(".titulo .palavra"), palco.current, {
      fixo: true,
      atributoAtual: "data-atual",
    });
  }, []);

  return (
    <section id="o-que-e" className={`${bloco} py-20 md:py-32`} ref={raiz}>
      <CampoDePontos />

      <div className={`${envelope} relative z-1`}>
        <div
          className="absolute inset-x-0 top-[calc(140px-50svh)] h-[190svh] pointer-events-none motion-reduce:hidden"
          ref={palco}
          aria-hidden="true"
        />
        {/* O titulo fica pinado ate os cards chegarem: o palco tem 190svh com 100svh pinado,
            90svh de espera. Aqui a margem da lista (140svh - 140px) soma, com o titulo centrado
            e ~280px de altura, esses mesmos 90svh. */}
        <header className="sticky top-[max(--spacing(12),calc(50svh-140px))] z-0 flex flex-col items-center py-8 text-center motion-reduce:static">
          <Rotulo>Veja tudo que você terá direito</Rotulo>
          <h2
            className="titulo text-bone font-secundaria text-display [font-size:clamp(31px,13.08vw,89.9px)] lg:[font-size:clamp(89.9px,10.1vw,125.8px)] normal-case tracking-[-0.005em] leading-[1.02]"
          >
            {conteudo.leva.titulo.split(" ").map((palavra, indice) => (
              <Fragment key={`${palavra}-${indice}`}>
                <span className={PALAVRA}>{palavra}</span>{" "}
                {indice === 1 ? <br /> : null}
              </Fragment>
            ))}
          </h2>
          <p className="max-w-[46ch] mt-4 text-silver font-terciaria text-body-lg">{conteudo.leva.sub}</p>
        </header>

        <ol className="relative z-1 flex flex-col gap-10 mt-[calc(140svh-140px)] motion-reduce:mt-16 lg:gap-0" role="list">
          {conteudo.leva.vozes.map((voz, indice) => {
            const posicao = ZIGUEZAGUE[indice % 3];
            return (
              <li
                className={`voz relative flex flex-col gap-3 min-h-95 p-6 bg-surface-1 text-bone border border-line-strong *:relative *:z-1 lg:w-[calc((100%-2*--spacing(8))/3)] lg:min-h-115 lg:p-8 ${posicao} ${grao} before:z-0`}
                key={voz.nome}
                data-revelar
              >
                <ImagemReservada src={voz.src} sizes={SIZES} className="absolute! inset-0 z-0! border-0" />
                <span className="absolute! inset-0 z-0! bg-linear-to-t from-void/95 via-void/60 to-void/20" aria-hidden="true" />
                <span
                  className="font-secundaria font-extrabold uppercase tracking-[0.02em] text-acento text-[48px] leading-[0.6]"
                  aria-hidden="true"
                >
                  &ldquo;
                </span>
                <p className="flex-auto text-left text-bone font-secundaria text-h3-voz lg:text-h3-voz-lg">
                  {voz.fala}
                </p>
                <div className="flex flex-col gap-1">
                  <h3 className="text-bone font-secundaria text-label-grande uppercase">{voz.nome}</h3>
                  <p className="text-silver font-terciaria text-caption-grande">{voz.governa}</p>
                </div>
                <span className="block pt-4 border-t border-line text-silver font-terciaria text-mono-grande tabular-nums">
                  [{doisDigitos(indice + 1)} · {voz.onde}]
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
