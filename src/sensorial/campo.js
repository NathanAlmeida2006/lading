import { aoMudarPausa, estaPausado } from "./pausa.js";

/**
 * O campo de pontos de UMA secao, desenhado em LADRILHOS.
 *
 * O campo cobre a secao inteira, e ha secoes de 3.482 px (a prova). Um canvas desse tamanho
 * (1905 x 3482 = 6,6 MP, 26 MB) era redesenhado e reenviado ao compositor por quadro, e e isso, e
 * nao o desenho, que derrubava a pagina a 20-30 quadros por segundo ao rolar a prova: medido
 * com o buffer em um quarto da area, o problema some, e escondendo o canvas (`visibility`) ele
 * continua. O custo e o TAMANHO do buffer atualizado a cada quadro.
 *
 * Entao a secao e fatiada em ladrilhos de 320 px de altura (um `<canvas>` cada), e a cada quadro so
 * os que estao na tela sao atualizados: ~2,5 MP em vez de 6,6 MP, e o buffer so existe nos que estao
 * a ate uma tela de distancia. O DESENHO nao mudou: cada ladrilho roda a mesma conta, nas mesmas
 * coordenadas da secao (so o que cai dentro dele), e os ladrilhos juntos sao, byte a byte, o canvas
 * inteiro de antes (conferido nos tres tipos de campo, com DPR 1, 1,25, 1,5 e 2).
 *
 * Por que 320: a emenda entre ladrilhos so e invisivel se a altura deles em pixels do dispositivo for
 * inteira, e 320 x DPR e inteiro para todo DPR em passos de 0,05 (1,25 -> 400, 1,5 -> 480, 2 -> 640).
 *
 * Estados, como eram (agora por ladrilho, que e quem tem buffer):
 *   `ativo`   - o ladrilho esta a menos de uma tela de distancia: o buffer existe e tem um quadro;
 *   `visivel` - o ladrilho esta na tela (com 120 px de folga): o laco o atualiza;
 *   `pausado` - o visitante pediu pausa (WCAG 2.2.2): fica no ultimo quadro;
 *   `reduzido`- `prefers-reduced-motion`: um quadro unico e nunca anda.
 */
const LADRILHO = 320;
const ESPACO = 26; // distancia entre pontos, em px de layout
const MAX_PONTOS = 2600; // teto de pontos por quadro
const GRADE = 160; // distancia entre os fios da grade
// O ponto da malha sobe ou desce ate 18 px (`onda * 9`, com |onda| <= 2) e tem 1,5 px de lado.
const FOLGA = 24;
// Toque (`opcoes.toque`): o desenho do campo e o que mais pesa no celular, entao ele anda a no maximo 30
// quadros por segundo e congela enquanto o dedo rola. ponytail: teto fixo de 30 fps; calibrar so aqui (o FundoFluido usa a mesma).
export const PASSO_TOQUE = 1000 / 30 - 4; // ms; a folga mantem um a cada dois quadros a 60 Hz
const PARADA_TOQUE = 150; // ms sem `scroll` para o campo voltar a andar
// Um ouvinte so para todos os campos (ha um por secao): o instante do ultimo `scroll`, no relogio do rAF.
let ultimaRolagem = -Infinity;
let ouvindoRolagem = false;

/**
 * A `estelar` (vem do Social Vibe do app): campo estelar, pontos com
 * profundidade (z), cada um na sua velocidade de deriva e na sua fase de
 * cintilar, sem grade por tras. Semente fixa, e o campo emenda nas bordas.
 */
function semearEstrelas(n) {
  let s = 20260907;
  const rnd = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const estrelas = [];
  for (let i = 0; i < n; i += 1) estrelas.push({ x: rnd(), y: rnd(), z: 0.25 + rnd() * 0.75, fase: rnd() * 6.28, acento: rnd() < 0.06 });
  return estrelas;
}

