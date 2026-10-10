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
  {
    fala: "Você para de perguntar se sobe o peso. Bateu 12 boas em todas as séries, sobe. Acabou o achismo.",
    nome: "A Regra do 12",
    governa: "Progressão",
    onde: "no capítulo do programa",
  },
  {
    fala: "Faltou uma semana? O protocolo já sabe o que você faz na próxima sessão. A quebra está prevista, não punida.",
    nome: "O plano de retorno",
    governa: "Retomada",
    onde: "no capítulo da retomada",
  },
  {
    fala: "A unidade é a semana, nunca a sequência de dias. Uma amarela é dado do processo, não veredito sobre você.",
    nome: "Semana verde, semana amarela",
    governa: "Unidade de medida",
    onde: "em todo o protocolo",
  },
  {
    fala: "Você troca de exercício quando executa bem, não quando o mês virou. Quem libera é a ficha.",
    nome: "Portão da fase 3",
    governa: "Troca de exercício",
    onde: "na passagem para a fase 3",
  },
  {
    fala: "Sete anexos pra abrir no celular dentro da academia: ficha de treino, tabela de retorno e o resto que se usa de verdade.",
    nome: "O Kit",
    governa: "Ferramentas",
    onde: "nos sete anexos",
  },
  {
    fala: "Três sessões obrigatórias e uma opcional, de 60 a 75 minutos. Cabe numa rotina de estágio de seis horas por dia.",
    nome: "Quatro a cinco horas por semana",
    governa: "Rotina",
    onde: "na semana de treino",
  },
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
const TITULO = "Seis coisas. Nenhuma depende de motivação.";

export function Leva() {
  const raiz = useRef(null);
  const palco = useRef(null);

  useMovimento(() => {
    const no = raiz.current;
    if (!no) return;
    revelar(no.querySelector(".rotulo"));
    revelar(no.querySelector(".leva__sub"), { atraso: 200 });
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
          <Rotulo>o que você leva pra academia</Rotulo>
          <h2
            className="titulo text-bone font-secundaria text-display normal-case tracking-[-0.005em] leading-[1.02] max-w-[14ch] lg:max-w-[16ch]"
          >
            {TITULO.split(" ").map((palavra, indice) => (
              <Fragment key={`${palavra}-${indice}`}>
                <span className={PALAVRA}>{palavra}</span>{" "}
              </Fragment>
            ))}
          </h2>
          <p
            className="leva__sub max-w-prose lg:max-w-[30ch] mt-4 text-silver text-center font-terciaria text-body lg:text-body-lg"
            data-revelar
          >
            Cada uma tem nome, e o nome é o que você procura dentro do protocolo quando a semana
            aperta.
          </p>
        </header>

        <ol className="relative z-1 flex flex-col gap-10 mt-[calc(140svh-140px)] motion-reduce:mt-16 lg:gap-0" role="list">
          {VOZES.map((voz, indice) => {
            const claro = indice % 2 === 1;
            const posicao = indice === 0 ? "lg:self-start lg:mt-0" : ZIGUEZAGUE[indice % 3];
            return (
              <li
                className={`voz relative flex flex-col gap-3 min-h-95 p-6 bg-surface-1 text-bone border border-line-strong *:relative *:z-1 lg:w-[calc((100%-2*--spacing(8))/3)] lg:min-h-115 lg:p-8 ${posicao}${claro ? "" : ` ${grao} before:z-0`}`}
                key={voz.nome}
                data-theme={claro ? "cartaz" : undefined}
                data-revelar
              >
                <span
                  className="font-secundaria font-extrabold uppercase tracking-[0.02em] text-acento text-[48px] leading-[0.6]"
                  aria-hidden="true"
                >
                  &ldquo;
                </span>
                <p className="flex-auto text-bone font-secundaria text-h3 lg:text-[24px] lg:leading-[1.15]">
                  {voz.fala}
                </p>
                <div className="flex flex-col gap-1">
                  <h3 className="text-bone font-secundaria text-label uppercase">{voz.nome}</h3>
                  <p className="text-silver font-terciaria text-caption">{voz.governa}</p>
                </div>
                <span className="block pt-4 border-t border-line text-silver font-terciaria text-mono-reg tabular-nums">
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
