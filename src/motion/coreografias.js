import { animate, createDrawable, splitText, stagger, steps, utils } from "animejs";
import { duracao, semMovimento } from "./tokens.js";
import { aoMudarPausa, estaPausado } from "./pausa.js";
import { abrirLeitura } from "./carregador.js";

const MARGEM = "0px 0px -80px 0px";
const EXPO = "cubicBezier(0.16, 1, 0.3, 1)";

/* Um IntersectionObserver nativo dispara cada revelação. */
let observador = null;
const pendentes = new Map();

function disparar(alvo) {
  const acoes = pendentes.get(alvo);
  if (!acoes) return;
  pendentes.delete(alvo);
  observador?.unobserve(alvo);
  for (const acao of acoes) {
    if (document.documentElement.classList.contains("movimento-falhou")) break;
    try { acao(); } catch (erro) {
      console.error(erro);
      pendentes.clear();
      observador?.disconnect();
      observador = null;
      abrirLeitura();
      break;
    }
  }
  if (!pendentes.size) {
    observador?.disconnect();
    observador = null;
  }
}

function aoEntrar(gatilho, executar) {
  if (!gatilho) return;
  if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
    const animacao = executar();
    return () => animacao?.revert?.();
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
  let animacao;
  const iniciar = () => { animacao = executar(); };
  const acoes = pendentes.get(gatilho) ?? new Set();
  acoes.add(iniciar);
  if (!pendentes.has(gatilho)) {
    pendentes.set(gatilho, acoes);
    try { observador.observe(gatilho); } catch (erro) {
      pendentes.delete(gatilho);
      if (!pendentes.size) { observador.disconnect(); observador = null; }
      throw erro;
    }
  }
  return () => {
    const restantes = pendentes.get(gatilho);
    restantes?.delete(iniciar);
    if (restantes && !restantes.size) {
      pendentes.delete(gatilho);
      observador?.unobserve(gatilho);
    }
    animacao?.revert?.();
    if (!pendentes.size) {
      observador?.disconnect();
      observador = null;
    }
  };
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
  const limpar = aoEntrar(alvo, () =>
    animate(alvo, {
      opacity: [0, 1],
      y: reduzido ? 0 : [deslocamento, 0],
      duration: reduzido ? duracao("--motion-fast") : duracao("--motion-base"),
      delay: atraso,
      ease: reduzido ? "linear" : steps(2),
    }),
  );
  return () => { limpar?.(); utils.set(alvo, { opacity: 1, y: 0 }); };
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
  const limpezas = [];
  for (const [indice, item] of lista.entries()) {
    limpezas.push(aoEntrar(item, () =>
      animate(item, {
        opacity: [0, 1],
        y: reduzido ? 0 : [10, 0],
        duration: reduzido ? duracao("--motion-fast") : duracao("--motion-base"),
        delay: reduzido ? 0 : Math.min(indice, 3) * intervalo,
        ease: reduzido ? "linear" : steps(2),
      }),
    ));
  }
  return () => { for (const limpar of limpezas) limpar?.(); utils.set(lista, { opacity: 1, y: 0 }); };
}

/** Espera as fontes antes de dividir; uma desmontagem ou falha impede escrita tardia no DOM. */
export async function mascaraDeLinha(alvo, { atraso = 0 } = {}, sinal) {
  if (!alvo) return;
  if (!semMovimento() && document.fonts?.ready) await document.fonts.ready;
  if (sinal?.aborted || !alvo.isConnected || document.documentElement.classList.contains("movimento-falhou")) return;
  let fatias;
  let limpar;
  try {
    // Registra o fallback antes de qualquer wrapper: se observe() lançar,
    // nenhum split assíncrono fica para trás.
    limpar = revelar(alvo, { atraso });
    if (!semMovimento()) {
      fatias = splitText(alvo, {
        lines: { wrap: "clip" },
        words: false,
        chars: false,
        accessible: true,
      });
    }
    return () => { limpar?.(); fatias?.revert(); };
  } catch (erro) {
    limpar?.();
    fatias?.revert();
    throw erro;
  }
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
    const limpar = aoEntrar(gatilho, () =>
      animate(lista, { opacity: [0, 1], duration: duracao("--motion-fast"), delay: atraso, ease: "linear" }),
    );
    return () => { limpar?.(); utils.set(lista, { opacity: 1 }); };
  }
  utils.set(lista, { y: "110%" });
  const limpar = aoEntrar(gatilho, () =>
    animate(lista, {
      y: ["110%", "0%"],
      duration: tempo,
      delay: stagger(intervalo, { start: atraso }),
      ease: EXPO,
    }),
  );
  return () => { limpar?.(); utils.set(lista, { y: "0%" }); };
}

