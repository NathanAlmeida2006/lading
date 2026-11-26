import { animate, createDrawable, splitText, stagger, steps, utils } from "animejs";
import { getDuration, isMotionReduced } from "./tokens.js";
import { openReadingMode } from "./reading.js";

// Dispara na borda da tela, e não 80px dentro: com rolagem rápida o elemento já estaria no meio
// da tela quando a animação começasse, e apareceria "de repente".
const ROOT_MARGIN = "0px 0px 0px 0px";
// `outExpo` nativo do Anime.js 4: a string `cubicBezier(...)` foi removida do core (e importar a função
// estoura o teto de JS). Difere de cubic-bezier(0.16, 1, 0.3, 1) em no máximo 0,012 (a 4% do tempo).
const EXPO_EASING = "outExpo";
// Aparição fluida: curva expo-out em ~0,65 s, no lugar dos degraus `steps(2)` de 180 ms.
const REVEAL_DURATION_MS = 650;

/* Um IntersectionObserver nativo dispara cada revelação. */
let observer = null;
const pending = new Map();

function fire(target) {
  const actions = pending.get(target);
  if (!actions) return;
  pending.delete(target);
  observer?.unobserve(target);
  for (const action of actions) {
    if (document.documentElement.classList.contains("movimento-falhou")) break;
    try {
      action();
    } catch (error) {
      console.error(error);
      pending.clear();
      observer?.disconnect();
      observer = null;
      openReadingMode();
      break;
    }
  }
  if (!pending.size) {
    observer?.disconnect();
    observer = null;
  }
}

function whenInView(trigger, execute) {
  if (!trigger) return;
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) fire(entry.target);
        }
      },
      { rootMargin: ROOT_MARGIN, threshold: 0 },
    );
  }
  let animation;
  const start = () => {
    animation = execute();
  };
  const actions = pending.get(trigger) ?? new Set();
  actions.add(start);
  if (!pending.has(trigger)) {
    pending.set(trigger, actions);
    try {
      observer.observe(trigger);
    } catch (error) {
      pending.delete(trigger);
      if (!pending.size) {
        observer.disconnect();
        observer = null;
      }
      throw error;
    }
  }
  return () => {
    const remaining = pending.get(trigger);
    remaining?.delete(start);
    if (remaining && !remaining.size) {
      pending.delete(trigger);
      observer?.unobserve(trigger);
    }
    animation?.revert?.();
    if (!pending.size) {
      observer?.disconnect();
      observer = null;
    }
  };
}

/* -------------------------------------------------------------------------
   Revelação
   ------------------------------------------------------------------------- */

/**
 * Aparição simples ligada a rolagem. O caso comum de todo bloco.
 * @param {Element} target - Elemento a revelar.
 * @param {object} [options={}] - Opções.
 * @param {number} [options.delay=0] - Atraso em ms.
 * @param {number} [options.offset=12] - Deslocamento vertical inicial em px.
 * @returns {(() => void) | undefined} Função que desfaz a animação.
 */
export function reveal(target, { delay = 0, offset = 12 } = {}) {
  if (!target) return;
  const isReduced = isMotionReduced();
  utils.set(target, { opacity: 0, y: isReduced ? 0 : offset });
  const cleanup = whenInView(target, () =>
    animate(target, {
      opacity: [0, 1],
      y: isReduced ? 0 : [offset, 0],
      duration: isReduced ? getDuration("--motion-fast") : REVEAL_DURATION_MS,
      delay: delay,
      ease: isReduced ? "linear" : EXPO_EASING,
    }),
  );
  return () => {
    cleanup?.();
    utils.set(target, { opacity: 1, y: 0 });
  };
}

/**
 * Vários elementos entrando em cascata, com o mesmo corte.
 * @param {Iterable<Element> | NodeListOf<Element>} targets - Elementos da cascata.
 * @param {object} [options={}] - Opções.
 * @param {number} [options.interval=70] - Intervalo entre itens em ms.
 * @returns {(() => void) | undefined} Função que desfaz as animações.
 */
