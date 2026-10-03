/**
 * Movimento da pagina: Lenis na rolagem, anime.js nas revelacoes.
 *
 * A assinatura do sistema e o CORTE SECO (mestre visual §10): revelacao de
 * marca usa `steps(2)` ou `steps(3)`, nunca transicao continua. E o idioma de
 * impressao do cartaz aplicado ao tempo.
 *
 * Dois vocabularios convivem por uma regra clara:
 *
 *   - REVELACAO DE MARCA e corte seco, em `steps()`. Carimbo, numero, palavra
 *     que acende, semana que troca.
 *   - MOVIMENTO DE LAYOUT e continuo, em expo-out. Mascara de linha, parallax,
 *     a propria rolagem do Lenis.
 *
 * Misturar os dois apaga a assinatura: se tudo corta, o corte deixa de
 * significar.
 *
 * Tres travas valem para tudo o que este arquivo faz:
 *
 *   1. Com `prefers-reduced-motion`, todo efeito degrada para opacidade, e o
 *      Lenis forca `lerp` para 1 sozinho (`respectReducedMotion`).
 *   2. O estado inicial e escrito por JS, nunca por CSS de arquivo. Sem JS a
 *      pagina abre inteira e legivel (RNF-L16).
 *   3. Conteudo nunca fica preso invisivel (RNF-L35). O gatilho de revelacao e
 *      IntersectionObserver nativo, e ha uma varredura de seguranca no fim.
 *
 * O `onScroll` do anime.js so aparece em movimento LIGADO a rolagem (palavras do
 * manifesto, regua das semanas). Como gatilho de revelacao ele
 * deixou 14 de 30 elementos invisiveis em 05/09/2026, e por isso quem revela e
 * o observador nativo. Parallax que falha nao anima; revelacao que falha
 * esconde o texto.
 */
import { useEffect } from "react";
import Lenis from "lenis";
import {
  animate,
  createDrawable,
  onScroll,
  stagger,
  steps,
  utils,
} from "animejs";
import { duracao, semMovimento } from "./tokens.js";
import { aoMudarPausa, estaPausado } from "./pausa.js";

const MARGEM = "0px 0px -80px 0px";

/**
 * `useEffect` de tudo o que e movimento ou ornamento. Duas travas:
 *
 *   1. Se o efeito lancar, a pagina fica como o HTML pre-renderizado. Sem isto, a excecao
 *      de um efeito sem error boundary faz o React 19 desmontar a raiz inteira (pagina em
 *      branco), e movimento e ornamento: nao pode custar a venda.
 *   2. Se o relogio de 8 s do index.html ja recolheu `js`, o pacote chegou tarde demais e a
 *      pagina esta aberta por inteiro. Animar agora esconderia de novo o que o visitante ja
 *      esta lendo (RNF-L35).
 */
export function useMovimento(efeito, deps = []) {
  useEffect(() => {
    if (!document.documentElement.classList.contains("js")) return;
    try {
      const limpar = efeito();
      if (typeof limpar !== "function") return;
      return () => {
        try {
          limpar();
        } catch (erro) {
          console.error(erro);
        }
      };
    } catch (erro) {
      console.error(erro);
    }
  }, deps);
}

// Curva expo-out: o movimento de layout do vocabulario editorial. E a mesma
// curva do Lenis (1.001 - 2^(-10t)), para a rolagem e a revelacao terem o
// mesmo peso.
const EXPO = "cubicBezier(0.16, 1, 0.3, 1)";

/* -------------------------------------------------------------------------
   Rolagem
   ------------------------------------------------------------------------- */

