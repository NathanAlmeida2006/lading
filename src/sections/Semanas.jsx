import { CampoDePontos } from "../components/CampoDePontos.jsx";
import { Fragment, useRef } from "react";
import { Botao } from "../components/Botao.jsx";
import { Rotulo } from "../components/Rotulo.jsx";
import { conteudo } from "../conteudo.js";
import { revelar, revelarEmCascata, subirLinhas, useMovimento } from "../motion/index.js";
import { useReguaDoTrilho } from "../motion/regua.js";
import { bloco, camada, envelope, linha } from "../ui.js";

/**
 * O mapa do caminho, na forma da secao "Lenis runs the web" do lenis.dev.
 *
 * Lida ao vivo em 07/09/2026: um fio vertical a esquerda, o titulo gigante em
 * linhas quebradas a mao ao lado dele, e o paragrafo de tese deslocado para a
 * direita E para baixo. Abaixo, a grade de cards com capa, nome e legenda, em
 * ziguezague vertical: nenhum card alinha com o vizinho. Fecha com a grade de
 * numeros e o CTA.
 *
 * A capa de cada card e um numero grande, o analogo do preview de video do
 * showcase: um numero por card, um card por item de `conteudo.mapa.estados`.
 *
 * A regua acende e apaga com a posicao da pagina (RF-L11b): um passo por card,
 * e nao as doze semanas do protocolo. O trilho em fluxo mede os cards; a regua
 * sticky apenas exibe. Sob movimento reduzido ela nasce inteira acesa, porque
 * informa o caminho e informacao nao depende de animacao.
 */
const ESTADOS = conteudo.mapa.estados;
// Passos da regua (um por card). O nome e o das classes `regua12__semana`, de quando eram doze semanas.
const SEMANAS = ESTADOS.length;
const LINHAS = conteudo.mapa.linhas;

/**
 * Uma semana da regua: o ponto (::before) e o numero (::after, de um contador CSS).
 * Cor nunca sozinha (RNF-L14): acesa, a semana muda de PREENCHIMENTO e o numero de peso.
 */
const SEMANA =
  "regua12__semana [counter-increment:semana] flex flex-col gap-2 " +
  "before:block before:h-1.5 before:bg-transparent before:border before:border-line-strong " +
  "before:transition-[background,border-color] before:duration-(--motion-fast) before:ease-(--ease-corte-2) " +
  "data-acesa:before:bg-acento data-acesa:before:border-acento motion-reduce:before:bg-acento motion-reduce:before:border-acento " +
  "after:content-[counter(semana,decimal-leading-zero)] after:text-silver after:font-terciaria after:text-mono-reg after:tabular-nums " +
  "after:transition-[color] after:duration-(--motion-fast) after:ease-(--ease-corte-2) " +
  "data-acesa:after:text-bone data-acesa:after:font-bold motion-reduce:after:text-bone " +
  "data-atual:before:border-2 data-atual:after:underline";

/**
 * Os cards em ziguezague: tres por linha no monitor, e o do meio desce uma
 * capa. Nenhum card alinha com o vizinho, que e o que faz a grade ler como
 * composicao. A posicao sai do indice, e nao de `nth-child`.
 */
const DESCE = ["", "lg:mt-24", "lg:mt-48"];