class Campo {
  /**
   * @param {HTMLElement} raiz onde os ladrilhos entram (sem caixa; os ladrilhos sao `absolute` e se posicionam pela secao)
   * @param {{ variante: string, cores: { ponto: string, fio: string, acento: string }, reduzido: boolean, toque: boolean }} opcoes
   */
  constructor(raiz, { variante, cores, reduzido, toque }) {
    this.raiz = raiz;
    this.estelar = variante === "estelar";
    this.cores = cores;
    this.reduzido = reduzido;
    this.toque = toque;
    if (toque && !ouvindoRolagem) {
      ouvindoRolagem = true;
      window.addEventListener("scroll", () => (ultimaRolagem = performance.now()), { passive: true });
    }
    // Toque: o tempo do quadro que o campo nao desenhou (congelado), descontado para a onda retomar sem salto de fase.
    this.desconto = 0;
    this.tAnterior = NaN; // o ultimo quadro do rAF visto pelo laco (pintado ou nao)
    this.tPintado = -Infinity; // o ultimo quadro de fato pintado, para o teto de 30 fps

    this.largura = 0;
    this.altura = 0;
    // A altura usada na GEOMETRIA dos pontos: so acompanha a secao quando ela muda de verdade (ver `tamanho`).
    this.alturaGeo = 0;
    this.dpr = 1;
    this.espaco = ESPACO;
    this.colunas = 0;
    this.linhas = 0;
    this.estrelas = [];
    this.lad = [];
    this.quadro = 0;
    this.vivo = false;
    this.pausado = false;
    // O quadro do ultimo instante pintado: o ladrilho que acorda com o laco parado (pausa) nasce na
    // mesma fase dos outros, e nao num `t = 0` que emendaria com eles num degrau de fase.
    this.ultimoT = 0;
    // Pontos projetados do quadro (estelar), calculados UMA vez por quadro e nao por ladrilho.
    this.prep = null;
    this.tPrep = NaN;
    // Cada ladrilho observado e recalculado pelo navegador a CADA quadro (52 canvases x 2 observadores,
    // medido: 908 ms de 8.405 ms da thread principal ao rolar), mesmo o de uma secao a milhares de px da
    // tela. Entao os ladrilhos so sao observados enquanto a secao esta perto (`secaoPerto`, ligado em ligarCampo).
    this.porCanvas = new Map();
    this.secaoPerto = false;
    this.observaPerto = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          const lad = this.porCanvas.get(e.target);
          if (lad) this.perto(lad, e.isIntersecting);
        }
      },
      { rootMargin: "100% 0px" },
    );
    this.observaVisivel = reduzido ? null : new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          const lad = this.porCanvas.get(e.target);
          if (lad) this.visivel(lad, e.isIntersecting);
        }
      },
      { rootMargin: toque ? "0px" : "120px 0px" },
    );
  }

  /** O que depende da area da secao: densidade dos pontos e estrelas. */
  densidade() {
    const { largura, altura } = this;
    // Densidade por area, com teto: o espaco cresce se a tela for grande
    // demais para a malha caber no orcamento de pontos.
    let espaco = ESPACO;
    while ((largura / espaco) * (altura / espaco) > MAX_PONTOS) espaco += 2;
    this.espaco = espaco;
    this.colunas = Math.ceil(largura / espaco) + 1;
    this.linhas = Math.ceil(altura / espaco) + 1;

    if (this.estelar) {
      const alvo = Math.max(60, Math.min(260, Math.round((largura * altura) / 5500)));
      if (this.estrelas.length !== alvo) this.estrelas = semearEstrelas(alvo);
    }

  }

  /** Cria, remove e reposiciona os ladrilhos para a altura atual. */
  fatiar() {
    const n = Math.ceil(this.altura / LADRILHO);
    while (this.lad.length < n) {
      const canvas = document.createElement("canvas");
      canvas.className = "campo absolute left-0 w-full pointer-events-none";
      // Sem buffer ate ficar perto da tela (o padrao de um canvas e 300 x 150): 0 e o "sem buffer" de `perto(lad, false)`.
      canvas.width = 0;
      canvas.height = 0;
      const lad = { canvas, ctx: null, y0: 0, ativo: false, naTela: false, novo: true };
      this.lad.push(lad);
      this.raiz.append(canvas);
      this.porCanvas.set(canvas, lad);
      if (this.secaoPerto) this.observar(lad);
    }
    while (this.lad.length > n) {
      const lad = this.lad.pop();
      this.desobservar(lad);
      this.porCanvas.delete(lad.canvas);
      lad.canvas.remove();
    }
    for (const [i, lad] of this.lad.entries()) {
      lad.y0 = i * LADRILHO;
      // Todo ladrilho tem a altura cheia, o ultimo tambem: a secao recorta (`overflow-clip`). Assim
      // uma secao que cresce ou encolhe (o acordeao da FAQ) nao realoca o buffer do ultimo a cada quadro.
      lad.canvas.style.top = `${lad.y0}px`;
      lad.canvas.style.height = `${LADRILHO}px`;
    }
  }

  /** Observa o ladrilho nos dois observadores (so com a secao perto). */
  observar(lad) {
    this.observaPerto.observe(lad.canvas);
    this.observaVisivel?.observe(lad.canvas);
  }

  /** Larga o ladrilho nos dois observadores. */
  desobservar(lad) {
    this.observaPerto.unobserve(lad.canvas);
    this.observaVisivel?.unobserve(lad.canvas);
  }

  /** Aloca o buffer do ladrilho e poe a escala e o deslocamento (o desenho usa coordenadas da secao). */
  medirLadrilho(lad) {
    const { dpr } = this;
    lad.ctx ??= lad.canvas.getContext("2d", { alpha: true });
    // Atribuir width/height LIMPA o canvas, mesmo com o valor igual: so mexe se o tamanho mudou.
    const largura = Math.round(this.largura * dpr);
    const altura = Math.round(LADRILHO * dpr);
    if (lad.canvas.width !== largura) lad.canvas.width = largura;
    if (lad.canvas.height !== altura) lad.canvas.height = altura;
    lad.ctx.setTransform(dpr, 0, 0, dpr, 0, -lad.y0 * dpr);
  }

  /** Quadro de um ladrilho. A conta e a de sempre, so no que cai dentro dele. */
  pintarLadrilho(lad, t) {
    const { ctx, y0 } = lad;
    const y1 = y0 + LADRILHO;
    // Com DPR fracionario o buffer do ULTIMO ladrilho passa da secao em ate um pixel do dispositivo
    // (319 x 1,25 = 398,75, buffer de 399): o canvas inteiro de antes desenhava, e o ponto que cai nessa
    // ultima linha parcial aparecia. A poda dos pontos olha um pixel de css alem.
    const yMax = y1 + 1;
    const { largura, altura, espaco, colunas, linhas } = this;
    const { ponto: corPonto, fio: corFio, acento: corAcento } = this.cores;
    ctx.clearRect(0, y0, largura, LADRILHO);

    if (this.estelar) {
      this.preparar(t);
      const { x, y, a, d, c, n } = this.prep;
      // Perto (z alto) = mais rapida, maior e mais clara.
      for (let i = 0; i < n; i += 1) {
        if (a[i] === 0) continue;
        const yr = y[i];
        if (yr + d[i] <= y0 || yr >= yMax) continue;
        ctx.globalAlpha = a[i];
        ctx.fillStyle = c[i] ? corAcento : corPonto;
        ctx.fillRect(x[i], yr, d[i], d[i]);
      }
      ctx.globalAlpha = 1;
      return;
    }

    // A grade: fios de 1px, o mesmo vocabulario do resto da pagina.
    ctx.strokeStyle = corFio;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    for (let x = GRADE / 2; x < largura; x += GRADE) {
      ctx.moveTo(Math.round(x) + 0.5, y0);
      ctx.lineTo(Math.round(x) + 0.5, y1);
    }
    for (let y = GRADE / 2; y < yMax; y += GRADE) {
      const yy = Math.round(y) + 0.5;
      if (yy + 0.5 <= y0 || yy - 0.5 >= yMax) continue;
      ctx.moveTo(0, yy);
      ctx.lineTo(largura, yy);
    }
    ctx.stroke();

    // A superficie: duas senoides cruzadas deslocam o ponto no eixo Y, e a
    // mesma conta manda na opacidade. E o que faz a malha ler como relevo em
    // vez de chuvisco - ponto alto aparece, ponto baixo some.
    ctx.fillStyle = corPonto;
    const jIni = Math.max(0, Math.floor((y0 - FOLGA) / espaco));
    const jFim = Math.min(linhas - 1, Math.ceil((y1 + FOLGA) / espaco));
    for (let i = 0; i < colunas; i += 1) {
      const x = i * espaco;
      for (let j = jIni; j <= jFim; j += 1) {
        const y = j * espaco;
        const onda =
          Math.sin(x * 0.011 + t * 0.00042) * Math.cos(y * 0.013 - t * 0.00031) +
          Math.sin((x + y) * 0.006 + t * 0.00019);
        const alpha = 0.06 + Math.max(0, onda) * 0.34;
        if (alpha <= 0.07) continue;
        ctx.globalAlpha = alpha;
        ctx.fillRect(Math.round(x), Math.round(y + onda * 9), 1.5, 1.5);
      }
    }
    ctx.globalAlpha = 1;
  }

  /**
   * Os pontos da variante `estelar`, projetados UMA vez por quadro: cada ladrilho so escolhe os
   * seus. A conta de cada ponto e a de antes; `a` (opacidade) 0 e o ponto descartado.
   * Float64, e nao Float32: o `Math.round` das posicoes tem de cair onde sempre caiu.
   */
  preparar(t) {
    if (this.tPrep === t) return;
    this.tPrep = t;
    const { largura, alturaGeo: altura } = this;
    const fonte = this.estrelas;
    const n = fonte.length;
    if (!this.prep || this.prep.x.length < n) {
      this.prep = { x: new Float64Array(n), y: new Float64Array(n), a: new Float64Array(n), d: new Float64Array(n), c: new Uint8Array(n), n };
    }
    const p = this.prep;
    p.n = n;

    for (let i = 0; i < n; i += 1) {
      const st = fonte[i];
      const x = ((st.x + t * 0.000015 * st.z) % 1) * largura;
      const y = ((st.y + t * 0.000009 * st.z) % 1) * altura;
      const alpha = Math.min(1, (0.12 + st.z * 0.6) * (0.6 + Math.sin(t * 0.0018 + st.fase) * 0.4));
      if (alpha < 0.04) {
        p.a[i] = 0;
        continue;
      }
      p.a[i] = alpha;
      p.c[i] = st.acento ? 1 : 0;
      p.d[i] = st.z > 0.75 ? 2 : st.z > 0.45 ? 1.5 : 1;
      p.x[i] = Math.round(x);
      p.y[i] = Math.round(y);
    }
  }

  /** Um quadro: so os ladrilhos que estao na tela. */
  pintar(t) {
    this.ultimoT = t;
    for (const lad of this.lad) if (lad.ativo && lad.naTela) this.pintarLadrilho(lad, t);
  }

  laco = (t) => {
    if (!this.vivo) return;
    if (!this.toque) this.pintar(t);
    else {
      const dt = t - (this.tAnterior || t);
      this.tAnterior = t;
      if (t - ultimaRolagem < PARADA_TOQUE) this.desconto += dt;
      else if (t - this.tPintado >= PASSO_TOQUE) {
        this.tPintado = t;
        this.pintar(t - this.desconto);
      }
    }
    this.quadro = requestAnimationFrame(this.laco);
  };

  // Sob movimento reduzido fica no quadro unico: o campo e ornamento e nao
  // carrega informacao nenhuma.
  //
  // Anda so na tela E se o visitante nao pausou (WCAG 2.2.2): pausado, o campo
  // fica no ultimo quadro.
  sincronizar() {
    const deve = !this.reduzido && !this.pausado && this.lad.some((lad) => lad.ativo && lad.naTela);
    if (deve && !this.vivo) {
      this.vivo = true;
      this.tAnterior = NaN;
      this.quadro = requestAnimationFrame(this.laco);
    } else if (!deve && this.vivo) {
      this.vivo = false;
      cancelAnimationFrame(this.quadro);
    }
  }

  // O buffer so existe PERTO da tela. Com todos vivos o celular segura dezenas de MB de pixels que
  // ninguem ve. Fora de uma tela de folga, em cima e embaixo, o buffer e liberado; ele volta a ser
  // pintado antes de entrar. O quadro e deterministico (semente fixa), entao a volta nao muda nada.
  perto(lad, sim) {
    if (sim === lad.ativo) return;
    lad.ativo = sim;
    if (sim) {
      this.medirLadrilho(lad);
      this.pintarLadrilho(lad, this.ultimoT);
    } else {
      lad.canvas.width = 0;
      lad.canvas.height = 0;
    }
    this.sincronizar();
  }

  visivel(lad, sim) {
    // Toque: o laco nao pinta durante a rolagem, e o ladrilho que entra foi pintado quando acordou, talvez segundos atras. Sem isto ele
    // apareceria numa fase da onda diferente da dos vizinhos, com a emenda visivel.
    if (this.toque && sim && !lad.naTela && lad.ativo) this.pintarLadrilho(lad, this.ultimoT);
    lad.naTela = sim;
    this.sincronizar();
  }

  pausa(sim) {
    this.pausado = sim;
    this.sincronizar();
  }

  // Mede de novo so quando o tamanho da CAIXA mudou. `resize` da janela dispara
  // a cada vez que a barra do navegador entra ou sai no celular, e isso realocava
  // o buffer de cada canvas no meio da rolagem.
  tamanho(l, a, dpr) {
    const largura = Math.max(1, Math.round(l));
    const altura = Math.max(1, Math.round(a));
    if (largura === this.largura && altura === this.altura) return;
    // Uma secao que cresce ou encolhe um pouco (o acordeao da FAQ, ao abrir) nao pode arrastar a onda
    // junto: o centro dela e `altura / 2`, e a cada quadro da animacao todos os pontos andavam e o
    // fundo cintilava. A geometria so muda com uma variacao grande ou com a largura.
    const geoAntes = `${this.largura}:${this.alturaGeo}:${this.dpr}`;
    if (!this.alturaGeo || largura !== this.largura || Math.abs(altura - this.alturaGeo) >= 240) this.alturaGeo = altura;
    this.largura = largura;
    this.altura = altura;
    this.dpr = dpr;
    const mudouGeo = geoAntes !== `${largura}:${this.alturaGeo}:${dpr}`;
    this.tPrep = NaN;
    this.densidade();
    this.fatiar();
    // A secao mudou de tamanho: tudo o que depende dela (estrelas, rede, altura) e outro desenho, entao
    // todo ladrilho com buffer e medido e pintado de novo, como o canvas inteiro de antes.
    // Um ladrilho que nasce porque a secao cresceu fica colado a um que ja esta perto da tela: acorda
    // agora, e nao quando o IntersectionObserver avisar (alguns quadros depois, com o canto em branco).
    for (const [i, lad] of this.lad.entries()) {
      if (!lad.novo) continue;
      lad.novo = false;
      if (i > 0 && this.lad[i - 1].ativo) this.perto(lad, true);
    }
    // A `estelar` desenha pela geometria, que so muda com `mudouGeo`: crescer um pouco (o acordeao)
    // so recorta mais ou menos do mesmo desenho, e repintar tudo a cada quadro da animacao dobrava o
    // trabalho do laco e engasgava a abertura de respostas grandes. A `malha` conta linhas pela
    // altura, entao ela repinta.
    if (!mudouGeo && this.estelar) return;
    for (const lad of this.lad) {
      if (!lad.ativo) continue;
      this.medirLadrilho(lad);
      // Pinta ja, no mesmo tick: com o laco vivo, esperar o proximo quadro deixava um quadro em branco
      // (o buffer foi limpo) a cada mudanca de altura, e o fundo piscava enquanto a FAQ animava.
      this.pintarLadrilho(lad, this.vivo ? this.ultimoT : performance.now());
    }
  }

  soltar() {
    this.vivo = false;
    cancelAnimationFrame(this.quadro);
    this.observaPerto.disconnect();
    this.observaVisivel?.disconnect();
    for (const lad of this.lad) lad.canvas.remove();
    this.lad = [];
  }
}