/**
 * Lenis, com os defaults do estudio que o escreveu. `lerp 0.1` e a curva
 * expo-out foram calibrados em milhoes de sessoes; a tentacao de "ajustar o
 * feeling" quase sempre piora.
 *
 * O que ele NAO faz aqui, e por que isso importa no celular: `syncTouch` fica
 * em `false`, entao o toque continua sendo a rolagem nativa do sistema, com o
 * momentum do proprio iOS e Android. O Lenis so assume a roda do mouse e o
 * trackpad. E onde o trafego chega, nada e sequestrado.
 *
 * `anchors: true` cobre os links `#oferta` e o `Pular para o conteudo`. A biblioteca rola a
 * janela de verdade (`window.scrollTo`), entao `position: sticky`, IntersectionObserver
 * e o `onScroll` do anime.js continuam lendo a rolagem nativa.
 *
 * O LACO DORME. Com `autoRaf: true` o Lenis pede um `requestAnimationFrame` por quadro para
 * sempre, e cada quadro pedido e um quadro inteiro da thread principal (estilo, layout, pintura),
 * inclusive com a pagina parada: era o que fazia o Chrome reavaliar as 21 animacoes de CSS a cada
 * quadro, mesmo as que ele roda sozinho no compositor (medido: 0 recalculos por segundo sem laco,
 * 60 com um laco vazio). Aqui o laco so existe enquanto ha rolagem suave (`isSmooth`): a roda e o
 * clique numa ancora o acordam (a roda pelo evento `virtual-scroll` do Lenis, e o clique por um ouvinte
 * que entra depois do dele; os dois comecam a animacao dentro do proprio evento), e ele volta a dormir quando a animacao termina. Ao acordar, o
 * relogio do Lenis e posto UM quadro atras: ele calcula o passo pelo intervalo desde o ultimo
 * quadro, e depois de um sono isso seria um salto direto ao destino.
 *
 * Expoe a velocidade em `--scroll-velocity` (px por quadro), que a marquise
 * consome em CSS para inclinar com a rolagem (a propriedade e registrada em residual.css, sem
 * heranca: escrita NAS FAIXAS e nao herdavel, a mudanca invalida a faixa e mais nada, e nao os 78
 * nos de dentro dela). So se escreve na faixa que esta a ate uma tela da janela, e so quando o valor
 * muda: fora dali a inclinacao nao se ve (e a faixa que sai de perto volta a 0), e o valor de 0,00
 * repetido nao muda nada.
 */