export function Semanas() {
  const raiz = useRef(null);
  const trilho = useRef(null);
  useReguaDoTrilho(raiz, trilho, SEMANAS, conteudo.mapa.frase);

  useMovimento(() => {
    const no = raiz.current;
    if (!no) return;
    revelar(no.querySelector(".rotulo"));
    // `.linha` e `.linha__texto` sao o primitivo dos paineis, reusado: mesmo
    // recorte, mesma rede de seguranca do RNF-L35, mesma checagem no
    // `verificar`. Uma classe propria aqui ficaria fora das tres.
    // Mais rapido que o padrao, e a razao e de CONTEXTO, nao de gosto. O
    // padrao (820 ms com 110 ms de escalonamento) e o da dobra, onde a
    // headline abre a pagina junto da cortina e a cerimonia cabe. Aqui o
    // visitante ja esta rolando e olhando para o titulo: a ultima linha
    // fechava so depois de 1 s, acima do teto de 0,8 s que as engenharias
    // reversas fixam para movimento em interacao direta. 520 mais 60 poe o
    // fim em 640 ms.
    subirLinhas(no.querySelectorAll(".semanas__titulo .linha__texto"), {
      pai: no.querySelector(".semanas__titulo"),
      tempo: 520,
      intervalo: 60,
    });
    revelar(no.querySelector(".semanas__tese"), { atraso: 160 });
    revelarEmCascata(no.querySelectorAll(".slide"), { intervalo: 80 });
    revelar(no.querySelector(".semanas__mais"));
  }, []);

  return (
    <section id="mapa" className={`${bloco} py-16 md:py-24`} ref={raiz}>
      <CampoDePontos variante="estelar" />
      <div className={`${envelope} relative z-1`}>
        <Rotulo>as próximas doze semanas</Rotulo>

        {/* O fio a esquerda do titulo: 2px em acento, da altura do bloco de linhas. */}
        <div className="relative mt-6 pl-6 lg:pl-8 lg:grid lg:grid-cols-[repeat(12,1fr)] lg:gap-x-8 before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-acento">
          {/* Escala PROPRIA, menor que a dos paineis: o teto e o que faz a linha mais longa caber
              na coluna, medido. O recorte de `.linha` e so vertical, entao uma palavra mais larga
              que a coluna transborda em vez de sair cortada. */}
          <h2
            className="semanas__titulo flex flex-col text-bone font-secundaria font-extrabold uppercase tracking-[0.01em] leading-[1.08] tabular-nums text-[length:clamp(39.6px,18.9vw,86.4px)] lg:col-[1/span_8] lg:text-[length:clamp(64.8px,7.65vw,111.6px)]"
            data-revelar
          >
            {LINHAS.map((texto) => (
              <Fragment key={texto}>
                <span className={linha}>
                  <span className={`linha__texto block [overflow-wrap:anywhere] ${camada}`}>{texto}</span>
                </span>{" "}
              </Fragment>
            ))}
          </h2>

          <p
            className="semanas__tese max-w-[46ch] mt-8 text-silver font-terciaria text-body-lg lg:col-[8/-1] lg:self-end lg:mt-0 lg:pb-6"
            data-revelar
          >
            {conteudo.mapa.sub}
          </p>
        </div>

        <div className="semanas__caminho">
          {/* A regua (1 a 3, um passo por card): acende e apaga com a rolagem (RF-L11b). Cor nunca sozinha (RNF-L14): a
              semana acesa muda de PREENCHIMENTO, de vazado para cheio, e o numero muda de peso. */}
          <ol
            className="regua12 sticky top-0 z-2 bg-void pb-4 motion-reduce:static [counter-reset:semana] grid grid-cols-[repeat(3,1fr)] gap-x-2 gap-y-3 mt-12 pt-4 border-t border-line"
            role="list"
            aria-hidden="true"
          >
            {Array.from({ length: SEMANAS }, (_, i) => (
              <li className={SEMANA} key={i} data-acesa />
            ))}
          </ol>

          {/* Capa, nome, legenda: a anatomia do card de showcase. A capa e um bloco de superficie
              com o numero em escala de cartaz, no lugar do preview de video. */}
          <ol className="semanas__trilho flex flex-col gap-12 mt-16 lg:grid lg:grid-cols-[repeat(3,1fr)] lg:gap-x-8 lg:gap-y-16 lg:mt-24" role="list" ref={trilho}>
            {ESTADOS.map((estado, indice) => (
              <li className={`slide flex flex-col gap-3 ${DESCE[indice % 3]}`.trim()} key={estado.nome} data-semana={indice + 1} data-revelar>
                <div className="relative flex items-center justify-center aspect-4/3 bg-surface-1 border border-line-strong overflow-clip">
                  <span
                    className="text-bone font-secundaria font-extrabold uppercase tracking-[0.01em] leading-[0.86] tabular-nums text-[length:clamp(64px,22vw,132px)] lg:text-[length:clamp(72px,7vw,120px)]"
                    aria-hidden="true"
                  >
                    {estado.capa}
                  </span>
                  <span className="absolute left-4 bottom-4 text-silver font-secundaria text-overline uppercase" aria-hidden="true">
                    {estado.faixa}
                  </span>
                  <span className="sr-only">{estado.leitura}</span>
                </div>
                <h3 className="text-bone font-secundaria text-h3">{estado.nome}</h3>
                <p className="max-w-prose text-silver font-terciaria text-body lg:text-body-lg">{estado.texto}</p>
              </li>
            ))}
          </ol>
        </div>


        {/* Grade de numeros no layout da secao "Why us" do Nakula: fio a esquerda e regua de marcas
            no topo de cada coluna. */}
        <div className="semanas__mais flex flex-col gap-8 mt-16 pt-8 border-t border-line" data-revelar>
          <ul className="grid grid-cols-2 lg:grid-cols-4" role="list">
            {conteudo.mapa.numeros.map(({ valor, rotulo }) => (
              <li className="relative flex flex-col gap-8 border-l border-line px-6 pt-10 pb-6" key={rotulo}>
                {/* Regua de 13 marcas no topo da coluna. */}
                <span
                  className="absolute top-0 left-[5%] h-2 w-[90%] bg-[repeating-linear-gradient(90deg,var(--line)_0_1px,transparent_1px_calc((100%-1px)/12))]"
                  aria-hidden="true"
                />
                <p className="font-secundaria font-extrabold text-bone tabular-nums leading-[1.1] text-[length:clamp(56px,7vw,96px)]">{valor}</p>
                <p className="max-w-[16ch] text-bone font-secundaria text-body-lg">{rotulo}</p>
              </li>
            ))}
          </ul>

          <div className="self-start">
            <Botao posicao="mapa" />
          </div>
        </div>
      </div>
    </section>
  );
}
