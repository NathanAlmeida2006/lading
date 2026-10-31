import { CampoDePontos } from "../components/CampoDePontos.jsx";
import { Fragment, useRef } from "react";
import { Botao } from "../components/Botao.jsx";
import { ImagemReservada } from "../components/ImagemReservada.jsx";
import { Rotulo } from "../components/Rotulo.jsx";
import { conteudo } from "../conteudo.js";
import { revelar, revelarEmCascata, subirLinhas, useMovimento } from "../motion/index.js";
import { useReguaDoTrilho } from "../motion/regua.js";
import { bloco, camada, envelope, grade12, linha } from "../ui.js";

/**
 * O mapa do caminho, na forma da secao "Lenis runs the web" do lenis.dev.
 *
 * Lida ao vivo em 07/09/2026: um fio vertical a esquerda, o titulo gigante em
 * linhas quebradas a mao ao lado dele, e o paragrafo de tese deslocado para a
 * direita E para baixo. Abaixo, a grade de cards com capa, nome e legenda, em
 * ziguezague vertical: nenhum card alinha com o vizinho. Fecha com a grade de
 * numeros e o CTA.
 *
 * Um card por item de `conteudo.mapa.estados`: etiqueta, nome, texto e imagem.
 *
 * A regua acende e apaga com a posicao da pagina (RF-L11b): um passo por card.
 * O trilho em fluxo mede os cards; a regua fixa apenas exibe. Sob movimento
 * reduzido ela nasce inteira acesa, porque informa o caminho e informacao nao
 * depende de animacao.
 */
const ESTADOS = conteudo.mapa.estados;
// Um passo da regua por card.
const PASSOS = ESTADOS.length;
const LINHAS = conteudo.mapa.linhas;

/**
 * Um passo da regua: o ponto (::before) e o numero (::after, de um contador CSS).
 * Cor nunca sozinha (RNF-L14): aceso, o passo muda de PREENCHIMENTO e o numero de peso.
 */
const PASSO =
  "regua__passo [counter-increment:semana] flex flex-col gap-2 " +
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
// Largura real da imagem: o card (p-4, borda de 1px) menos 34; no lg e 1/3 da coluna (gap de 32), abaixo dele a coluna toda do envelope (cap de 720).
const SIZES = "(min-width: 1440px) 382px, (min-width: 1024px) 286px, (min-width: 720px) 654px, calc(100vw - 66px)";

export function Semanas() {
  const raiz = useRef(null);
  const trilho = useRef(null);
  useReguaDoTrilho(raiz, trilho, PASSOS, conteudo.mapa.frase);

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
        <div className={`relative mt-6 pl-6 lg:pl-8 ${grade12} before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-acento`}>
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
          {/* A regua (1 a 3, um passo por card): acende e apaga com a rolagem (RF-L11b). Cor nunca sozinha (RNF-L14): o passo
              aceso muda de PREENCHIMENTO, de vazado para cheio, e o numero muda de peso. */}
          <ol
            className="regua sticky top-0 z-2 bg-void pb-4 motion-reduce:static [counter-reset:semana] grid grid-cols-[repeat(3,1fr)] gap-x-2 gap-y-3 mt-12 pt-4 border-t border-line"
            role="list"
            aria-hidden="true"
          >
            {Array.from({ length: PASSOS }, (_, i) => (
              <li className={PASSO} key={i} data-acesa />
            ))}
          </ol>

          {/* Cada card: etiqueta (faixa e valor), nome, texto e imagem. */}
          <ol className="semanas__trilho flex flex-col gap-12 mt-16 lg:grid lg:grid-cols-[repeat(3,1fr)] lg:items-start lg:gap-x-8 lg:gap-y-16 lg:mt-24" role="list" ref={trilho}>
            {ESTADOS.map((estado, indice) => (
              <li
                className={`slide relative isolate flex flex-col gap-3 p-4 border border-line-strong bg-surface-1 ${DESCE[indice % 3]}`.trim()}
                key={estado.nome}
                data-passo={indice + 1}
                data-revelar
              >
                <div className="flex items-center justify-between text-overline font-secundaria uppercase" aria-hidden="true">
                  <span className="text-silver">{estado.faixa}</span>
                  <span className="text-acento tabular-nums">{estado.capa}</span>
                </div>
                <h3 className="text-bone font-secundaria text-h3">{estado.nome}</h3>
                <p className="max-w-prose text-silver font-terciaria text-body lg:text-body-lg">{estado.texto}</p>
                <ImagemReservada src={estado.src} sizes={SIZES} className={`aspect-11/6 ${estado.pos ?? ""}`} />
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