export function ligarLenis() {
  if (typeof window === "undefined") return () => {};
  const lenis = new Lenis({ autoRaf: false, anchors: true, lerp: 0.1 });

  // O intervalo entre quadros desta tela (6,9 ms a 144 Hz, 16,7 ms a 60 Hz), medido; usado so
  // para por o relogio um quadro atras ao acordar.
  let intervalo = 1000 / 60;
  let ultimo = 0;
  let quadro = 0;
  let vivo = true;
  const bater = (t) => {
    quadro = 0;
    if (ultimo) intervalo = Math.max(4, Math.min(34, t - ultimo));
    else lenis.time = t - intervalo;
    ultimo = t;
    lenis.raf(t);
    if (lenis.isSmooth && vivo) quadro = requestAnimationFrame(bater);
    else ultimo = 0;
  };
  const acordar = () => {
    if (!quadro && vivo) quadro = requestAnimationFrame(bater);
  };
  // A roda acorda o laco pelo evento do PROPRIO Lenis, nao por um ouvinte nosso em `window`: um segundo
  // ouvinte de `wheel` fazia o Chrome entregar o primeiro evento depois do sono como nao cancelavel, e a
  // pagina dava um quadro de rolagem nativa (400 px de uma vez) antes de o Lenis assumir.
  // So a roda: o toque e nativo (`syncTouch: false`), e acordar o laco por ele seria um quadro por `touchmove`.
  const soltarVirtual = lenis.on("virtual-scroll", ({ event }) => event.type.includes("wheel") && acordar());
  window.addEventListener("click", acordar);
  requestAnimationFrame((a) => vivo && requestAnimationFrame((b) => (intervalo = Math.max(4, Math.min(34, b - a)))));

  const faixas = [...document.querySelectorAll(".marquise")];
  const perto = new Set();
  const escrito = new Map();
  let velocidadeAgora = "0.00";
  // So escreve quando o valor muda: 0,00 repetido nao muda nada, e cada escrita invalida a faixa.
  const escrever = (faixa, v) => {
    if (escrito.get(faixa) === v) return;
    escrito.set(faixa, v);
    faixa.style.setProperty("--scroll-velocity", v);
  };
  const observador =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entradas) => {
            for (const e of entradas) {
              // Ao entrar, a faixa recebe a velocidade de agora; ao sair, volta a 0. Uma faixa fora da tela
              // NAO pode ficar com a inclinacao velha: o evento que zera (400 ms depois de a rolagem parar)
              // chegaria quando ela ja saiu, e ela ficaria torta, transbordando a pagina em alguns pixels.
              if (e.isIntersecting) {
                perto.add(e.target);
                escrever(e.target, velocidadeAgora);
              } else {
                perto.delete(e.target);
                escrever(e.target, "0.00");
              }
            }
          },
          { rootMargin: "100% 0px" },
        )
      : null;
  // Sem IntersectionObserver, todas as faixas valem: o comportamento de antes.
  if (observador) for (const faixa of faixas) observador.observe(faixa);
  else for (const faixa of faixas) perto.add(faixa);

  lenis.on("scroll", ({ velocity }) => {
    velocidadeAgora = Math.max(-18, Math.min(18, velocity)).toFixed(2);
    for (const faixa of perto) escrever(faixa, velocidadeAgora);
  });
  return () => {
    vivo = false;
    cancelAnimationFrame(quadro);
    soltarVirtual();
    window.removeEventListener("click", acordar);
    observador?.disconnect();
    lenis.destroy();
    for (const faixa of faixas) faixa.style.removeProperty("--scroll-velocity");
  };
}

/**
 * Debounce de borda final com UM temporizador vivo. O evento de rolagem dispara a cada quadro, e o
 * `clearTimeout` + `setTimeout` por evento criava e descartava uns 60 temporizadores por segundo.
 * Aqui o evento so anota o instante, e o temporizador se rearma sozinho pelo que falta.
 */
function esperar(fn, ms) {
  let id = 0;
  let ate = 0;
  const tic = () => {
    const falta = ate - performance.now();
    if (falta > 1) {
      id = setTimeout(tic, falta);
      return;
    }
    id = 0;
    fn();
  };
  const chamar = () => {
    ate = performance.now() + ms;
    if (!id) id = setTimeout(tic, ms);
  };
  chamar.cancelar = () => {
    clearTimeout(id);
    id = 0;
  };
  return chamar;
}

/* -------------------------------------------------------------------------
   Gatilho de revelacao
   ------------------------------------------------------------------------- */

let observador = null;
const pendentes = new WeakMap();

/**
 * Quem ainda nao disparou. Existe porque o IntersectionObserver PERDE callback
 * em rolagem rapida: com saltos de 400px o navegador junta as notificacoes e
 * elementos que atravessaram a viewport nunca recebem a sua. A varredura
 * abaixo cobre o furo disparando a ANIMACAO de verdade, e nao apenas forcando
 * a opacidade.
 */
const aguardando = new Set();
let varreduraLigada = false;

function disparar(alvo) {
  if (!aguardando.has(alvo)) return;
  aguardando.delete(alvo);
  observador?.unobserve(alvo);
  const acao = pendentes.get(alvo);
  pendentes.delete(alvo);
  acao?.();
}

