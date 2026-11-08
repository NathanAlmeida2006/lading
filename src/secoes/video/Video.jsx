import { useEffect, useRef, useState } from "react";
import { CampoDePontos } from "../../componentes/visuais/CampoDePontos.jsx";
import { aquecerFluido } from "../../componentes/visuais/FundoFluido.jsx";
import { Pontas } from "../../componentes/visuais/FundoCapa.jsx";
import { criarSom, prepararSom } from "./som.js";
import { useLinhaDoTempo } from "./agenda.js";
import { BATIDA_FACA, DROP, ESTAGIOS, FIM_DA_MUSICA, LINHA, batida } from "./tempo.js";
import { bloco, envelope } from "../../app/ui.js";

/** O botao de play da secao de video. */
const botaoDoPlay =
  "group relative [--u:min(1svh,1.7vw)] grid place-items-center size-40 lg:size-64 rounded-full bg-acento " +
  "before:content-[''] before:absolute before:inset-0 before:rounded-full before:border-2 before:border-acento " +
  "motion-safe:before:animate-anel text-void transition-transform duration-(--motion-fast) hover:scale-105 " +
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bone " +
  "data-tocando:before:hidden data-tocando:pointer-events-none z-3";

/**
 * Secao de video, codigo puro: tela cheia, fundo preto e o play no meio. O clique toca um som e abre
 * a introducao: um unico circulo vermelho sai do play e cobre a secao, e o triangulo preto do play vira um L
 * enorme (Big Shoulders) e o "ithium" sobe na vertical, alinhado ao topo e a direita do L. As proximas partes do video entram depois, sobre esse vermelho.
 * Sob movimento reduzido nao ha circulo: o fundo vai direto ao vermelho.
 */
export function Video() {
  const [tocando, definirTocando] = useState(false);
  const [estagio, definirEstagio] = useState(-1);
  const [coberto, definirCoberto] = useState(false); // o circulo vermelho ja cobriu a secao: a malha e as pontas dela, atras dele, deixam de ser desenhadas
  const [rodada, definirRodada] = useState(0); // cada repeticao remonta o play e o circulo, para as animacoes recomecarem
  const [modulo, definirModulo] = useState(null); // o modulo do palco; se a carga falhar, o video fica no vermelho e a pagina segue
  const carregar = () => import("./Palco.jsx").then((m) => { definirModulo(m); return m; });
  const tempo = useLinhaDoTempo(definirEstagio);
  const origem = useRef(0);
  const som = useRef(null);
  const agenda = useRef({}); // a hora (performance.now) em que cada estagio devia entrar: quem anima por dentro conta dela, e nao de quando montou
  const velocidade = useRef(undefined); // a da rolagem da Trilha: o Registro anda na mesma velocidade
  const secao = useRef(null);
  useEffect(() => () => { som.current?.parar(200); }, []);

  // Perto de aparecer na tela, desce o palco, para o primeiro corte nao depender da rede; a musica so desce com a intencao de tocar.
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { carregar().catch(() => {}); obs.disconnect(); } }, { rootMargin: "800px 0px" });
    obs.observe(secao.current);
    return () => obs.disconnect();
  }, []);

  const tocar = (repetindo = false) => {
    if (tocando && !repetindo) return;
    tempo.parar();
    som.current?.parar(250);
    if (repetindo) { definirEstagio(-1); definirCoberto(false); definirRodada((r) => r + 1); }
    const s = (som.current = criarSom());
    s.musica(DROP); // o fade-in sobe, suave, ate o drop
    s.efeito(batida(BATIDA_FACA));
    s.apagarEm(batida(FIM_DA_MUSICA.batida), FIM_DA_MUSICA.duracao);
    carregar().then((m) => m.prepararModelos()).catch(() => {});
    const t0 = performance.now();
    origem.current = t0;
    definirTocando(true);
    // Cada estagio entra na sua batida, no relogio do clique (nenhum depende de a rolagem acabar).
    Object.assign(agenda.current, tempo.iniciar(LINHA, t0));
    // A tela fica parada entre o fim do circulo e o L, que so anda aos 1500 ms.
    tempo.depois(800, aquecerFluido);
  };

  // Da carga em diante tudo o que entra cobre a secao: o play (o L e o "ithium") e o vermelho que ficam atras nao tem mais o que
  // mostrar, e qualquer quadro em que uma tela ainda nao pintou (celular lento) deixava a logo aparecer. Escondidos, so sobra o escuro.
  const encoberto = estagio >= ESTAGIOS.carga;
  return (
    <section id="video" ref={secao} className={`${bloco} flex flex-col justify-center min-h-svh py-16 md:py-24`}>
      {/* A malha de pontos do player, atras de tudo; as pontas e o circulo do clique ficam por cima dela. */}
      {!coberto && <CampoDePontos />}
      {/* Os triangulos que surgem e somem, atras do play (z-1); o circulo vermelho do clique (z-2) os cobre. Sob movimento reduzido nao ha circulo nem evento: seguem montados (e parados). */}
      {!coberto && <Pontas camada="z-1" />}
      <div className={envelope}>
        <div className="grid place-items-center">
          <button
            type="button"
            key={rodada}
            className={`${botaoDoPlay}${encoberto ? " invisible" : ""}`}
            aria-label="Reproduzir vídeo"
            data-tocando={tocando ? "" : undefined}
            onClick={() => tocar()}
            onPointerEnter={prepararSom}
            onFocus={prepararSom}
          >
            <span
              className="block w-1/2 h-1/2 bg-current [clip-path:polygon(35%_17%,62%_33.5%,89%_50%,62%_66.5%,35%_83%,35%_50%)] group-data-tocando:animate-letra motion-reduce:[animation-delay:0ms]"
              aria-hidden="true"
            />
            <span
              className="absolute right-[calc(50%-15*var(--u))] top-[calc(50%-31*var(--u)-0.12em)] rotate-180 [writing-mode:vertical-rl] font-secundaria font-extrabold uppercase leading-[0.75] tracking-[0.12em] text-[length:calc(15.2*var(--u))]"
              aria-hidden="true"
            >
              {[..."ithium"].map((letra, i) => (
                <span className="ithium-letra opacity-0 group-data-tocando:animate-ithium-letra" style={{ animationDelay: `${2300 + i * 55}ms` }} key={i}>{letra}</span>
              ))}
            </span>
            {tocando && <span className="absolute inset-0 rounded-full border-2 border-bone motion-safe:animate-onda pointer-events-none" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {tocando && <div className={`absolute inset-0 z-2 pointer-events-none ${encoberto ? "bg-void" : "bg-acento"} motion-safe:animate-corte`} aria-hidden="true" onAnimationEnd={() => definirCoberto(true)} key={rodada} />}

      {tocando && modulo && <modulo.default estagio={estagio} agenda={agenda} origem={origem} velocidade={velocidade} aoRepetir={() => tocar(true)} />}
    </section>
  );
}
