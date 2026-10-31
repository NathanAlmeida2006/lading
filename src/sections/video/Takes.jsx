import { useEffect, useRef, useState } from "react";
import { Botao } from "../../components/Botao.jsx";
import { CampoDePontos } from "../../components/CampoDePontos.jsx";
import { FundoFluido } from "../../components/FundoFluido.jsx";
import { Modelo3D } from "./Modelo3D.jsx";
import { Moldura } from "../../components/Moldura.jsx";
import { conteudo } from "../../conteudo.js";
import { doisDigitos, vazado } from "../../ui.js";
import { BATIDA, OBJETOS_3D, atraso } from "./tempo.js";

/**
 * Os takes que fecham o video, depois da logo (cada um dura um numero inteiro de batidas: o manifesto 8, os numeros 6, o
 * calendario 6, o arsenal 6; o ultimo fica). Cada um e uma camada de tela cheia (z-4), toda em CSS (as animacoes
 * `bate`, `cresce`, `entra-lado`, `roleta` e `marca` estao em styles/residual.css) e com o texto do proprio
 * site: o manifesto da dobra, os numeros do mapa, o checklist integrado, o que o Lithium entrega e o fechamento. Nenhum
 * take mostra preco. Sob movimento reduzido nada anima e cada take ja mostra o seu estado final.
 */
const PAGINA = "absolute inset-0 z-4 overflow-clip [--respiro:24px] md:[--respiro:48px] font-secundaria font-extrabold uppercase";
const MIOLO = "relative mx-auto flex h-full w-full max-w-[1080px] flex-col justify-center px-(--respiro)";

/** A malha de pontos sobre o vermelho do take: pontos e fio num tom abaixo do --acento, e o ponto raro em preto. */
const MALHA_VERMELHA = { ponto: "#7d0e18", fio: "#a5121e", acento: "#09090b" };

/** Uma pancada: a palavra chega grande e assenta, no `atraso` ms. */
const bate = (atraso, classe = "") => ({ className: `block motion-safe:animate-bate ${classe}`.trim(), style: { animationDelay: `${atraso}ms` } });

/** O quadro de um take: comeca em 0 e sobe 1 a cada tempo de `tempos` (ms depois de `inicioEm`, a hora em que o estagio devia entrar). */
function useQuadros(inicioEm, tempos) {
  const [quadro, definirQuadro] = useState(0);
  useEffect(() => {
    const relogios = tempos.map((ms, k) => setTimeout(() => definirQuadro(k + 1), atraso(inicioEm, ms)));
    return () => relogios.forEach(clearTimeout);
  }, []);
  return quadro;
}

/**
 * Take 1, o manifesto, em dois quadros: o preto, com "O feed esconde quem usa bomba." batendo palavra a palavra, e a
 * "bomba" em vermelho; e, em corte seco aos 1,3 s, o vermelho, com "Natural" e "Cresce." crescendo do pequeno ao tamanho cheio.
 */
