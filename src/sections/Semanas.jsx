import { CampoDePontos } from "../components/CampoDePontos.jsx";
import { Fragment, useEffect, useRef } from "react";
import { Botao } from "../components/Botao.jsx";
import { Rotulo } from "../components/Rotulo.jsx";
import { conteudo } from "../conteudo.js";
import { revelar, revelarEmCascata, subirLinhas, useMovimento } from "../motion/index.js";
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
 * obrigatorias e 1 opcional sao o RF-T02. O capitulo 3 atual define o portao
 * por competencia em cada exercicio. Cinco etapas, nao cinco fases.
 *
 * A regua das doze semanas continua acendendo e apagando com a posicao da
 * pagina (RF-L11b), neste mapa. O trilho em fluxo mede os cards; a regua
 * sticky apenas exibe. Sob movimento reduzido ela nasce inteira acesa, porque
 * informa o caminho e informacao nao depende de animacao.
 */
// So os tres primeiros cards; a regua acompanha: um passo por card (1 a 3), e nao as doze semanas.
const ESTADOS = conteudo.mapa.estados.slice(0, 3);
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

function topoEmFluxo(elemento) {
  let topo = 0;
  for (let no = elemento; no; no = no.offsetParent) topo += no.offsetTop;
  return topo;
}

function marcosDasSemanas(trilho, altura) {
  const origem = topoEmFluxo(trilho);
  const marcos = Array.from(trilho.children, (card) => ({
    topo: topoEmFluxo(card) - origem,
    semana: Number(card.dataset.semana),
  }));
  // Se a grade alinhar cards, o grupo ocupa o seu trecho natural de leitura.
  // A ordem editorial permanece explícita, sem transformar colunas em novas etapas.
  for (let inicio = 0; inicio < marcos.length;) {
    let fim = inicio + 1;
    while (fim < marcos.length && marcos[fim].topo === marcos[inicio].topo) fim += 1;
    const topo = marcos[inicio].topo;
    const limite = marcos[fim]?.topo ?? trilho.offsetHeight;
    for (let indice = inicio + 1; indice < fim; indice += 1) {
      marcos[indice].topo = topo + (limite - topo) * (indice - inicio) / (fim - inicio);
    }
    inicio = fim;
  }
  const ultimo = marcos.at(-1);
  // O caminho está lido quando o fim do último card entra na tela, antes do CTA.
  marcos.push({ topo: Math.max(ultimo.topo, trilho.offsetHeight - altura / 2), semana: SEMANAS });
  return marcos;
}

function semanaNoTrilho(posicao, marcos) {
  if (posicao < marcos[0].topo) return 0;
  for (let indice = 0; indice < marcos.length - 1; indice += 1) {
    const inicio = marcos[indice];
    const fim = marcos[indice + 1];
    if (posicao >= fim.topo) continue;
    const proporcao = (posicao - inicio.topo) / (fim.topo - inicio.topo);
    return Math.floor(inicio.semana + proporcao * (fim.semana - inicio.semana));
  }
  return SEMANAS;
}

/**
 * Chegou na semana 12: o retangulo vermelho da ultima semana cresce ate engolir a propria regua
 * (so ela, o elemento de 1 a 12), o texto sobe em tinta no meio e, passada a leitura, a cortina se
 * ergue e devolve os numeros. E imagem, nao interface: a regua ja e `aria-hidden`. Devolve a
 * limpeza (cancela e remove, se a secao sair antes do fim).
 */
const FRASE = "Apenas faça";
const EXPO_IN_OUT = "cubic-bezier(0.76, 0, 0.24, 1)";
const EXPO_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";

function engolirRegua(semana) {
  const regua = semana.parentElement;
  const o = regua.getBoundingClientRect();
  const r = semana.getBoundingClientRect();
  // A origem e a marca de 6px da ultima semana, em coordenadas da propria regua.
  const esq = r.left - o.left;
  const dir = o.right - r.right;
  const topo = r.top - o.top;
  const base = o.height - topo - 6;
  const cobertura = document.createElement("div");
  cobertura.className = "absolute inset-0 z-1 flex items-center justify-center bg-acento text-void pointer-events-none overflow-clip";
  cobertura.setAttribute("aria-hidden", "true");
  const texto = document.createElement("p");
  // O corpo da frase cabe na regua: pela altura dela e, no celular, pela largura.
  const corpo = Math.min(o.height * 0.5, o.width / (FRASE.length * 0.62));
  texto.className = "flex justify-center gap-[0.3em] font-secundaria font-extrabold uppercase leading-none tracking-[0.02em] whitespace-nowrap";
  texto.style.fontSize = `${corpo}px`;
  const letras = [];
  for (const palavra of FRASE.split(" ")) {
    const bloco = document.createElement("span");
    bloco.className = "inline-flex overflow-clip pb-[0.2em] -mb-[0.2em]";
    for (const letra of palavra) {
      const el = document.createElement("span");
      el.className = "inline-block";
      el.textContent = letra;
      bloco.append(el);
      letras.push(el);
    }
    texto.append(bloco);
  }
  cobertura.append(texto);
  regua.append(cobertura);

  const fill = "both";
  const entra = cobertura.animate(
    [{ clipPath: `inset(${topo}px ${dir}px ${base}px ${esq}px)` }, { clipPath: "inset(0px 0px 0px 0px)" }],
    { duration: 800, easing: EXPO_IN_OUT, fill },
  );
  const anims = [entra];
  letras.forEach((el, i) => {
    anims.push(el.animate(
      [{ transform: "translateY(120%)" }, { transform: "translateY(0)" }],
      { duration: 650, delay: 550 + i * 40, easing: EXPO_OUT, fill },
    ));
  });
  const sai = 550 + letras.length * 40 + 650 + 1100; // a ultima letra assenta e a frase fica lida
  const fim = cobertura.animate(
    [{ clipPath: "inset(0px 0px 0px 0px)" }, { clipPath: "inset(0px 0px 100% 0px)" }],
    { duration: 700, delay: sai, easing: EXPO_IN_OUT, fill: "forwards" },
  );
  anims.push(fim);
  fim.onfinish = () => cobertura.remove();
  return () => { anims.forEach((a) => a.cancel()); cobertura.remove(); };
}