function varrerPendentes() {
  if (!aguardando.size) return;
  const limite = window.innerHeight - 80;
  for (const alvo of [...aguardando]) {
    // `top < limite` cobre os DOIS casos: o que esta na tela e o que ja
    // PASSOU por ela. A versao anterior exigia `bottom > 0` tambem, e com
    // isso quem o observador perdeu numa rolagem rapida ficava pendente para
    // sempre: o elemento nunca mais volta a intersectar, e so a rede de
    // seguranca do RNF-L35 o alcancava, 2,5 s depois. Medido em 07/09/2026 no
    // titulo das doze semanas, que ficava tres linhas fora do recorte.
    if (alvo.getBoundingClientRect().top < limite) disparar(alvo);
  }
}

function ligarVarredura() {
  if (varreduraLigada) return;
  varreduraLigada = true;
  const varrer = esperar(varrerPendentes, 120);
  const aoRolar = () => {
    if (!aguardando.size) {
      varreduraLigada = false;
      varrer.cancelar();
      window.removeEventListener("scroll", aoRolar);
      return;
    }
    varrer();
  };
  window.addEventListener("scroll", aoRolar, { passive: true });
}

function aoEntrar(gatilho, executar) {
  if (!gatilho) return;
  if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
    executar();
    return;
  }
  if (!observador) {
    observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) disparar(entrada.target);
        }
      },
      { rootMargin: MARGEM, threshold: 0 },
    );
  }
  pendentes.set(gatilho, executar);
  aguardando.add(gatilho);
  observador.observe(gatilho);
  ligarVarredura();
}

/**
 * Um laco infinito so anda enquanto da para ver. A marquise nao termina
 * nunca: sem isto ela ocupa a `requestAnimationFrame` da pagina inteira
 * para pintar o que ninguem esta olhando.
 */
function pausarForaDaTela(alvo, animacao) {
  if (!alvo || !animacao) return () => {};
  if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
    return () => animacao.pause();
  }
  animacao.pause();
  // Anda so se da para ver E o visitante nao pausou (WCAG 2.2.2, ver pausa.js).
  let visivel = false;
  const atualizar = () => (visivel && !estaPausado() ? animacao.play() : animacao.pause());
  const obs = new IntersectionObserver(
    ([entrada]) => {
      visivel = entrada.isIntersecting;
      atualizar();
    },
    { rootMargin: "200px 0px" },
  );
  obs.observe(alvo);
  const soltar = aoMudarPausa(atualizar);
  return () => {
    obs.disconnect();
    soltar();
    animacao.pause();
  };
}

/* -------------------------------------------------------------------------
   Revelacao
   ------------------------------------------------------------------------- */

/** Aparicao simples ligada a rolagem. O caso comum de todo bloco. */
export function revelar(alvo, { atraso = 0, deslocamento = 12 } = {}) {
  if (!alvo) return;
  const reduzido = semMovimento();
  utils.set(alvo, { opacity: 0, y: reduzido ? 0 : deslocamento });
  aoEntrar(alvo, () =>
    animate(alvo, {
      opacity: [0, 1],
      y: reduzido ? 0 : [deslocamento, 0],
      duration: reduzido ? duracao("--motion-fast") : duracao("--motion-base"),
      delay: atraso,
      ease: reduzido ? "linear" : steps(2),
    }),
  );
}

/** Varios elementos entrando em cascata, com o mesmo corte. */
export function revelarEmCascata(alvos, { intervalo = 70 } = {}) {
  const lista = Array.from(alvos ?? []);
  if (!lista.length) return;
  const reduzido = semMovimento();
  utils.set(lista, { opacity: 0, y: reduzido ? 0 : 10 });

  // Cada item tem o proprio gatilho: uma lista longa nao cabe na viewport, e
  // disparar a cascata inteira pelo primeiro item animaria no vazio o que
  // ainda esta tres telas abaixo.
  for (const [indice, item] of lista.entries()) {
    aoEntrar(item, () =>
      animate(item, {
        opacity: [0, 1],
        y: reduzido ? 0 : [10, 0],
        duration: reduzido ? duracao("--motion-fast") : duracao("--motion-base"),
        delay: reduzido ? 0 : Math.min(indice, 3) * intervalo,
        ease: reduzido ? "linear" : steps(2),
      }),
    );
  }
}

