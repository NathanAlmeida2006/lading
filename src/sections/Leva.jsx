import { Fragment, useRef } from "react";
import { CampoDePontos } from "../components/CampoDePontos.jsx";
import { Rotulo } from "../components/Rotulo.jsx";
import { acenderEmSequencia, revelar, revelarEmCascata, useMovimento } from "../motion/index.js";
import { bloco, envelope, grao } from "../ui.js";

/**
 * O que voce leva, na forma da secao "Members' Words" do Rep Republic.
 *
 * Lida ao vivo em 06/09/2026: a cabeca fica CENTRADA e GRUDADA no meio da
 * tela (rotulo, titulo grande, subtitulo) e os cards passam por cima dela ao
 * rolar - em ziguezague de tres colunas no monitor (esquerda, direita,
 * centro) e empilhados no celular - alternando card escuro com textura e card
 * claro. Anatomia do card: glifo de aspas no acento, a frase grande, nome,
 * cidade, fio e etiqueta no pe.
 *
 * Aqui nao ha depoimento, e nenhum e inventado: a "fala" de cada card e o
 * beneficio, na voz do parceiro de treino; o "nome" e o termo-marca do
 * glossario (§5 do manual-de-voz), escrito sempre da mesma forma; a "cidade"
 * e o que aquele termo governa; e a etiqueta diz onde ele vive dentro do
 * protocolo, sem numero de capitulo, que a landing nao tem autoridade para
 * fixar (RF-L11a). O nome do sistema de retomada continua fora da capa, pela
 * trava do glossario.
 *
 * Os cards alternam tema pelo proprio atributo: a secao e Sigilo, e os pares
 * levam `data-theme="cartaz"`. E o unico lugar da pagina em que os dois temas
 * convivem na mesma tela, e e o que reproduz a alternancia do site de origem
 * sem fotografia.
 *
 * O campo de pontos ao fundo e o mesmo da prova (07/09/2026), e vale a mesma
 * ressalva: ele esbarra no `TR-03` e a decisao esta na §6 do contrato. Os
 * cards tem superficie opaca propria, entao nenhum texto corrido cai sobre a
 * malha - o que sobra por cima dela e a cabeca, em escala de titulo, e a
 * propria malha e tratamento de 1 bit, que e o que o `TR-07` pede por baixo
 * de texto.
 *
 * O `transform` de centralizacao fica na PROPRIA cabeca, que nao e ancestral
 * de nada grudado: a trava e sobre ancestrais.
 */
const VOZES = [
  { nome: "Protocolo Hipertrofia", governa: "Treino", onde: "12 semanas", fala: "Zero improviso: o mapa completo de 12 semanas no app, usando a Regra do 12 para extrair seu máximo crescimento natural." },
  { nome: "Protocolo Dieta", governa: "Combustível", onde: "no app", fala: "Ajuste estratégico de combustível para construir massa densa e seca, sem passar fome e sem embaçar o shape com bulking sujo." },
  { nome: "Protocolo Sono", governa: "Recuperação", onde: "no app", fala: "Sono profundo alinhado para manter sua testosterona no topo e acelerar a reconstrução muscular entre um treino e outro." },
];

/**
 * O ziguezague do monitor: um PAR (esquerda, e a direita nascendo 15vh mais
 * baixa) e depois um card sozinho no centro, e de novo. Coluna em flex, nao
 * grade: a direita sobe para o lado da esquerda por margem negativa, e para a
 * conta fechar o card tem altura fixa (460px). A posicao sai do indice, e nao
 * de `nth-child`, porque duas utilitarias do mesmo variante nao tem ordem
 * garantida.
 */
const ZIGUEZAGUE = [
  "lg:self-start lg:mt-32",
  "lg:self-end lg:mt-[calc(15vh_-_--spacing(115))]",
  "lg:self-center lg:mt-32",
];