export function revealInCascade(targets, { interval = 70 } = {}) {
  const list = Array.from(targets ?? []);
  if (!list.length) return;
  const isReduced = isMotionReduced();
  utils.set(list, { opacity: 0, y: isReduced ? 0 : 10 });

  // Cada item tem o próprio gatilho: uma lista longa não cabe na viewport, e
  // disparar a cascata inteira pelo primeiro item animaria no vazio o que
  // ainda está três telas abaixo.
  const cleanups = [];
  for (const [index, item] of list.entries()) {
    cleanups.push(
      whenInView(item, () =>
        animate(item, {
          opacity: [0, 1],
          y: isReduced ? 0 : [10, 0],
          duration: isReduced ? getDuration("--motion-fast") : REVEAL_DURATION_MS,
          delay: isReduced ? 0 : Math.min(index, 3) * interval,
          ease: isReduced ? "linear" : EXPO_EASING,
        }),
      ),
    );
  }
  return () => {
    for (const cleanup of cleanups) cleanup?.();
    utils.set(list, { opacity: 1, y: 0 });
  };
}

/**
 * Divide o título em linhas (splitText, recorte em cada linha) e o revela pelo `reveal`.
 * Hoje a máscara não anima: só o bloco inteiro esmaece. Decisão pendente do dono, desde 02/10:
 * tirar o splitText aperta o entrelinha, então ele fica.
 * Espera as fontes antes de dividir; uma desmontagem ou falha impede escrita tardia no DOM.
 * @param {Element} target - Título a dividir.
 * @param {object} [options={}] - Opções.
 * @param {number} [options.delay=0] - Atraso em ms.
 * @param {AbortSignal} [signal] - Cancela a divisão se disparar antes de escrever no DOM.
 * @returns {Promise<(() => void) | undefined>} Função que desfaz a divisão e a animação.
 * @throws {Error} Erro do `splitText`, depois de desfazer o que já foi montado.
 */
export async function revealLineMask(target, { delay = 0 } = {}, signal) {
  if (!target) return;
  if (!isMotionReduced()) await document.fonts.ready;
  if (
    signal?.aborted ||
    !target.isConnected ||
    document.documentElement.classList.contains("movimento-falhou")
  )
    return;
  let slices;
  let cleanup;
  try {
    // Registra o fallback antes de qualquer wrapper: se observe() lançar,
    // nenhum split assíncrono fica para trás.
    cleanup = reveal(target, { delay });
    if (!isMotionReduced()) {
      slices = splitText(target, {
        lines: { wrap: "clip" },
        words: false,
        chars: false,
        accessible: true,
      });
    }
    return () => {
      cleanup?.();
      slices?.revert();
    };
  } catch (error) {
    cleanup?.();
    slices?.revert();
    throw error;
  }
}

/**
 * Linhas compostas à mão subindo de dentro do recorte. É a máscara de linha
 * para título cujas quebras JÁ estão no markup (um `<span class="linha">` por
 * linha, com o texto num `.linha__texto` dentro), que é o caso das headlines
 * dos painéis e do título das doze semanas. Sem `splitText`: quem compôs a
 * quebra foi o designer, não o navegador, e é isso que a engenharia reversa
 * manda fazer nos títulos.
 * @param {Iterable<Element> | NodeListOf<Element>} lines - Linhas, dentro dos recortes `.linha`.
 * @param {object} [options={}] - Opções.
 * @param {number} [options.delay=0] - Atraso em ms.
 * @param {number} [options.interval=110] - Intervalo entre linhas em ms.
 * @param {number} [options.duration=820] - Duração de cada linha em ms.
 * @returns {(() => void) | undefined} Função que desfaz a animação.
 */