/**
 * Titulo com as linhas marcadas por `splitText` (cada uma num recorte com `[data-line]`) e
 * revelado como o resto: opacidade e deslocamento, nao subida de linha.
 *
 * O `splitText` divide por linha so depois de `document.fonts.ready`, entao `fatias.lines` volta
 * vazio aqui e a subida de linha que existia neste lugar nunca rodou (o titulo sempre entrou pelo
 * `revelar`). O ramo morto saiu; o que a pagina faz continua igual. A divisao em si fica: ela e o
 * que da a cada linha a folga de `mascara` (ui.js), parte do desenho do titulo. Religar a subida
 * de linha e decisao de design, nao de correcao.
 */
export async function mascaraDeLinha(alvo, { atraso = 0 } = {}) {
  if (!alvo) return;
  // Se o pedaco nao baixar (rede) ou o `splitText` falhar, o titulo entra do mesmo jeito,
  // sem a divisao: sem o `catch`, a falha deixava o titulo invisivel.
  if (!semMovimento()) await dividirEmLinhas(alvo).catch((erro) => console.error(erro));
  revelar(alvo, { atraso });
}

async function dividirEmLinhas(alvo) {
  // Dinamico de proposito, e medido: o modulo de texto do anime.js sai num
  // pedaco separado, e traze-lo por import estatico custava uns 90 ms de
  // avaliacao no arranque. `scripts/prerender.mjs` declara `modulepreload`
  // para o pedaco, entao ele baixa em paralelo com o principal.
  //
  // NAO envolver este `await import()` em `try`: o Rollup deixa de rastrear qual export
  // se usa e leva a biblioteca inteira para o pedaco (7 KB viram 72 KB, medido, e o
  // `modulepreload` os baixa na carga). O tratamento de erro fica em quem chama.
  const { splitText } = await import("animejs");
  splitText(alvo, {
    lines: { wrap: "clip" },
    words: false,
    chars: false,
    accessible: true,
  });
}

/**
 * Linhas compostas a mao subindo de dentro do recorte. E a mascara de linha
 * para titulo cujas quebras JA estao no markup (um `<span class="linha">` por
 * linha, com o texto num `.linha__texto` dentro), que e o caso das headlines
 * dos paineis e do titulo das doze semanas. Sem `splitText`: quem compos a
 * quebra foi o designer, nao o navegador, e e isso que a engenharia reversa
 * manda fazer nos titulos.
 *
 * `pai` e o elemento com `data-revelar`, se houver: ver a nota dentro.
 */
export function subirLinhas(linhas, { atraso = 0, intervalo = 110, pai = null, tempo = 820 } = {}) {
  const lista = Array.from(linhas ?? []);
  if (!lista.length) return;
  const reduzido = semMovimento();
  // Quem anima sao as LINHAS; um pai com `data-revelar` fica em `opacity: 0`
  // pelo CSS e leva o titulo inteiro junto. Sair dele na mao e a mesma
  // correcao que `abrirPainel` faz, e ela ja custou um defeito medido.
  if (pai) utils.set(pai, { opacity: 1 });
  // O gatilho e o recorte (`.linha`), nao a linha: ela nasce transladada para fora do recorte, e o
  // IntersectionObserver nao enxerga um alvo recortado (nunca disparava; so a rede de seguranca
  // do RNF-L35 destravava, zerando a linha antes de a secao chegar).
  const gatilho = lista[0].parentElement ?? lista[0];
  if (reduzido) {
    utils.set(lista, { opacity: 0 });
    aoEntrar(gatilho, () =>
      animate(lista, { opacity: [0, 1], duration: duracao("--motion-fast"), delay: atraso, ease: "linear" }),
    );
    return;
  }
  utils.set(lista, { y: "110%" });
  aoEntrar(gatilho, () =>
    animate(lista, {
      y: ["110%", "0%"],
      duration: tempo,
      delay: stagger(intervalo, { start: atraso }),
      ease: EXPO,
    }),
  );
}