/** Estado local de leitura, medido no trilho que permanece no fluxo. */
function useSemanasDoTrilho(raiz, trilho) {
  useEffect(() => {
    const no = trilho.current;
    if (!no) return;
    const semanas = Array.from(raiz.current?.querySelectorAll(".regua12__semana") ?? []);
    const documento = document.documentElement;
    const viewport = window.visualViewport;
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)");
    let ativo = true;
    let quadro = 0;
    let ultimo = null;
    // Semana lida na medicao anterior; o engolir so dispara ao CHEGAR na 12 rolando, nunca ao
    // carregar a pagina ja depois dela, e so uma vez por visita.
    let anterior = null;
    let limparEngolir = null;
    const escrever = (acesas, atual) => {
      const estado = `${acesas}:${atual}`;
      if (estado === ultimo) return;
      ultimo = estado;
      for (const [indice, semana] of semanas.entries()) {
        semana.toggleAttribute("data-acesa", indice < acesas);
        semana.toggleAttribute("data-atual", indice === atual);
      }
    };
    const atualizar = () => {
      quadro = 0;
      if (!ativo) return;
      const leituraCompleta = reduzido.matches || documento.hasAttribute("data-pausado") ||
        !documento.classList.contains("movimento-pronto") ||
        documento.classList.contains("movimento-falhou");
      const caixa = no.getBoundingClientRect();
      if (leituraCompleta || caixa.height <= 0) {
        escrever(semanas.length, -1);
        anterior = SEMANAS;
        return;
      }
      const altura = Math.min(window.innerHeight, viewport?.height ?? window.innerHeight);
      const linhaDeLeitura = (viewport?.offsetTop ?? 0) + altura / 2;
      // Marcos reais: F1 começa em 1, F2 em 3, sessão opcional em 5,
      // portão e F3 em 9. A posição acompanha a leitura, nunca o calendário.
      const acesas = semanaNoTrilho(linhaDeLeitura - caixa.top, marcosDasSemanas(no, altura));
      escrever(acesas, acesas - 1);
      if (anterior !== null && anterior < SEMANAS && acesas >= SEMANAS && !limparEngolir) {
        limparEngolir = engolirRegua(semanas.at(-1));
      }
      anterior = acesas;
    };
    const agendar = () => {
      if (ativo && !quadro) quadro = requestAnimationFrame(atualizar);
    };
    const tamanho = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(agendar);
    tamanho?.observe(no);
    const movimento = typeof MutationObserver === "undefined" ? null : new MutationObserver(agendar);
    movimento?.observe(documento, { attributes: true, attributeFilter: ["class", "data-pausado"] });
    window.addEventListener("scroll", agendar, { passive: true });
    window.addEventListener("resize", agendar);
    window.addEventListener("orientationchange", agendar);
    window.addEventListener("pageshow", agendar);
    viewport?.addEventListener("resize", agendar);
    viewport?.addEventListener("scroll", agendar, { passive: true });
    reduzido.addEventListener("change", agendar);
    document.fonts?.ready.then(agendar);
    atualizar();
    return () => {
      ativo = false;
      cancelAnimationFrame(quadro);
      tamanho?.disconnect();
      movimento?.disconnect();
      window.removeEventListener("scroll", agendar);
      window.removeEventListener("resize", agendar);
      window.removeEventListener("orientationchange", agendar);
      window.removeEventListener("pageshow", agendar);
      viewport?.removeEventListener("resize", agendar);
      viewport?.removeEventListener("scroll", agendar);
      reduzido.removeEventListener("change", agendar);
      limparEngolir?.();
      escrever(semanas.length, -1);
    };
  }, [raiz, trilho]);
}

const NUMEROS = [
  { valor: 1, rotulo: "APP" },
  { valor: 3, rotulo: "PROTOCOLOS" },
  { valor: 12, rotulo: "SEMANAS" },
  { valor: 1, rotulo: "OBJETIVO" },
];

export function Semanas({ params }) {
  const raiz = useRef(null);
  const trilho = useRef(null);
  useSemanasDoTrilho(raiz, trilho);

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
            {NUMEROS.map(({ valor, rotulo }) => (
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
            <Botao params={params} posicao="mapa" />
          </div>
        </div>
      </div>
    </section>
  );
}
