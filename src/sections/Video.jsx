import { useEffect, useRef, useState } from "react";
import { AppRegistro } from "../components/AppRegistro.jsx";
import { AppTrilha } from "../components/AppTrilha.jsx";
import { CampoDePontos } from "../components/CampoDePontos.jsx";
import { Pontas } from "../components/FundoCapa.jsx";
import { CapaDaSessao } from "../components/CapaDaSessao.jsx";
import { LogoLithium } from "../components/LogoLithium.jsx";
import { preparar } from "../components/Modelo3D.jsx";
import { criarSom, prepararSom } from "./som.js";
import { OBJETOS_3D, TakeArsenal, TakeCalendario, TakeCarga, TakeFaca, TakeL3D, TakeManifesto, TakeNumeros } from "./Takes.jsx";
import { BATIDA, DROP, batida } from "./tempo.js";
import { bloco, envelope } from "../ui.js";

// As capas, todas em corte seco (sem transicao nem animacao) e estaticas: so o objeto 3D muda (e flutua livre, num giro so que segue de uma para a outra, `origem`). As tres primeiras sao a
// capa da primeira sessao de cada trilha do app Lithium (`leituras` e o numero de leituras da sessao 01 no catalogo do app); as tres
// seguintes sao o painel com que abrem as abas da EU (Semana, Corpo e Social Vibe), sem botao nem numeros e sem os menus do app.
const SESSAO = ["Sua primeira", "vitória"];
const VERMELHO = { acento: "var(--rubro)", cor: "#d2202c", sobre: "#fff" };
const CORTES = [
  { kicker: "Hipertrofia · sessão 01", linhas: SESSAO, modelo: "haltere", ...VERMELHO, leituras: 3 },
  { kicker: "Dieta básica · sessão 01", linhas: SESSAO, modelo: "maca", acento: "var(--praga)", cor: "#12a150", sobre: "#09090b", leituras: 2 },
  { kicker: "Cuidado com o sono · sessão 01", linhas: SESSAO, modelo: "meia-lua", acento: "var(--vigilia)", cor: "#8b5cf6", sobre: "#09090b", leituras: 1 },
  { kicker: "semana", linhas: ["Semana"], modelo: "medalha", ...VERMELHO, acao: false },
  { kicker: "corpo", linhas: ["Corpo"], modelo: "perfil", ...VERMELHO, acao: false },
  { kicker: "social vibe", linhas: ["Social", "Vibe"], modelo: "raio", ...VERMELHO, acao: false },
];

/**
 * Os estagios do video, na ordem: o L em 3D, a carga, as tres capas, a Trilha, o Registro, a mascara da logo, os quatro quadros
 * da logo e os takes finais.
 */
const N = CORTES.length;
const E = { l3d: 0, carga: 1, capa: 2, trilha: 2 + N, registro: 3 + N, mascara: 4 + N, logo: 5 + N, manifesto: 9 + N, numeros: 10 + N, calendario: 11 + N, arsenal: 12 + N, faca: 13 + N };

/**
 * A linha do tempo, em batidas contadas do drop da musica (tempo.js): [batida, estagio]. O drop abre o L em 3D (6 batidas) e
 * a carga (4); cada capa (as tres sessoes e as tres abas da EU) dura 1 batida (0,5 s); a Trilha e o Registro, 2 (1 s); o Registro vira recheio da
 * logo na batida 19 (a mascara leva 2) e segura 1; a logo bate quatro vezes, uma por batida; os takes finais duram 8, 6, 6 e 6
 * batidas; o ultimo fica, e a musica se apaga a partir da entrada dele (5,5 s).
 */
const BATIDA_FACA = 52; // o ultimo take ("Apenas faca.") entra na batida 52
const LINHA = [[0, E.l3d], [6, E.carga], ...CORTES.map((_, i) => [10 + i, E.capa + i]), [16, E.trilha], [18, E.registro], [19, E.mascara], [22, E.logo], [23, E.logo + 1], [24, E.logo + 2], [25, E.logo + 3], [26, E.manifesto], [34, E.numeros], [40, E.calendario], [46, E.arsenal], [BATIDA_FACA, E.faca]];
const FIM_DA_MUSICA = { batida: BATIDA_FACA, duracao: 5500 }; // a musica comeca a se apagar quando o ultimo take entra e some em 5,5 s (1,5 s a menos que antes)
const REPLAY_APOS = 2000; // o botao de replay surge 2 s depois de a musica parar

/**
 * Secao de video, codigo puro: tela cheia, fundo preto e o play no meio. O clique toca um som e abre
 * a introducao: um unico circulo vermelho sai do play e cobre a secao, e o triangulo preto do play vira um L
 * enorme (Big Shoulders) e o "ithium" sobe na vertical, alinhado ao topo e a direita do L. As proximas partes do video entram depois, sobre esse vermelho.
 * Sob movimento reduzido nao ha circulo: o fundo vai direto ao vermelho.
 */