/**
 * O carimbo: a revelacao de marca. Tres degraus, na duracao de celebracao.
 * Reservado ao numero da prova, ao selo da garantia e a semana do odometro.
 */
export function carimbar(alvo, { atraso = 0 } = {}) {
  if (!alvo) return;
  const reduzido = semMovimento();
  utils.set(alvo, { opacity: 0, scale: reduzido ? 1 : 1.14 });
  aoEntrar(alvo, () =>
    animate(alvo, {
      opacity: [0, 1],
      scale: reduzido ? 1 : [1.14, 1],
      duration: reduzido ? duracao("--motion-fast") : duracao("--motion-celebracao"),
      delay: atraso,
      ease: reduzido ? "linear" : steps(3),
    }),
  );
}

/**
 * Desenha um traco de SVG quando ele chega a tela. Serve a moldura do fechamento, a regua e os
 * riscos do espelho. Sob movimento reduzido o traco ja nasce inteiro e so aparece.
 */
export function desenhar(alvos, { atraso = 0, tempo } = {}) {
  const lista = Array.from(alvos ?? []).filter(Boolean);
  if (!lista.length) return;
  const reduzido = semMovimento();

  if (reduzido) utils.set(lista, { opacity: 0 });
  aoEntrar(lista[0], () => {
    if (reduzido) {
      animate(lista, { opacity: [0, 1], duration: duracao("--motion-fast"), delay: atraso, ease: "linear" });
      return;
    }
    animate(createDrawable(lista), {
      draw: ["0 0", "0 1"],
      duration: tempo ?? duracao("--motion-slow") * 2,
      delay: stagger(60, { start: atraso }),
      ease: "out(2)",
    });
  });
}

/* -------------------------------------------------------------------------
   Movimento ligado a rolagem
   ------------------------------------------------------------------------- */

/**
 * Marquise: faixa horizontal em laco. O conteudo e duplicado no markup para o
 * laco nao ter costura visivel, e a copia leva `aria-hidden`.
 */
export function marquise(trilho, { tempo = 26000, sentido = -1 } = {}) {
  if (!trilho || semMovimento()) return;

  // Uma metade precisa ser MAIS LARGA que a janela, e essa e a regra inteira
  // do laco. Se falta largura, repete-se o conteudo ate cobrir. Cobre a MAIOR
  // dimensao da tela, e nao so a janela de agora: girar o aparelho ou alargar a
  // janela depois nao pode abrir um vao.
  const metades = [...trilho.children];
  const alvo = Math.max(trilho.parentElement?.clientWidth ?? 0, window.screen.width, window.screen.height);
  const uma = metades[0]?.scrollWidth ?? 0;
  const clones = [];
  let fator = 1;

  if (metades.length === 2 && uma > 0 && uma < alvo) {
    fator = Math.ceil(alvo / uma) + 1;
    for (const metade of metades) {
      const base = [...metade.children];
      for (let copia = 1; copia < fator; copia += 1) {
        for (const item of base) {
          const clone = item.cloneNode(true);
          clone.setAttribute("aria-hidden", "true");
          metade.append(clone);
          clones.push(clone);
        }
      }
    }
  }

  if (!trilho.scrollWidth) return;

  // Em %, e nao em px: a metade muda de largura quando a fonte troca de tamanho no breakpoint
  // `lg`, e uma distancia fixa em px deixava a costura do laco fora do lugar depois disso.
  const laco = animate(trilho, {
    x: sentido < 0 ? ["0%", "-50%"] : ["-50%", "0%"],
    duration: tempo * fator,
    ease: "linear",
    loop: true,
  });

  const parar = pausarForaDaTela(trilho.parentElement ?? trilho, laco);
  return () => {
    parar();
    for (const clone of clones) clone.remove();
  };
}

