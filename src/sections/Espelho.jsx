import { useRef } from "react";
import { Botao } from "../components/Botao.jsx";
import { Rotulo } from "../components/Rotulo.jsx";
import { mascaraDeLinha, revelar, revelarEmCascata, useMovimento } from "../motion/index.js";
import { bloco, envelope, mascara } from "../ui.js";

/**
 * O espelho, em baralho de cards: a secao "Find Your Program" do Rep Republic.
 *
 * Lida ao vivo em 06/09/2026: cabeca grudada a esquerda (rotulo, titulo grande,
 * subtitulo) e, a direita, cinco cards numerados que GRUDAM e se acumulam ao
 * rolar, cada um num degrau abaixo do anterior, deixando a faixa do indice dos
 * cobertos a mostra. Anatomia do card: indice no acento, titulo grande,
 * descricao, linha de metadados, fio, e um rodape com prova a esquerda e o
 * botao a direita.
 *
 * O conteudo continua sendo o espelho do Kora: cada card troca uma regua. O
 * "hoje" virou a linha de metadados, riscado; o lastro ocupa o lugar das
 * estrelas, porque prova aqui e autor e ano, nao avaliacao; e o botao de cada
 * card e o mesmo verbo da pagina (RF-L10), em contorno, para o acento da
 * superficie continuar sendo um so: o indice.
 *
 * Nenhum card promete corpo. Promete comportamento e medida, que e o que o
 * protocolo entrega e o que o RF-L35 permite prometer sem intervalo.
 *
 * Cada card gruda num degrau abaixo do anterior e o seguinte sobe por cima:
 * `top = 24px + ordem * 48px`. Travas herdadas: `overflow-clip` (nunca
 * `hidden`) em qualquer ancestral, e nenhum `transform` em ancestral de quem
 * gruda. O card anima a si mesmo (opacity e y na revelacao), e isso e
 * permitido: a trava e sobre ancestrais.
 *
 * A pilha so serve se cada card, grudado no seu degrau, ainda mostra o pe (o botao) dentro
 * da janela: um card coberto nunca mais revela o que fica abaixo da dobra. Em janela baixa
 * (celular deitado, 320 x 568) ou com texto maior isso nao fecha, e a pilha SOLTA: os cards
 * seguem em fila, como sob movimento reduzido (`data-solta` na lista).
 */
const CARTAS = [
  {
    titulo: "Troca a régua",
    depois: "Mede pelo teto natural, que tem número, autor e ano.",
    hoje: "Mede o potencial pelo shape do feed.",
    lastro: "Kouri e colaboradores, 1995",
  },
  {
    titulo: "Troca a onda pela semana",
    depois: "Treina três vezes por semana, doze semanas seguidas, com a semana como unidade.",
    hoje: "Treina em ondas de duas a seis semanas.",
    lastro: "12 semanas · 3 sessões por semana",
  },
  {
    titulo: "Troca o achismo pela regra",
    depois: "Sobe o peso quando bate 12 boas. A Regra do 12 decide, não o humor do dia.",
    hoje: "Troca o treino toda vez que o resultado demora.",
    lastro: "Progressão sem planilha",
  },
  {
    titulo: "Troca a desistência pelo retorno",
    depois: "Falta um dia, e o plano de retorno já diz o que fazer na próxima sessão.",
    hoje: "Falta um dia, o dia vira a semana, a semana vira desistência.",
    lastro: "A perda mensurável leva semanas, não dias",
  },
  {
    titulo: "Troca o mito pelo número",
    depois: "Sabe onde fica o teto de quem não usa nada, e quanto falta pra ele.",
    hoje: "Acha que sem bomba não chega lá.",
    lastro: "Índice em 25 ou abaixo, média 21,8",
  },
];

export function Espelho({ params }) {
  const raiz = useRef(null);
  const lista = useRef(null);

  useMovimento(() => {
    const no = raiz.current;
    if (!no) return;
    revelar(no.querySelector(".rotulo"));
    mascaraDeLinha(no.querySelector(".titulo"), { atraso: 60 });
    revelar(no.querySelector(".espelho__sub"), { atraso: 200 });
    revelarEmCascata(no.querySelectorAll(".carta"), { intervalo: 80 });

    // So se mede com o grude ligado: o `top` calculado so existe em `sticky` (sob movimento
    // reduzido ele e `auto`, a conta vira NaN e a pilha continua como esta).
    const pilha = lista.current;
    const cartas = [...no.querySelectorAll(".carta")];
    const medir = () => {
      pilha.removeAttribute("data-solta");
      const cabe = cartas.every((carta, i) => {
        if (i === cartas.length - 1) return true;
        const pe = carta.querySelector(".botao").getBoundingClientRect().bottom - carta.getBoundingClientRect().top;
        return !(parseFloat(getComputedStyle(carta).top) + pe > window.innerHeight);
      });
      pilha.toggleAttribute("data-solta", !cabe);
    };
    // So a LARGURA reage: a barra do navegador entrando e saindo no celular muda a altura a
    // cada rolagem, e a pilha nao pode ligar e desligar no meio dela.
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
            Cinco trocas. Nenhuma pede motivação: pedem uma régua que tem número, e um plano que
            já conta com a semana que falha.
          </p>
        </header>

        <ol className="flex flex-col gap-4 lg:gap-6 lg:col-[6/-1]" role="list" ref={lista}>
          {CARTAS.map((carta, indice) => (
            <li
              className="carta sticky top-[calc(--spacing(6)+var(--ordem)*--spacing(12))] isolate flex flex-col gap-3 p-6 md:p-8 bg-surface-1 even:bg-void border border-line-strong motion-reduce:static [[data-solta]_&]:static"
              key={carta.titulo}
              style={{ "--ordem": indice }}
              data-revelar
            >
              <span className="text-acento font-terciaria text-mono-reg tabular-nums">
                {String(indice + 1).padStart(2, "0")}
              </span>
              <h3 className="text-bone font-secundaria text-h1 normal-case tracking-normal lg:text-display lg:tracking-normal">
                {carta.titulo}
              </h3>
              <p className="max-w-prose text-bone font-terciaria text-body-lg">{carta.depois}</p>
              <p className="text-silver font-terciaria text-body lg:text-body-lg">
                <span className="mr-1 text-silver font-secundaria text-overline uppercase">hoje</span>{" "}
                <s className="line-through decoration-2 decoration-line-strong">{carta.hoje}</s>
              </p>
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 mt-2 pt-4 border-t border-line">
                <span className="text-silver font-terciaria text-mono-reg tabular-nums">[{carta.lastro}]</span>
                <Botao params={params} posicao={`espelho-${indice + 1}`} compacto fantasma />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