export function raiseLines(lines, { delay = 0, interval = 110, duration = 820 } = {}) {
  const list = Array.from(lines ?? []);
  if (!list.length) return;
  const isReduced = isMotionReduced();
  // O gatilho é o recorte (`.linha`), não a linha: ela nasce transladada para fora do recorte, e o
  // IntersectionObserver não enxerga um alvo recortado (nunca disparava; só a rede de segurança
  // do RNF-L35 destravava, zerando a linha antes de a seção chegar).
  const trigger = list[0].parentElement ?? list[0];
  if (isReduced) {
    utils.set(list, { opacity: 0 });
    const cleanup = whenInView(trigger, () =>
      animate(list, {
        opacity: [0, 1],
        duration: getDuration("--motion-fast"),
        delay: delay,
        ease: "linear",
      }),
    );
    return () => {
      cleanup?.();
      utils.set(list, { opacity: 1 });
    };
  }
  utils.set(list, { y: "110%" });
  const cleanup = whenInView(trigger, () =>
    animate(list, {
      y: ["110%", "0%"],
      duration: duration,
      delay: stagger(interval, { start: delay }),
      ease: EXPO_EASING,
    }),
  );
  return () => {
    cleanup?.();
    utils.set(list, { y: "0%" });
  };
}

/**
 * Desenha um traço de SVG quando ele chega a tela. Serve a moldura e os
 * fios do fechamento. Sob movimento reduzido o traço já nasce inteiro e só aparece.
 */
function drawStroke(targets, { delay = 0, duration } = {}) {
  const list = Array.from(targets ?? []).filter(Boolean);
  if (!list.length) return;
  const isReduced = isMotionReduced();

  if (isReduced) utils.set(list, { opacity: 0 });
  const cleanup = whenInView(list[0], () => {
    if (isReduced) {
      return animate(list, {
        opacity: [0, 1],
        duration: getDuration("--motion-fast"),
        delay: delay,
        ease: "linear",
      });
    }
    return animate(createDrawable(list), {
      draw: ["0 0", "0 1"],
      duration: duration ?? getDuration("--motion-slow") * 2,
      delay: stagger(60, { start: delay }),
      ease: "out(2)",
    });
  });
  return () => {
    cleanup?.();
    utils.set(list, { opacity: 1 });
  };
}

/* -------------------------------------------------------------------------
   Interação
   ------------------------------------------------------------------------- */

/**
 * Resposta ao toque no botão. Um degrau: é confirmação, não animação.
 * @param {Element} target - Botão a pulsar.
 * @returns {Animation | undefined} Animação em curso, ou undefined se o alvo não existe.
 */
export function pulse(target) {
  if (!target) return;
  return animate(target, {
    scale: [1, 0.97, 1],
    duration: getDuration("--motion-fast"),
    ease: steps(2),
  });
}

/**
 * A entrada do painel de tela cheia do fechamento, quando ele chega a tela. (A dobra
 * entra por CSS, em styles/residual.css §7.)
 *
 * A ordem é a leitura: primeiro a moldura desenha o campo, depois os fios
 * abrem a grade, depois as duas linhas da headline sobem de dentro do recorte,
 * e só então a promessa e o botão.
 *
 * Barato primeiro, caro depois: `reveal` só marca o elemento; `drawStroke` mede
 * cada traço e `raiseLines` escreve transform.
 * @param {object} parts - Partes do painel.
 * @param {NodeListOf<SVGPathElement>} parts.frame - Traços da moldura.
 * @param {NodeListOf<SVGLineElement>} parts.threads - Fios do painel.
 * @param {Element | null} parts.kicker - Rótulo de entrada.
 * @param {NodeListOf<Element>} parts.lines - Linhas da headline.
 * @param {Element | null} parts.body - Corpo do texto.
 * @param {Element | null} parts.action - Área do botão.
 * @param {Element | null} parts.footer - Rodapé.
 * @returns {() => void} Função que desfaz as animações.
 */
export function openPanel({ frame, threads, kicker, lines, body, action, footer }) {
  const step = isMotionReduced() ? 0 : 1;

  const cleanups = [
    reveal(kicker, { delay: 120 * step }),
    reveal(body, { delay: 780 * step }),
    reveal(action, { delay: 900 * step }),
    reveal(footer, { delay: 1020 * step }),
    drawStroke(frame, { delay: 100 * step }),
    drawStroke(threads, { delay: 260 * step, duration: 620 }),
    raiseLines(lines, { delay: 380 * step }),
  ];
  return () => {
    for (const cleanup of cleanups) cleanup?.();
  };
}
