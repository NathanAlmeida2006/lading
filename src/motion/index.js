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
 * O `onScroll` do anime.js so aparece em movimento LIGADO a rolagem (parallax,
 * palavras do manifesto, odometro das semanas). Como gatilho de revelacao ele
 * deixou 14 de 30 elementos invisiveis em 05/09/2026, e por isso quem revela e
 * o observador nativo. Parallax que falha nao anima; revelacao que falha
 * esconde o texto.
 */
import Lenis from "lenis";
import {
  animate,
  createDrawable,
  createTimeline,
  onScroll,
  stagger,
  steps,
  utils,
} from "animejs";
import { duracao, semMovimento } from "./tokens.js";

const MARGEM = "0px 0px -80px 0px";

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
 * `anchors: true` cobre os links `#oferta` e o `Pular para o conteudo`;
 * `autoRaf: true` dispensa um loop proprio. A biblioteca rola a janela de
 * verdade (`window.scrollTo`), entao `position: sticky`, IntersectionObserver
 * e o `onScroll` do anime.js continuam lendo a rolagem nativa.
 *
 * Expoe a velocidade em `--scroll-velocity` (px por quadro), que a marquise
 * consome em CSS para inclinar com a rolagem.
 */
export function ligarLenis() {
  if (typeof window === "undefined") return () => {};
  const lenis = new Lenis({ autoRaf: true, anchors: true, lerp: 0.1 });
  const raiz = document.documentElement;
  lenis.on("scroll", ({ velocity }) => {
    const v = Math.max(-18, Math.min(18, velocity));
    raiz.style.setProperty("--scroll-velocity", v.toFixed(2));
  });
  return () => {
    lenis.destroy();
    raiz.style.removeProperty("--scroll-velocity");
  };
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
let relogioVarredura = null;

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
  const aoRolar = () => {
    if (!aguardando.size) {
      varreduraLigada = false;
      window.removeEventListener("scroll", aoRolar);
      return;
    }
    clearTimeout(relogioVarredura);
    relogioVarredura = setTimeout(varrerPendentes, 120);
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
 * Um laco infinito so anda enquanto da para ver. A marquise e a seta nao
 * terminam nunca: sem isto elas ocupam a `requestAnimationFrame` da pagina
 * inteira para pintar o que ninguem esta olhando.
 */
function pausarForaDaTela(alvo, animacao) {
  if (!alvo || !animacao) return () => {};
  if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
    return () => animacao.pause();
  }
  animacao.pause();
  const obs = new IntersectionObserver(
    ([entrada]) => (entrada.isIntersecting ? animacao.play() : animacao.pause()),
    { rootMargin: "200px 0px" },
  );
  obs.observe(alvo);
  return () => {
    obs.disconnect();
    animacao.pause();
  };
}

/* -------------------------------------------------------------------------
   Revelacao
   ------------------------------------------------------------------------- */

/** Aparicao simples ligada a rolagem. O caso comum de todo bloco. */
export function revelar(alvo, { atraso = 0, deslocamento = 12, imediato = false } = {}) {
  if (!alvo) return;
  const reduzido = semMovimento();
  utils.set(alvo, { opacity: 0, y: reduzido ? 0 : deslocamento });
  const tocar = () =>
    animate(alvo, {
      opacity: [0, 1],
      y: reduzido ? 0 : [deslocamento, 0],
      duration: reduzido ? duracao("--motion-fast") : duracao("--motion-base"),
      delay: atraso,
      ease: reduzido ? "linear" : steps(2),
    });
  // `imediato` e para o que JA esta na tela quando o JS acorda: o gatilho por
  // observador desconta 80px do rodape da janela, e o rodape da dobra mora
  // exatamente ali. Esperar a rolagem para mostra-lo e nao mostra-lo.
  if (imediato) tocar();
  else aoEntrar(alvo, tocar);
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
 * Mascara de linha: as linhas do titulo sobem de dentro de um recorte.
 * Movimento de layout, nao revelacao de marca: por isso a curva e continua.
 */
export async function mascaraDeLinha(alvo, { atraso = 0, intervalo = 90 } = {}) {
  if (!alvo) return;
  if (semMovimento()) return revelar(alvo, { atraso, deslocamento: 0 });

  // Dinamico de proposito, e medido: o modulo de texto do anime.js sai num
  // pedaco separado, e traze-lo por import estatico custava uns 90 ms de
  // avaliacao no arranque. `scripts/prerender.mjs` declara `modulepreload`
  // para o pedaco, entao ele baixa em paralelo com o principal.
  const { splitText } = await import("animejs");
  const fatias = splitText(alvo, {
    lines: { wrap: "clip" },
    words: false,
    chars: false,
    accessible: true,
  });
  const linhas = fatias.lines;
  if (!linhas?.length) return revelar(alvo, { atraso });

  utils.set(alvo, { opacity: 1 });
  utils.set(linhas, { y: "110%" });
  aoEntrar(alvo, () =>
    animate(linhas, {
      y: ["110%", "0%"],
      duration: 780,
      delay: stagger(intervalo, { start: atraso }),
      ease: EXPO,
    }),
  );
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
export function subirLinhas(
  linhas,
  { atraso = 0, intervalo = 110, naRolagem = false, pai = null, tempo = 820 } = {},
) {
  const lista = Array.from(linhas ?? []);
  if (!lista.length) return;
  const reduzido = semMovimento();
  // Quem anima sao as LINHAS; um pai com `data-revelar` fica em `opacity: 0`
  // pelo CSS e leva o titulo inteiro junto. Sair dele na mao e a mesma
  // correcao que `abrirPainel` faz, e ela ja custou um defeito medido.
  if (pai) utils.set(pai, { opacity: 1 });
  if (reduzido) {
    utils.set(lista, { opacity: 0 });
    const tocar = () =>
      animate(lista, { opacity: [0, 1], duration: duracao("--motion-fast"), delay: atraso, ease: "linear" });
    if (naRolagem) aoEntrar(lista[0], tocar);
    else tocar();
    return;
  }
  utils.set(lista, { y: "110%" });
  const tocar = () =>
    animate(lista, {
      y: ["110%", "0%"],
      duration: tempo,
      delay: stagger(intervalo, { start: atraso }),
      ease: EXPO,
    });
  if (naRolagem) aoEntrar(lista[0], tocar);
  else tocar();
}

/**
 * O carimbo: a revelacao de marca. Tres degraus, na duracao de celebracao.
 * Reservado ao numero da prova, ao selo da garantia e a semana do odometro.
 */
export function carimbar(alvo, { atraso = 0, naRolagem = false } = {}) {
  if (!alvo) return;
  const reduzido = semMovimento();
  utils.set(alvo, { opacity: 0, scale: reduzido ? 1 : 1.14 });
  const tocar = () =>
    animate(alvo, {
      opacity: [0, 1],
      scale: reduzido ? 1 : [1.14, 1],
      duration: reduzido ? duracao("--motion-fast") : duracao("--motion-celebracao"),
      delay: atraso,
      ease: reduzido ? "linear" : steps(3),
    });
  if (naRolagem) aoEntrar(alvo, tocar);
  else tocar();
}

/**
 * Desenha um traco de SVG. Serve a moldura, a regua e os riscos do espelho.
 * Sob movimento reduzido o traco ja nasce inteiro e so aparece.
 */
export function desenhar(alvos, { atraso = 0, naRolagem = true, tempo } = {}) {
  const lista = Array.from(alvos ?? []).filter(Boolean);
  if (!lista.length) return;
  const reduzido = semMovimento();

  const tocar = () => {
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
  };

  if (reduzido) utils.set(lista, { opacity: 0 });
  if (naRolagem) aoEntrar(lista[0], tocar);
  else tocar();
}

/* -------------------------------------------------------------------------
   Movimento ligado a rolagem
   ------------------------------------------------------------------------- */

/**
 * Parallax. Fator de 0,06 a 0,16 da altura da viewport, teto de 72px: sem o
 * teto o deslocamento acompanha a janela e o ornamento sai da propria secao.
 */
export function parallaxe(alvo, { fator = 0.1 } = {}) {
  if (!alvo || semMovimento() || typeof window === "undefined") return;
  const curso = Math.min(Math.round(window.innerHeight * fator), 72);
  return animate(alvo, {
    y: [curso, -curso],
    ease: "linear",
    autoplay: onScroll({
      // O limiar se le "<borda da janela> <borda do alvo>", e a ORDEM importa:
      // escrito ao contrario o fim cai antes do comeco e a biblioteca zera a
      // distancia sem avisar. Aqui: comeca quando o rodape da janela alcanca o
      // topo do alvo, termina quando o topo da janela alcanca o rodape dele.
      enter: "bottom top",
      leave: "top bottom",
      sync: 0.35,
    }),
  });
}

/**
 * Marquise: faixa horizontal em laco. O conteudo e duplicado no markup para o
 * laco nao ter costura visivel, e a copia leva `aria-hidden`.
 */
export function marquise(trilho, { tempo = 26000, sentido = -1 } = {}) {
  if (!trilho || semMovimento()) return;

  // Uma metade precisa ser MAIS LARGA que a janela, e essa e a regra inteira
  // do laco. Se falta largura, repete-se o conteudo ate cobrir.
  const metades = [...trilho.children];
  const janela = trilho.parentElement?.clientWidth ?? 0;
  const uma = metades[0]?.scrollWidth ?? 0;
  let fator = 1;

  if (metades.length === 2 && uma > 0 && uma < janela) {
    fator = Math.ceil(janela / uma) + 1;
    for (const metade of metades) {
      const base = [...metade.children];
      for (let copia = 1; copia < fator; copia += 1) {
        for (const item of base) {
          const clone = item.cloneNode(true);
          clone.setAttribute("aria-hidden", "true");
          metade.append(clone);
        }
      }
    }
  }

  const largura = trilho.scrollWidth / 2;
  if (!largura) return;

  const laco = animate(trilho, {
    x: sentido < 0 ? [0, -largura] : [-largura, 0],
    duration: tempo * fator,
    ease: "linear",
    loop: true,
  });

  return pausarForaDaTela(trilho.parentElement ?? trilho, laco);
}

/**
 * Elementos que acendem um a um conforme a pagina desce, e apagam na volta.
 *
 * Vem da engenharia reversa do Nakula: o progresso e LIGADO a rolagem da
 * secao, nao disparado por ela. E revelacao de marca, entao cada elemento
 * troca de estado como carimbo, sem esmaecer.
 *
 * Serve as palavras do manifesto e as doze semanas da regua (RF-L11b), que e
 * o mesmo mecanismo com outra classe. Completam a 74% da travessia, para
 * estarem inteiros antes de a secao ir embora. Sob movimento reduzido tudo
 * nasce aceso: os dois INFORMAM, e informacao nao depende de animacao.
 */
export function acenderEmSequencia(
  alvos,
  contexto,
  { classe = "palavra--acesa", classeAtual = null } = {},
) {
  const lista = Array.from(alvos ?? []);
  if (!lista.length || !contexto) return;
  if (semMovimento()) {
    for (const el of lista) el.classList.add(classe);
    return;
  }
  const estado = { avanco: 0 };
  let ultimo = -1;
  return animate(estado, {
    avanco: [0, lista.length * 1.35],
    ease: "linear",
    autoplay: onScroll({ target: contexto, enter: "bottom top", leave: "top bottom", sync: 0.5 }),
    onUpdate: () => {
      const acesas = Math.min(lista.length, Math.floor(estado.avanco));
      if (acesas === ultimo) return;
      ultimo = acesas;
      for (const [indice, el] of lista.entries()) {
        el.classList.toggle(classe, indice < acesas);
        // A palavra que esta acendendo AGORA, no acento. E o detalhe que o
        // site de origem poe no caractere da fronteira, e o unico uso do
        // acento nesta tela.
        if (classeAtual) el.classList.toggle(classeAtual, indice === acesas - 1);
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
 * A entrada de um painel de tela cheia: a dobra e o fechamento.
 *
 * A ordem e a leitura: primeiro a moldura desenha o campo, depois os fios
 * abrem a grade, depois as duas linhas da headline sobem de dentro do recorte,
 * e so entao a promessa e o botao.
 *
 * Barato primeiro, caro depois: `revelar` so marca o elemento; `desenhar` mede
 * cada traco e `subirLinhas` escreve transform. Com as caras na frente, o
 * paragrafo da dobra (o que o LCP cronometra) so era marcado depois de todo
 * esse trabalho.
 */
export function abrirPainel({
  moldura,
  fios,
  kicker,
  titulo,
  linhas,
  corpo,
  acao,
  rodape,
  seta,
  naRolagem = false,
  atrasoBase = 0,
}) {
  const reduzido = semMovimento();
  const passo = reduzido ? 0 : 1;
  // `atrasoBase` e o tempo da cortina de introducao: com ela na frente, o
  // heroi compoe enquanto ela levanta, e tudo o que se ve sobe junto.
  const base = atrasoBase * passo;

  // Quem anima sao as linhas; o pai precisa sair do opacity 0 do
  // [data-revelar] na mao, senao o titulo nunca aparece.
  if (titulo) utils.set(titulo, { opacity: 1 });

  const imediato = !naRolagem;
  revelar(kicker, { atraso: base + 120 * passo, imediato });
  revelar(corpo, { atraso: base + 780 * passo, imediato });
  revelar(acao, { atraso: base + 900 * passo, imediato });
  revelar(rodape, { atraso: base + 1020 * passo, imediato });
  desenhar(moldura, { naRolagem, atraso: base + 100 * passo });
  desenhar(fios, { naRolagem, atraso: base + 260 * passo, tempo: 620 });
  subirLinhas(linhas, { atraso: base + 380 * passo, naRolagem });

  if (seta && !reduzido) {
    utils.set(seta, { opacity: 0 });
    const pisca = createTimeline({ delay: base + 1400, loop: true })
      .add(seta, { opacity: [0, 1], y: [0, 6], duration: 900, ease: "inOut(2)" })
      .add(seta, { opacity: [1, 0.35], y: [6, 0], duration: 900, ease: "inOut(2)" });
    return pausarForaDaTela(seta, pisca);
  }
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
    for (const el of document.querySelectorAll("[data-revelar]")) {
      const caixa = el.getBoundingClientRect();
      const dentro = caixa.top < window.innerHeight && caixa.bottom > 0;
      if (dentro && parseFloat(getComputedStyle(el).opacity) < 0.99) {
        utils.set(el, { opacity: 1, y: 0 });
      }
      // Linha de mascara que ficou fora do recorte tambem e texto invisivel.
      // `[data-line]` e como o `splitText` marca; `.linha__texto` e como os
      // paineis marcam as linhas compostas a mao.
      for (const linha of el.querySelectorAll("[data-line], .linha__texto")) {
        const t = getComputedStyle(linha).transform;
        if (t && t !== "none" && !t.endsWith(", 0)")) utils.set(linha, { y: "0%" });
      }
    }
  };

  let relogio = setTimeout(varrer, prazo);
  const aoRolar = () => {
    clearTimeout(relogio);
    relogio = setTimeout(varrer, prazo);
  };

  window.addEventListener("scroll", aoRolar, { passive: true });
  return () => {
    clearTimeout(relogio);
    window.removeEventListener("scroll", aoRolar);
  };
}