export function Video() {
  const [tocando, setTocando] = useState(false);
  const [corte, setCorte] = useState(-1);
  const [rodada, setRodada] = useState(0); // cada repeticao remonta o play e o circulo, para as animacoes recomecarem
  const relogios = useRef([]);
  const origem = useRef(0);
  const som = useRef(null);
  const agenda = useRef({}); // a hora (performance.now) em que cada estagio devia entrar: quem anima por dentro conta dela, e nao de quando montou
  const velocidade = useRef(undefined); // a da rolagem da Trilha: o Registro anda igual (o match cut)
  const secao = useRef(null);
  useEffect(() => () => { relogios.current.forEach(clearTimeout); som.current?.parar(200); }, []);

  // Perto de aparecer na tela, baixa a musica (1,4 MB) para ela tocar no instante do clique.
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { prepararSom(); obs.disconnect(); } }, { rootMargin: "800px 0px" });
    obs.observe(secao.current);
    return () => obs.disconnect();
  }, []);

  const tocar = (repetindo = false) => {
    if (tocando && !repetindo) return;
    relogios.current.forEach(clearTimeout);
    som.current?.parar(250);
    if (repetindo) { setCorte(-1); setRodada((r) => r + 1); }
    const s = (som.current = criarSom());
    s.musica(DROP); // o fade-in sobe, suave, ate o drop
    s.efeito(batida(BATIDA_FACA));
    s.apagarEm(batida(FIM_DA_MUSICA.batida), FIM_DA_MUSICA.duracao);
    [...CORTES.map(({ modelo }) => modelo), ...OBJETOS_3D].forEach((modelo) => preparar(`/3d-models/${modelo}-low-poly.glb`).catch(() => {}));
    origem.current = performance.now();
    setTocando(true);
    // Cada estagio entra na sua batida, no relogio do clique (nenhum depende de a rolagem acabar).
    const t0 = performance.now();
    LINHA.forEach(([b, estagio]) => { agenda.current[estagio] = t0 + batida(b); });
    relogios.current = LINHA.map(([b, estagio]) => setTimeout(() => setCorte(estagio), batida(b) - (performance.now() - t0)));
  };

  return (
    <section id="video" ref={secao} className={`${bloco} flex flex-col justify-center min-h-svh py-16 md:py-24`}>
      {/* A malha de pontos do player, atras de tudo; as pontas e o circulo do clique ficam por cima dela. */}
      <CampoDePontos />
      {/* Os triangulos que surgem e somem, atras do play (z-1); o circulo vermelho do clique (z-2) os cobre. */}
      <Pontas camada="z-1" />
      <div className={envelope}>
        <div className="grid place-items-center">
          <button
            type="button"
            key={rodada}
            className="group relative [--u:min(1svh,1.7vw)] grid place-items-center size-40 lg:size-64 rounded-full bg-acento before:content-[''] before:absolute before:inset-0 before:rounded-full before:border-2 before:border-acento motion-safe:before:animate-anel text-void transition-transform duration-(--motion-fast) hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bone data-tocando:before:hidden data-tocando:pointer-events-none z-3"
            aria-label="Reproduzir vídeo"
            data-tocando={tocando ? "" : undefined}
            onClick={() => tocar()}
          >
            <span
              className="block w-1/2 h-1/2 bg-current [clip-path:polygon(35%_17%,62%_33.5%,89%_50%,62%_66.5%,35%_83%,35%_50%)] group-data-tocando:animate-letra motion-reduce:[animation-duration:1ms] motion-reduce:[animation-delay:0ms]"
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

      {tocando && <div className="absolute inset-0 z-2 pointer-events-none bg-acento motion-safe:animate-corte" aria-hidden="true" key={rodada} />}

      {corte === E.l3d && <TakeL3D inicioEm={agenda.current[E.l3d]} />}
      {/* Um unico fundo (preto + malha de pontos) para a carga e as seis capas: ele nao remonta nos cortes, so a frente troca.
          Remontar o canvas a cada corte dava um piscar de um quadro e reiniciava a onda. As frentes abaixo sao transparentes. */}
      {corte >= E.carga && corte < E.trilha && (
        <div className="absolute inset-0 z-4 bg-void" aria-hidden="true">
          <CampoDePontos />
        </div>
      )}
      {corte === E.carga && <TakeCarga />}
      {corte >= E.capa && corte < E.trilha && <CapaDaSessao {...CORTES[corte - E.capa]} origem={origem.current} key={corte} />}
      {corte === E.trilha && <AppTrilha duracao={2 * BATIDA} inicioEm={agenda.current[E.trilha]} aoMedir={(v) => { velocidade.current = v; }} />}
      {corte >= E.mascara && corte < E.manifesto && <div className="absolute inset-0 z-4 bg-void" aria-hidden="true" />}
      {corte >= E.registro && corte < E.manifesto && <AppRegistro velocidade={velocidade.current} duracao={4 * BATIDA} mascarar={corte >= E.mascara} />}
      {corte >= E.logo && corte < E.manifesto && <LogoLithium quadro={(corte - E.logo) % 2} batida={corte} />}
      {corte === E.manifesto && <TakeManifesto inicioEm={agenda.current[E.manifesto]} />}
      {corte === E.numeros && <TakeNumeros />}
      {corte === E.calendario && <TakeCalendario />}
      {corte === E.arsenal && <TakeArsenal inicioEm={agenda.current[E.arsenal]} />}
      {corte === E.faca && <TakeFaca aoRepetir={() => tocar(true)} replayEm={batida(FIM_DA_MUSICA.batida) + FIM_DA_MUSICA.duracao + REPLAY_APOS - batida(BATIDA_FACA)} />}
    </section>
  );
}