/**
 * Liga um campo a uma raiz: observa o tamanho, a proximidade e a pausa, e devolve a funcao que desfaz.
 * Cada ladrilho tem o proprio par de observadores (perto e na tela); a pagina so os usa.
 */
export function ligarCampo(raiz, opcoes) {
  const campo = new Campo(raiz, opcoes);

  // O tamanho e o da SECAO (a raiz nao tem caixa: ver `CampoDePontos.jsx`), a caixa de padding, que e o
  // que o canvas `inset-0` de antes cobria. O `ResizeObserver` avisa na hora de observar e a cada mudanca
  // da borda (so o padding mudar tambem conta), e dentro dele o layout esta limpo.
  const pai = raiz.parentElement;
  // A margem (150%) e MAIOR que a do `perto` (100%): quando a secao sai dela, o buffer de cada ladrilho
  // ja foi liberado. `unobserve` nao avisa `false`, entao ele e dito aqui mesmo (sem efeito se ja foi).
  const secao = new IntersectionObserver(
    (entradas) => {
      const sim = entradas[entradas.length - 1].isIntersecting;
      if (sim === campo.secaoPerto) return;
      campo.secaoPerto = sim;
      for (const lad of campo.lad) {
        if (sim) campo.observar(lad);
        else {
          campo.desobservar(lad);
          campo.perto(lad, false);
          campo.visivel(lad, false);
        }
      }
    },
    { rootMargin: "150% 0px" },
  );
  secao.observe(pai);
  const tamanho = new ResizeObserver(() => {
    campo.tamanho(pai.clientWidth, pai.clientHeight, Math.min(window.devicePixelRatio || 1, 2));
  });
  tamanho.observe(pai, { box: "border-box" });

  campo.pausa(estaPausado());
  const soltarPausa = !opcoes.reduzido ? aoMudarPausa((valor) => campo.pausa(valor)) : () => {};

  return () => {
    secao.disconnect();
    soltarPausa();
    tamanho.disconnect();
    campo.soltar();
  };
}

/** As cores do campo, lidas dos tokens do CSS. */
export function coresDoCampo() {
  const estilo = getComputedStyle(document.documentElement);
  const cor = (nome, padrao) => estilo.getPropertyValue(nome).trim() || padrao;
  return { ponto: cor("--bone", "#ededf0"), fio: cor("--line", "#2c2c33"), acento: cor("--acento", "#d2202c") };
}