/**
 * O `onScroll` do anime.js liga um temporizador de 30 quadros por segundo que mede a velocidade da
 * rolagem (`dataTimer`) e NAO o desliga quando a rolagem para: quem acorda e dorme e o
 * `wakeTicker` (500 ms depois do ultimo evento), que pausa o `scrollTicker` mas nunca avisa o
 * medidor. Resultado, medido: o motor do anime.js ficava pedindo `requestAnimationFrame` para
 * sempre, com a pagina parada, e cada quadro pedido e um quadro inteiro da thread principal.
 * Aqui o medidor dorme junto com o `wakeTicker` e volta a cada rolagem. So ele mede velocidade e
 * direcao, e nada desta pagina le nenhuma das duas; o progresso das palavras nao passa por ele.
 *
 * Mexe em dois campos de instancia da biblioteca: se uma versao futura os mudar, a guarda abaixo
 * nao faz nada e a pagina volta ao comportamento anterior (que e correto, so nao dorme).
 */
function dormirComARolagem(container) {
  const acordar = container?.wakeTicker;
  const medidor = container?.dataTimer;
  if (container?.dormeComARolagem || typeof acordar?.onBegin !== "function" || typeof acordar?.onComplete !== "function" || !medidor?.pause) return;
  container.dormeComARolagem = true;
  const comecou = acordar.onBegin;
  const terminou = acordar.onComplete;
  acordar.onBegin = (t) => {
    comecou(t);
    medidor.resume();
  };
  acordar.onComplete = (t) => {
    terminou(t);
    medidor.pause();
  };
}

/**
 * Elementos que acendem um a um conforme a pagina desce, e apagam na volta.
 *
 * Vem da engenharia reversa do Nakula: o progresso e LIGADO a rolagem da
 * secao, nao disparado por ela. E revelacao de marca, entao cada elemento
 * troca de estado como carimbo, sem esmaecer.
 *
 * Serve as palavras do manifesto e as doze semanas da regua (RF-L11b), que e
 * o mesmo mecanismo. O estado e um ATRIBUTO (`data-acesa`), e o CSS reage a ele
 * com `data-acesa:` do Tailwind: classe de estado nao sobrevive a uma
 * refatoracao de estilo, atributo sim. Completam a 74% da travessia, para
 * estarem inteiros antes de a secao ir embora. Sob movimento reduzido tudo
 * nasce aceso: os dois INFORMAM, e informacao nao depende de animacao.
 */
export function acenderEmSequencia(
  alvos,
  contexto,
  { atributo = "data-acesa", atributoAtual = null } = {},
) {
  const lista = Array.from(alvos ?? []);
  if (!lista.length || !contexto) return;
  if (semMovimento()) {
    for (const el of lista) el.setAttribute(atributo, "");
    return;
  }
  const estado = { avanco: 0 };
  let ultimo = -1;
  const gatilho = onScroll({ target: contexto, enter: "bottom top", leave: "top bottom", sync: 0.5 });
  dormirComARolagem(gatilho.container);
  return animate(estado, {
    avanco: [0, lista.length * 1.35],
    ease: "linear",
    autoplay: gatilho,
    onUpdate: () => {
      const acesas = Math.min(lista.length, Math.floor(estado.avanco));
      if (acesas === ultimo) return;
      ultimo = acesas;
      for (const [indice, el] of lista.entries()) {
        el.toggleAttribute(atributo, indice < acesas);
        // A palavra que esta acendendo AGORA, no acento. E o detalhe que o
        // site de origem poe no caractere da fronteira, e o unico uso do
        // acento nesta tela.
        if (atributoAtual) el.toggleAttribute(atributoAtual, indice === acesas - 1);
      }
    },
  });
}

/* -------------------------------------------------------------------------
   Interacao
   ------------------------------------------------------------------------- */

