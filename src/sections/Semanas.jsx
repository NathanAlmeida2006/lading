import { CampoDePontos } from "../components/CampoDePontos.jsx";
import { Fragment, useRef } from "react";
import { Botao } from "../components/Botao.jsx";
import { Rotulo } from "../components/Rotulo.jsx";
import { acenderEmSequencia, revelar, revelarEmCascata, subirLinhas, useMovimento } from "../motion/index.js";
import { bloco, camada, envelope, linha } from "../ui.js";

/**
 * As doze semanas, na forma da secao "Lenis runs the web" do lenis.dev.
 *
 * Lida ao vivo em 07/09/2026: um fio vertical a esquerda, o titulo gigante em
 * tres linhas quebradas a mao ao lado dele, e o paragrafo de tese deslocado
 * para a direita E para baixo, com um termo em acento no meio. Abaixo, a
 * grade de cards com capa, nome e legenda, em ziguezague vertical: nenhum
 * card alinha com o vizinho. Fecha com uma pergunta curta e o CTA.
 *
 * O que substitui o que: o odometro travado saiu. O numero grande dele nao
 * se perdeu, mudou de lugar - agora e a CAPA de cada card, que e o analogo do
 * preview de video do showcase. Um numero por card, cinco cards.
 *
 * Conteudo canonico, nao inventado (RF-L11a): as tres fases sao as do capitulo
 * do programa do draft de hipertrofia; as 12 semanas com 3 sessoes
 * obrigatorias e 1 opcional sao o RF-T02; o portao da fase 3 e o do glossario,
 * competencia e nao calendario. Cinco estados, nao doze.
 *
 * A regua das doze semanas continua acendendo e apagando com a posicao da
 * pagina (RF-L11b), agora no bloco do manifesto, onde ela e a linha do tempo
 * do plano inteiro. Sob movimento reduzido ela nasce inteira acesa, porque
 * informa o caminho e informacao nao depende de animacao.
 */
const SEMANAS = 12;

const ESTADOS = [
  {
    capa: "1e2",
    leitura: "semanas 1 e 2",
    faixa: "semanas",
    nome: "Fase 1 · Aprender",
    texto: "Duas séries, topo da faixa, três repetições no tanque. Você calibra o placar antes de disputar ele.",
  },
  {
    capa: "3a8",
    leitura: "semanas 3 a 8",
    faixa: "semanas",
    nome: "Fase 2 · Construir",
    texto:
      "Três séries, faixa cheia. A Regra do 12 decide quando o peso sobe. É onde os números começam a contar história.",
  },
  {
    capa: "05",
    leitura: "semana 5",
    faixa: "semana",
    nome: "A quarta sessão",
    texto: "Se as três obrigatórias estão acontecendo com folga, a quarta entra. Opcional, nunca cobrada.",
  },
  {
    capa: "09",
    leitura: "semana 9",
    faixa: "semana",
    nome: "O portão",
    texto:
      "O portão da fase 3 olha a sua ficha, não a data. Passou, troca. Não passou, repete daqui a duas semanas, sem drama.",
  },
  {
    capa: "9a12",
    leitura: "semanas 9 a 12",
    faixa: "semanas",
    nome: "Fase 3 · Consolidar",
    texto: "Mesmas três séries, com duas trocas planejadas. Não é variedade por tédio: é a formatura.",
  },
];

const LINHAS = ["Doze semanas", "já estão", "escritas"];

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
  "data-acesa:after:text-bone data-acesa:after:font-bold motion-reduce:after:text-bone";

/**
 * Os cards em ziguezague: tres por linha no monitor, e o do meio desce uma
 * capa. Nenhum card alinha com o vizinho, que e o que faz a grade ler como
 * composicao. A posicao sai do indice, e nao de `nth-child`.
 */
const DESCE = ["", "lg:mt-24", "lg:mt-48"];

export function Semanas({ params }) {
  const raiz = useRef(null);

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
    const anim = acenderEmSequencia(no.querySelectorAll(".regua12__semana"), no);
    revelarEmCascata(no.querySelectorAll(".slide"), { intervalo: 80 });
    revelar(no.querySelector(".semanas__mais"));
    return () => anim?.revert?.();
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
            className="semanas__titulo flex flex-col text-bone font-secundaria font-extrabold uppercase tracking-[0.01em] leading-[0.86] tabular-nums text-[length:clamp(44px,21vw,96px)] lg:col-[1/span_8] lg:text-[length:clamp(72px,8.5vw,124px)]"
            data-revelar
          >
            {LINHAS.map((texto) => (
              <Fragment key={texto}>
                <span className={linha}>
                  <span className={`linha__texto block ${camada}`}>{texto}</span>
                </span>{" "}
              </Fragment>
            ))}
          </h2>

          <p
            className="semanas__tese max-w-[46ch] mt-8 text-silver font-terciaria text-body-lg lg:col-[8/-1] lg:self-end lg:mt-0 lg:pb-6"
            data-revelar
          >
            Três sessões por semana, mais uma opcional. A{" "}
            <strong className="text-acento font-semibold">Regra do 12</strong> decide quando o peso sobe, o{" "}
            <strong className="text-acento font-semibold">portão da fase 3</strong> decide quando o exercício
            muda, e nenhum dos dois pergunta como você está se sentindo hoje.
          </p>
        </div>

        {/* A regua das doze semanas: acende e apaga com a rolagem (RF-L11b). Duas linhas de seis
            no celular; doze numa linha a 360px nao cabe legivel. Cor nunca sozinha (RNF-L14): a
            semana acesa muda de PREENCHIMENTO, de vazado para cheio, e o numero muda de peso. */}
        <ol
          className="[counter-reset:semana] grid grid-cols-[repeat(6,1fr)] sm:grid-cols-[repeat(12,1fr)] gap-x-2 gap-y-3 mt-12 pt-6 border-t border-line"
          role="list"
          aria-hidden="true"
        >
          {Array.from({ length: SEMANAS }, (_, i) => (
            <li className={SEMANA} key={i} />
          ))}
        </ol>

        {/* Capa, nome, legenda: a anatomia do card de showcase. A capa e um bloco de superficie
            com o numero em escala de cartaz, no lugar do preview de video. */}
        <ol className="flex flex-col gap-12 mt-16 lg:grid lg:grid-cols-[repeat(3,1fr)] lg:gap-x-8 lg:gap-y-16 lg:mt-24" role="list">
          {ESTADOS.map((estado, indice) => (
            <li className={`slide flex flex-col gap-3 ${DESCE[indice % 3]}`.trim()} key={estado.nome} data-revelar>
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

        <div className="semanas__mais flex flex-col items-start gap-6 mt-16 pt-8 border-t border-line lg:flex-row lg:items-center lg:justify-between lg:gap-8" data-revelar>
          <p className="max-w-[24ch] lg:max-w-[32ch] text-bone font-secundaria text-h2 uppercase">
            A semana 1 começa no dia em que o arquivo chega.
          </p>
          <Botao params={params} posicao="mapa" />
        </div>
      </div>
    </section>
  );
}