/**
 * O carimbo: a revelacao de marca. Tres degraus, na duracao de celebracao.
 * Reservado ao numero da prova, ao selo da garantia e a semana do odometro.
 */
export function carimbar(alvo, { atraso = 0 } = {}) {
  if (!alvo) return;
  const reduzido = semMovimento();
  utils.set(alvo, { opacity: 0, scale: reduzido ? 1 : 1.14 });
  const limpar = aoEntrar(alvo, () =>
    animate(alvo, {
      opacity: [0, 1],
      scale: reduzido ? 1 : [1.14, 1],
      duration: reduzido ? duracao("--motion-fast") : duracao("--motion-celebracao"),
      delay: atraso,
      ease: reduzido ? "linear" : steps(3),
    }),
  );
  return () => { limpar?.(); utils.set(alvo, { opacity: 1, scale: 1 }); };
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
  const limpar = aoEntrar(lista[0], () => {
    if (reduzido) {
      return animate(lista, { opacity: [0, 1], duration: duracao("--motion-fast"), delay: atraso, ease: "linear" });
    }
    return animate(createDrawable(lista), {
      draw: ["0 0", "0 1"],
      duration: tempo ?? duracao("--motion-slow") * 2,
      delay: stagger(60, { start: atraso }),
      ease: "out(2)",
    });
  });
  return () => { limpar?.(); utils.set(lista, { opacity: 1 }); };
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
    laco.revert();
    for (const clone of clones) clone.remove();
  };
}

/** Estado da trilha medido pela seção, nunca pelo filho sticky. */
export function acenderEmSequencia(alvos, contexto, { atributo = "data-acesa", atributoAtual = null, fixo = false } = {}) {
  const lista = Array.from(alvos ?? []);
  if (!lista.length || !contexto) return () => {};
  let quadro = 0;
  let ultimo = -1;
  const atualizar = () => {
    quadro = 0;
    const reduzido = semMovimento();
    const caixa = contexto.getBoundingClientRect();
    const percurso = Math.max(1, innerHeight + caixa.height);
    const progresso = Math.max(0, Math.min(1, (innerHeight - caixa.top) / percurso));
    // `fixo`: o contexto tem um trilho sticky; acende so durante o trilho, do topo ate o fim dele.
    const trilho = caixa.height - innerHeight;
    const porTrilho = fixo && trilho > 1 ? Math.max(0, Math.min(1, -caixa.top / trilho)) : null;
    const acesas = reduzido ? lista.length
      : porTrilho !== null ? Math.min(lista.length, Math.floor(porTrilho * lista.length * 1.02))
      : Math.min(lista.length, Math.floor(progresso * lista.length * 1.35));
    if (acesas === ultimo) return;
    ultimo = acesas;
    for (const [indice, el] of lista.entries()) {
      el.toggleAttribute(atributo, indice < acesas);
      if (atributoAtual) el.toggleAttribute(atributoAtual, !reduzido && indice === acesas - 1);
    }
  };
  const pedir = () => { if (!quadro) quadro = requestAnimationFrame(atualizar); };
  atualizar();
  window.addEventListener("scroll", pedir, { passive: true });
  window.addEventListener("resize", pedir);
  const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  media?.addEventListener?.("change", pedir);
  return () => {
    cancelAnimationFrame(quadro);
    window.removeEventListener("scroll", pedir);
    window.removeEventListener("resize", pedir);
    media?.removeEventListener?.("change", pedir);
    for (const el of lista) {
      el.removeAttribute(atributoAtual ?? "data-atual");
      el.setAttribute(atributo, "");
    }
  };
}

/* -------------------------------------------------------------------------
   Interacao
   ------------------------------------------------------------------------- */

/** Resposta ao toque no botao. Um degrau: e confirmacao, nao animacao. */
export function pulsar(alvo) {
  if (!alvo || semMovimento()) return;
  return animate(alvo, { scale: [1, 0.97, 1], duration: duracao("--motion-fast"), ease: steps(2) });
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

  const limpezas = [
    revelar(kicker, { atraso: 120 * passo }),
    revelar(corpo, { atraso: 780 * passo }),
    revelar(acao, { atraso: 900 * passo }),
    revelar(rodape, { atraso: 1020 * passo }),
    desenhar(moldura, { atraso: 100 * passo }),
    desenhar(fios, { atraso: 260 * passo, tempo: 620 }),
    subirLinhas(linhas, { atraso: 380 * passo }),
  ];
  return () => { for (const limpar of limpezas) limpar?.(); };
}