/** Resposta ao toque no botao. Um degrau: e confirmacao, nao animacao. */
export function pulsar(alvo) {
  if (!alvo || semMovimento()) return;
  animate(alvo, { scale: [1, 0.97, 1], duration: duracao("--motion-fast"), ease: steps(2) });
}

/**
 * A entrada do painel de tela cheia do fechamento, quando ele chega a tela. (A dobra
 * entra por CSS, em styles/residual.css §7.)
 *
 * A ordem e a leitura: primeiro a moldura desenha o campo, depois os fios
 * abrem a grade, depois as duas linhas da headline sobem de dentro do recorte,
 * e so entao a promessa e o botao.
 *
 * Barato primeiro, caro depois: `revelar` so marca o elemento; `desenhar` mede
 * cada traco e `subirLinhas` escreve transform.
 */
export function abrirPainel({ moldura, fios, kicker, titulo, linhas, corpo, acao, rodape }) {
  const passo = semMovimento() ? 0 : 1;

  // Quem anima sao as linhas; o pai precisa sair do opacity 0 do
  // [data-revelar] na mao, senao o titulo nunca aparece.
  if (titulo) utils.set(titulo, { opacity: 1 });

  revelar(kicker, { atraso: 120 * passo });
  revelar(corpo, { atraso: 780 * passo });
  revelar(acao, { atraso: 900 * passo });
  revelar(rodape, { atraso: 1020 * passo });
  desenhar(moldura, { atraso: 100 * passo });
  desenhar(fios, { atraso: 260 * passo, tempo: 620 });
  subirLinhas(linhas, { atraso: 380 * passo });
}

/* -------------------------------------------------------------------------
   Rede de seguranca - RNF-L35
   ------------------------------------------------------------------------- */

/**
 * Se por qualquer motivo algum elemento continuar invisivel dentro da
 * viewport, ele volta a aparecer. Uma pagina sem animacao vende; uma pagina
 * com paragrafo invisivel, nao.
 */
export function garantirVisibilidade(prazo = 2500) {
  if (typeof window === "undefined") return () => {};

  const varrer = () => {
    // Tudo se LE primeiro e so depois se ESCREVE: ler o layout no meio das
    // escritas forca um recalculo por elemento.
    const altura = window.innerHeight;
    const presos = [];
    for (const el of document.querySelectorAll("[data-revelar]")) {
      const caixa = el.getBoundingClientRect();
      // Fora da tela, o estado inicial (opaco, ou linha abaixo do recorte) e o certo: so o que
      // esta na viewport pode estar preso.
      if (!(caixa.top < altura && caixa.bottom > 0)) continue;
      if (parseFloat(getComputedStyle(el).opacity) < 0.99) presos.push([el, { opacity: 1, y: 0 }]);
      // Linha de mascara que ficou fora do recorte tambem e texto invisivel.
      // `[data-line]` e como o `splitText` marca; `.linha__texto` e como os
      // paineis marcam as linhas compostas a mao.
      for (const linha of el.querySelectorAll("[data-line], .linha__texto")) {
        const t = getComputedStyle(linha).transform;
        if (t && t !== "none" && !t.endsWith(", 0)")) presos.push([linha, { y: "0%" }]);
      }
    }
    // Palavra que a rolagem ja deixou para tras e segue apagada (o `onScroll` falhou):
    // apagada e opacidade .16, e texto assim reprova no contraste.
    const apagadas = [...document.querySelectorAll(".palavra:not([data-acesa])")].filter(
      (p) => p.getBoundingClientRect().bottom < 0,
    );

    for (const [el, props] of presos) utils.set(el, props);
    for (const p of apagadas) p.setAttribute("data-acesa", "");
  };

  const aoRolar = esperar(varrer, prazo);
  aoRolar();
  window.addEventListener("scroll", aoRolar, { passive: true });
  return () => {
    aoRolar.cancelar();
    window.removeEventListener("scroll", aoRolar);
  };
}