// Mesma animacao da prova: a palavra apagada e opacidade, e a da fronteira (`data-atual`) no acento.
const PALAVRA =
  "palavra inline-block transition-[opacity,color] duration-(--motion-fast) ease-(--ease-corte-2) " +
  "js:opacity-[0.22] data-acesa:opacity-100 data-atual:text-acento " +
  "motion-reduce:js:opacity-100 motion-reduce:data-atual:text-inherit";
const TITULO = "Cresça calado. Imponha respeito.";

export function Leva() {
  const raiz = useRef(null);
  const palco = useRef(null);

  useMovimento(() => {
    const no = raiz.current;
    if (!no) return;
    revelar(no.querySelector(".rotulo"));
    revelarEmCascata(no.querySelectorAll(".voz"), { intervalo: 80 });
    // O trilho `fixo` e o palco da prova: 190svh, 90svh de titulo pinado. Ele nasce acima do
    // titulo (o titulo pina no meio da tela) para a conta comecar quando o titulo pina.
    const anim = acenderEmSequencia(no.querySelectorAll(".titulo .palavra"), palco.current, {
      fixo: true,
      atributoAtual: "data-atual",
    });
    return () => anim?.revert?.();
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
        {/* O titulo fica pinado ate os cards chegarem pelo mesmo tempo da prova: o palco dela tem
            190svh com 100svh pinado, 90svh de espera. Aqui a margem da lista (140svh - 140px) soma,
            com o titulo centrado e ~280px de altura, esses mesmos 90svh. */}
        <header className="sticky top-[max(--spacing(12),calc(50svh-140px))] z-0 flex flex-col items-center py-8 text-center motion-reduce:static">
          <Rotulo>Veja tudo que você terá direito</Rotulo>
          <h2
            className="titulo text-bone font-secundaria text-display [font-size:clamp(31px,13.08vw,89.9px)] lg:[font-size:clamp(89.9px,10.1vw,125.8px)] normal-case tracking-[-0.005em] leading-[1.02]"
          >
            {TITULO.split(" ").map((palavra, indice) => (
              <Fragment key={`${palavra}-${indice}`}>
                <span className={PALAVRA}>{palavra}</span>{" "}
                {indice === 1 ? <br /> : null}
              </Fragment>
            ))}
          </h2>
          <p className="max-w-[46ch] mt-4 text-silver font-terciaria text-body-lg">Três armas para você nunca mais pisar na academia perdido.</p>
        </header>

        <ol className="relative z-1 flex flex-col gap-10 mt-[calc(140svh-140px)] motion-reduce:mt-16 lg:gap-0" role="list">
          {VOZES.map((voz, indice) => {
            const posicao = indice === 0 ? "lg:self-start lg:mt-0" : ZIGUEZAGUE[indice % 3];
            return (
              <li
                className={`voz relative flex flex-col gap-3 min-h-95 p-6 bg-surface-1 text-bone border border-line-strong *:relative *:z-1 lg:w-[calc((100%-2*--spacing(8))/3)] lg:min-h-115 lg:p-8 ${posicao} ${grao} before:z-0`}
                key={voz.nome}
                data-revelar
              >
                <span
                  className="font-secundaria font-extrabold uppercase tracking-[0.02em] text-acento text-[48px] leading-[0.6]"
                  aria-hidden="true"
                >
                  &ldquo;
                </span>
                <p className="flex-auto text-left text-bone font-secundaria text-h3 [font-size:23.76px] lg:text-[28.51px] lg:leading-[1.15]">
                  {voz.fala}
                </p>
                <div className="flex flex-col gap-1">
                  <h3 className="text-bone font-secundaria text-label [font-size:18px] uppercase">{voz.nome}</h3>
                  <p className="text-silver font-terciaria text-caption [font-size:15.6px]">{voz.governa}</p>
                </div>
                <span className="block pt-4 border-t border-line text-silver font-terciaria text-mono-reg [font-size:13.2px] tabular-nums">
                  [{String(indice + 1).padStart(2, "0")} · {voz.onde}]
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
