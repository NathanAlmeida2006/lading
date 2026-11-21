import { useRef } from "react";
import { DotField } from "../components/visuals/DotField.jsx";
import { CardImage } from "../components/ui/CardImage.jsx";
import { revealInCascade, useMotion } from "../sensory/index.js";
import { CONTENT } from "../content/content.js";
import { BLOCK, padTwoDigits, ENVELOPE, GRAIN } from "../app/ui.js";

/**
 * O que voce leva: os cards direto, em ziguezague de tres posicoes no monitor e
 * empilhados no celular.
 *
 * A fala de cada card e o beneficio, na voz do parceiro de treino. Nao ha
 * depoimento, e nenhum e inventado.
 * @param {object} props - Sem props.
 * @returns {JSX.Element} A seção O que você leva.
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
const ZIGZAG = [
  "lg:self-start lg:mt-0",
  "lg:self-end lg:mt-[calc(15vh_-_--spacing(115))]",
  "lg:self-center lg:mt-32",
];

export function Batch() {
  const root = useRef(null);

  useMotion(() => {
    const node = root.current;
    if (!node) return;
    revealInCascade(node.querySelectorAll(".voz"), { interval: 80 });
  }, []);

  return (
    <section id="o-que-e" className={`${BLOCK} py-20 md:py-32`} ref={root}>
      <DotField variant="estelar" />

      <div className={`${ENVELOPE} relative z-1`}>
        <h2 className="sr-only">{CONTENT.leva.rotulo}</h2>
        <ol className="relative z-1 flex flex-col gap-10 lg:gap-0" role="list">
          {CONTENT.leva.vozes.map((voice, index) => {
            const position = ZIGZAG[index % 3];
            return (
              <li
                className={`voz relative flex flex-col gap-3 min-h-95 p-6 bg-surface-1 text-bone border border-line-strong *:relative *:z-1 lg:w-[calc((100%-2*--spacing(8))/3)] lg:min-h-115 lg:p-8 ${position} ${GRAIN} before:z-0${voice.zoom ? " overflow-clip" : ""}`}
                key={voice.nome}
                data-revelar
              >
                <CardImage src={voice.src} sizes={SIZES} className={`absolute! inset-0 z-0! border-0${voice.zoom ? " scale-105" : ""}`} />
                <span className="absolute! inset-0 z-0! bg-linear-to-t from-void/95 via-void/80 to-void/65" aria-hidden="true" />
                <span
                  className="font-secundaria font-extrabold uppercase tracking-[0.02em] text-acento text-[48px] leading-[0.6]"
                  aria-hidden="true"
                >
                  &ldquo;
                </span>
                <p className="flex-auto text-left text-bone font-secundaria text-h3-voz lg:text-h3-voz-lg [text-shadow:0_1px_10px_var(--void)]">
                  {voice.fala}
                </p>
                <div className="flex flex-col gap-1">
                  <h3 className="text-bone font-secundaria text-label-grande uppercase">{voice.nome}</h3>
                  <p className="text-silver font-terciaria text-caption-grande">{voice.governa}</p>
                </div>
                <span className="block pt-4 border-t border-line text-silver font-terciaria text-mono-grande tabular-nums">
                  [{padTwoDigits(index + 1)} · {voice.onde}]
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