export function TakeManifesto({ inicioEm }) {
  const quadro = useQuadros(inicioEm, [4 * BATIDA]);

  if (quadro === 0) {
    return (
      <div className={`${PAGINA} bg-void text-bone`} aria-hidden="true">
        <FundoFluido />
        <div className={`${MIOLO} text-[length:min(calc((100vw-48px)/3.7),calc((100svh-160px)/4.3),200px)] leading-[1.04] tracking-[0.01em]`}>
          <p {...bate(0)}>O feed</p>
          <p {...bate(BATIDA / 2)}>esconde</p>
          <p {...bate(BATIDA)}>quem usa</p>
          <p className="w-fit text-acento">
            <span {...bate(1.5 * BATIDA)}>bomba.</span>
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className={`${PAGINA} bg-acento text-void`} aria-hidden="true">
      <CampoDePontos cores={MALHA_VERMELHA} />
      <div className={MIOLO}>
        <p className="text-[length:min(calc((100vw-48px)/3.6),calc((100svh-200px)/2.8),220px)] leading-[1.04] tracking-[0.01em]">
          <span {...bate(0)}>Natural</span>
          <span className="block origin-bottom-left motion-safe:animate-cresce" style={{ animationDelay: `${BATIDA}ms` }}>Cresce.</span>
        </p>
        <p className="mt-6 max-w-[34ch] font-terciaria text-body-lg font-normal normal-case motion-safe:animate-revelar" style={{ "--atraso": `${3 * BATIDA}ms` }}>{conteudo.dobra.promessa.texto}</p>
      </div>
    </div>
  );
}

/** Uma roleta de numero: cada digito e uma coluna que gira e para no valor, uma a uma (o caca-niquel). */
function Roleta({ valor, atraso }) {
  return (
    <span className="inline-flex h-[1em] overflow-clip leading-none tabular-nums" role="img" aria-label={String(valor)}>
      {[...String(valor)].map((digito, i) => {
        const final = (2 + i) * 10 + Number(digito);
        return (
          <span className="block h-[1em] w-[0.47em] overflow-clip text-center" key={i}>
            <span className="flex flex-col motion-safe:animate-roleta" style={{ "--final": final, animationDelay: `${atraso + i * 90}ms` }}>
              {Array.from({ length: final + 1 }, (_, k) => <span className="block h-[1em] leading-[1em]" key={k}>{k % 10}</span>)}
            </span>
          </span>
        );
      })}
    </span>
  );
}

/** Take 2, os numeros do mapa (1 app, 3 protocolos, 12 semanas, 1 objetivo): quatro linhas que entram de lados alternados e rolam ate o valor. */
export function TakeNumeros() {
  return (
    <div className={`${PAGINA} bg-void text-bone`} aria-hidden="true">
      <div className={`${MIOLO} !justify-stretch`}>
        {conteudo.mapa.numeros.map(({ valor, rotulo }, i) => (
          <div
            className="flex flex-1 items-center justify-between gap-4 border-t border-line-strong motion-safe:animate-entra-lado"
            style={{ "--lado": i % 2 ? 1 : -1, animationDelay: `${i * BATIDA}ms` }}
            key={rotulo}
          >
            <span className={`text-[length:min(calc(100svh/6),32vw)] leading-none tracking-[0.01em] ${valor === conteudo.mecanismo.semanas ? "text-acento" : ""}`}>
              <Roleta valor={valor} atraso={i * BATIDA + 120} />
            </span>
            <span className="text-right text-[length:min(5svh,7vw)] leading-none tracking-[0.04em] text-silver">{rotulo}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const DIAS = Array.from({ length: 31 }, (_, i) => i + 1);
const SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];
const LEGENDA = [["Treino", "var(--rubro)"], ["Dieta", "var(--praga)"], ["Sono", "var(--vigilia)"]];

/**
 * Take 3, "a disciplina visivel": o calendario de um mes (outubro de 2026, que comeca numa quinta) se preenchendo em onda,
 * cada dia acendendo no acento e assentando com as tres marcas dos protocolos (treino, dieta e sono), como o do app.
 */
export function TakeCalendario() {
  return (
    <div className={`${PAGINA} bg-void text-bone`} aria-hidden="true">
      <CampoDePontos />
      <div className={`${MIOLO} gap-4`}>
        <p className="font-secundaria text-overline tracking-[0.08em] text-silver">(disciplina visível)</p>
        <h2 className="text-[length:min(calc((100vw-48px)/4.2),calc((100svh-120px)/10.5),110px)] leading-[1.04] tracking-[0.01em]">
          <span className={`block ${vazado}`}>Disciplina</span>
          <span className="block">visível.</span>
        </h2>
        <div className="w-full max-w-[min(100%,calc((100svh-330px)*7/6))]">
          <div className="mb-1 grid grid-cols-7 gap-1 text-center font-terciaria text-caption font-normal text-silver">{SEMANA.map((d, i) => <span key={i}>{d}</span>)}</div>
          <ol className="grid grid-cols-7 gap-1" role="list">
            {Array.from({ length: 4 }, (_, i) => <li key={`v${i}`} />)}
            {DIAS.map((dia, i) => (
              <li
                className="relative flex aspect-square flex-col justify-between border border-line bg-surface-1 p-1 font-terciaria text-caption font-normal tabular-nums motion-safe:animate-marca"
                style={{ animationDelay: `${(i + 4) * 57}ms` }}
                key={dia}
              >
                <span className="text-silver">{dia}</span>
                <span className="flex gap-[3px]">{LEGENDA.map(([nome, cor]) => <i className="size-1.5" style={{ background: cor }} key={nome} />)}</span>
              </li>
            ))}
          </ol>
        </div>
        <p className="max-w-[40ch] font-terciaria text-body normal-case font-normal text-silver motion-safe:animate-revelar" style={{ "--atraso": `${4 * BATIDA}ms` }}>
          Você bate o olho e marca o que já executou no dia.
        </p>
      </div>
    </div>
  );
}

/**
 * O que o Lithium entrega (a pilha de valor do site, sem os valores): cada item ocupa a tela inteira por uma batida,
 * numa pancada, com a cor do protocolo no fundo (a mesma das capas) e a contagem "01/06" no canto.
 */
const ARSENAL = [
  { rotulo: "Protocolo", linhas: ["Hipertrofia"], fundo: "var(--rubro)", tinta: "var(--void)" },
  { rotulo: "Protocolo", linhas: ["Dieta"], fundo: "var(--praga)", tinta: "var(--void)" },
  { rotulo: "Protocolo", linhas: ["Sono"], fundo: "var(--vigilia)", tinta: "var(--void)" },
  { rotulo: "Mentalidade", linhas: ["Social", "Vibe"], fundo: "var(--bone)", tinta: "var(--void)" },
  { rotulo: "Disciplina", linhas: ["Checklist", "Integrado"], fundo: "var(--rubro)", tinta: "var(--void)" },
  { rotulo: "No seu celular", linhas: ["App", "Exclusivo"], fundo: "var(--void)", tinta: "var(--bone)" },
];

/** Take 4, o arsenal: os seis itens em seis pancadas, uma por tela, em cortes secos. */
export function TakeArsenal({ inicioEm }) {
  const i = useQuadros(inicioEm, ARSENAL.slice(1).map((_, k) => (k + 1) * BATIDA));
  const { rotulo, linhas, fundo, tinta } = ARSENAL[i];
  return (
    <div className={PAGINA} style={{ background: fundo, color: tinta }} aria-hidden="true" key={i}>
      <div className={MIOLO}>
        <p className="absolute left-(--respiro) top-6 font-secundaria text-overline tracking-[0.08em] opacity-70">({doisDigitos(i + 1)}/{doisDigitos(ARSENAL.length)})</p>
        <p className="mb-2 text-[length:min(4.4svh,7vw)] leading-none tracking-[0.04em] opacity-75 motion-safe:animate-revelar">{rotulo}</p>
        <p className="text-[length:min(calc((100vw-48px)/5.2),calc((100svh-160px)/2.5),230px)] leading-[1.04] tracking-[0.01em]">
          {linhas.map((l, k) => <span {...bate(k * 70)} key={l}>{l}</span>)}
        </p>
      </div>
    </div>
  );
}

/**
 * Take 5, o fechamento ("Apenas faca."), o ultimo e o que fica: a headline do fechamento do site em escala de cartaz, a
 * primeira linha em contorno e a segunda cheia, batendo, com os cantos se desenhando e o botao do site (sem preco) e, depois, o de replay (`aoRepetir`).
 */
export function TakeFaca({ aoRepetir, replayEm }) {
  const replay = useQuadros(undefined, [replayEm]) > 0;
  const [primeira, segunda] = conteudo.fechamento.headline.linhas;
  return (
    <div className={`${PAGINA} bg-void text-bone`}>
      <FundoFluido />
      <Moldura entrada="css" />
      <p className="absolute left-(--respiro) top-6 font-secundaria text-overline tracking-[0.08em] text-silver motion-safe:animate-revelar">(o caminho começa aqui)</p>
      <p className="absolute bottom-6 left-(--respiro) font-secundaria text-overline tracking-[0.08em] text-silver motion-safe:animate-revelar [--atraso:600ms]">({conteudo.mecanismo.semanas} semanas · treino, dieta e sono · app exclusivo)</p>
      <div className={`${MIOLO} items-start`}>
        <h2 className="text-[length:min(calc((100vw-48px)/3.3),calc((100svh-260px)/2.4),240px)] leading-[1.04] tracking-[0.01em]">
          <span {...bate(0, vazado)}>{primeira}</span>
          <span {...bate(180)}>{segunda}</span>
        </h2>
        <div className="mt-8 w-full motion-safe:animate-revelar [--atraso:600ms]">
          <Botao posicao="video" />
        </div>
        {/* O replay, escondido (e ocupando o lugar, para nada pular) ate `replayEm` ms, 2 s depois de a musica parar: recomeca o video do play, e o clique vale como o gesto que o audio pede. */}
        <button
          type="button"
          className={`${replay ? "motion-safe:animate-surgir" : "invisible"} mt-4 inline-flex min-h-12 items-center gap-3 border border-line-strong px-5 py-3 font-secundaria text-label uppercase tracking-[0.04em] text-bone transition-[background,color] duration-(--motion-fast) hover:bg-bone hover:text-void focus-visible:bg-bone focus-visible:text-void`}
          onClick={aoRepetir}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
          Assistir de novo
        </button>
      </div>
    </div>
  );
}

/** O giro de todos: de frente (como o L chato do play) por 0,25 s e depois acelerando, o mesmo giro de um objeto para o outro. */
const girar = (t) => [0, t < 0.25 ? 0 : Math.pow(t - 0.25, 1.7) * 3.2, 0];

/**
 * Take A (6 batidas), o L em 3D: no drop, o L chato do play vira, em corte seco no mesmo lugar e no mesmo vermelho, o L do app em
 * arestas, de frente, que comeca a girar; da batida 2 em diante, a cada meia batida, o objeto troca pelos outros 3D do app (raio,
 * engrenagem, espada, medalha, relogio, perfil, cruz), todos no mesmo giro, e a ultima batida e o "lithium" em 3D, que fica ate o corte.
 */
export function TakeL3D({ inicioEm }) {
  const i = useQuadros(inicioEm, [2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5].map((b) => b * BATIDA));
  const inicio = useRef(performance.now()); // o giro e um so, do inicio do take: segue de um objeto para o outro
  return (
    <div className={`${PAGINA} flex items-center justify-center bg-acento [--u:min(1svh,1.7vw)]`} aria-hidden="true">
      <Modelo3D
        modelo={OBJETOS_3D[i]}
        cor="#09090b"
        origem={inicio.current}
        pose={girar}
        flutua={false}
        className={`${i === OBJETOS_3D.length - 1 ? "h-[calc(60*var(--u))] w-[calc(150*var(--u))]" : "h-[calc(80*var(--u))] w-[calc(80*var(--u))]"} max-w-full motion-safe:animate-batida`}
        key={i}
      />
    </div>
  );
}

// As anilhas do take da carga, da maior (a de dentro) a menor, e a cor de cada uma.
const ANILHAS = [{ h: 92, w: 16, cor: "var(--bone)" }, { h: 80, w: 14, cor: "var(--bone)" }, { h: 66, w: 12, cor: "var(--acento)" }, { h: 52, w: 10, cor: "var(--acento)" }];
// Cada placa e deslocada da anterior pela largura dela mais 3.
const placas = ANILHAS.map((a, k) => ({ ...a, k, dx: ANILHAS.slice(0, k).reduce((soma, b) => soma + b.w + 3, 0) }));

/**
 * Take B (4 batidas), a carga: uma barra de musculacao vista de lado recebe uma anilha de cada lado por batida, da maior a menor,
 * cada uma caindo com uma pancada. O nome e o da sessao 05 da trilha do app, "Progressao no piloto automatico": e o que a barra
 * mostra (a carga que sobe sozinha).
 */
export function TakeCarga() {
  return (
    <div className={`${PAGINA} text-bone`} aria-hidden="true">
      <div className={`${MIOLO} gap-6`}>
        <p className="font-secundaria text-overline tracking-[0.08em] text-silver">(sessão 05 · hipertrofia)</p>
        <h2 className="text-[length:min(calc((100vw-48px)/4.6),calc((100svh-340px)/5.6),150px)] leading-[1.04] tracking-[0.01em]">
          <span {...bate(0)}>Progressão</span>
          <span {...bate(BATIDA, "text-acento")}>no piloto</span>
          <span {...bate(1.5 * BATIDA)}>automático</span>
        </h2>
        <svg viewBox="0 0 400 100" className="w-full max-w-[min(1000px,calc((100svh-420px)*4))] overflow-visible" role="presentation">
          <rect x="6" y="47" width="388" height="6" fill="var(--silver)" />
          <rect x="176" y="43" width="48" height="14" fill="var(--line-strong)" />
          {[-1, 1].map((lado) => placas.map(({ h, w, cor, k, dx }) => (
            <rect
              className="origin-center [transform-box:fill-box] motion-safe:animate-placa"
              style={{ animationDelay: `${k * BATIDA}ms` }}
              x={lado < 0 ? 168 - dx - w : 232 + dx}
              y={50 - h / 2}
              width={w}
              height={h}
              fill={cor}
              key={`${lado}${k}`}
            />
          )))}
        </svg>
      </div>
    </div>
  );
}
