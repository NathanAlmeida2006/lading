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
export const LADRILHO = 320;
const ESPACO = 26; // distancia entre pontos, em px de layout
const MAX_PONTOS = 2600; // teto de pontos por quadro
const GRADE = 160; // distancia entre os fios da grade
// O ponto da malha sobe ou desce ate 18 px (`onda * 9`, com |onda| <= 2) e tem 1,5 px de lado.
const FOLGA = 24;

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

export class Campo {
  /**
   * @param {HTMLElement} raiz onde os ladrilhos entram (sem caixa; os ladrilhos sao `absolute` e se posicionam pela secao)
   * @param {{ variante: string, cores: { ponto: string, fio: string, acento: string }, reduzido: boolean }} opcoes
   */
  constructor(raiz, { variante, cores, reduzido }, ambiente = {}) {
    this.raiz = raiz;
    this.fiel = variante === "fiel";
    this.estelar = variante === "estelar";
    this.cores = cores;
    this.reduzido = reduzido;
    this.agendar = ambiente.agendar ?? ((f) => requestAnimationFrame(f));
    this.cancelar = ambiente.cancelar ?? ((id) => cancelAnimationFrame(id));
    this.agora = ambiente.agora ?? (() => performance.now());

    this.largura = 0;
    this.altura = 0;
    this.dpr = 1;
    this.espaco = ESPACO;
    this.colunas = 0;
    this.linhas = 0;
    this.estrelas = [];
    this.rede = [];
    this.lad = [];
    this.quadro = 0;
    this.vivo = false;
    this.pausado = false;
    // O quadro do ultimo instante pintado: o ladrilho que acorda com o laco parado (pausa) nasce na
    // mesma fase dos outros, e nao num `t = 0` que emendaria com eles num degrau de fase.
    this.ultimoT = 0;
    // Pontos projetados do quadro (estelar e fiel), calculados UMA vez por quadro e nao por ladrilho.
    this.prep = null;
    this.tPrep = NaN;
  }

  /**
   * A REDE da variante fiel.
   *
   * O estudo com recortes ampliados do site de origem (07/09/2026) corrigiu
   * uma leitura errada minha. Os pontos de la NAO sao aleatorios: nas areas
   * calmas aparece uma rede regular, de linhas e colunas uniformes, e o
   * adensamento so acontece nas cristas. A primeira tentativa sorteou os
   * pontos, e o resultado leu como estrela espalhada - porque randomizar
   * destroi exatamente o que faz a crista ser legivel.
   *
   * Entao a rede e regular em (u, v): `u` de lado, `v` de profundidade. O
   * relevo desloca cada ponto e a perspectiva comprime o que esta longe. A
   * crista aparece onde a superficie dobra e varias linhas de `v` caem quase
   * no mesmo ponto da tela; entre elas, a rede volta a ser rede.
   *
   * O `jitter` pequeno tira o ar de papel milimetrado sem apagar a
   * estrutura. Semente fixa: o campo e o mesmo em toda carga.
   */
  semear(cols, linhasZ) {
    let s = 20260907;
    const rnd = () => {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };
    const rede = [];
    for (let i = 0; i < cols; i += 1) {
      for (let j = 0; j < linhasZ; j += 1) {
        rede.push({
          u: (i / (cols - 1)) * 2 - 1 + (rnd() - 0.5) * (1.6 / cols),
          v: j / (linhasZ - 1) + (rnd() - 0.5) * (0.7 / linhasZ),
          j: 0.75 + rnd() * 0.5,
          acento: rnd() < 0.09,
        });
      }
    }
    this.rede = rede;
  }

  /** O que depende da area da secao: densidade dos pontos, estrelas, rede. */
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

    if (this.fiel) {
      // Densidade por area, com teto, pela mesma razao da malha: num monitor
      // grande a rede nao pode multiplicar o trabalho de cada quadro.
      const cols = Math.max(28, Math.min(104, Math.round(largura / 15)));
      const rows = Math.max(20, Math.min(52, Math.round(Math.min(altura, 1100) / 24)));
      if (this.rede.length !== cols * rows) this.semear(cols, rows);
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
      const lad = { canvas, ctx: null, y0: 0, h: 0, ativo: false, naTela: false };
      this.lad.push(lad);
      this.raiz.append(canvas);
      this.aoCriar?.(lad);
    }
    while (this.lad.length > n) {
      const lad = this.lad.pop();
      this.aoRemover?.(lad);
      lad.canvas.remove();
    }
    for (const [i, lad] of this.lad.entries()) {
      lad.y0 = i * LADRILHO;
      lad.h = Math.min(LADRILHO, this.altura - lad.y0);
      lad.canvas.style.top = `${lad.y0}px`;
      // O ultimo vai ate o fim da secao (a altura dela pode ser fracionaria); os outros tem 320 exatos.
      lad.canvas.style.height = i === n - 1 ? `calc(100% - ${lad.y0}px)` : `${LADRILHO}px`;
    }
  }

  /** Aloca o buffer do ladrilho e poe a escala e o deslocamento (o desenho usa coordenadas da secao). */
  medirLadrilho(lad) {
    const { dpr } = this;
    lad.ctx ??= lad.canvas.getContext("2d", { alpha: true });
    lad.canvas.width = Math.round(this.largura * dpr);
    lad.canvas.height = Math.round(lad.h * dpr);
    lad.ctx.setTransform(dpr, 0, 0, dpr, 0, -lad.y0 * dpr);
  }

  /** Quadro de um ladrilho. A conta e a de sempre, so no que cai dentro dele. */
  pintarLadrilho(lad, t) {
    const { ctx, y0 } = lad;
    const y1 = y0 + lad.h;
    // Com DPR fracionario o buffer do ULTIMO ladrilho passa da secao em ate um pixel do dispositivo
    // (319 x 1,25 = 398,75, buffer de 399): o canvas inteiro de antes desenhava, e o ponto que cai nessa
    // ultima linha parcial aparecia. A poda dos pontos olha um pixel de css alem.
    const yMax = y1 + 1;
    const { largura, altura, espaco, colunas, linhas } = this;
    const { ponto: corPonto, fio: corFio, acento: corAcento } = this.cores;
    ctx.clearRect(0, y0, largura, lad.h);

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
    for (let y = GRADE / 2; y < altura; y += GRADE) {
      const yy = Math.round(y) + 0.5;
      if (yy + 0.5 <= y0 || yy - 0.5 >= yMax) continue;
      ctx.moveTo(0, yy);
      ctx.lineTo(largura, yy);
    }
    ctx.stroke();

    if (this.fiel) {
      this.preparar(t);
      const { x, y, a, d, c, n } = this.prep;
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
   * Os pontos das variantes `estelar` e `fiel`, projetados UMA vez por quadro: cada ladrilho so
   * escolhe os seus. A conta de cada ponto e a de antes; `a` (opacidade) 0 e o ponto descartado.
   * Float64, e nao Float32: o `Math.round` das posicoes tem de cair onde sempre caiu.
   */
  preparar(t) {
    if (this.tPrep === t) return;
    this.tPrep = t;
    const { largura, altura } = this;
    const fonte = this.estelar ? this.estrelas : this.rede;
    const n = fonte.length;
    if (!this.prep || this.prep.x.length < n) {
      this.prep = { x: new Float64Array(n), y: new Float64Array(n), a: new Float64Array(n), d: new Float64Array(n), c: new Uint8Array(n), n };
    }
    const p = this.prep;
    p.n = n;

    if (this.estelar) {
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
      return;
    }

    // A REDE em perspectiva.
    //
    // A altura de referencia e LIMITADA: a secao pode ter 2600px, e usar a
    // altura dela como escala esticaria o relevo ate ele virar listra. O
    // campo desenha o mesmo relevo em qualquer secao.
    const vis = Math.min(altura, 900);
    const horizonte = altura * 0.4;
    for (let i = 0; i < n; i += 1) {
      const pt = fonte[i];
      const z = 1 + pt.v * pt.v * 8; // v ao quadrado adensa o fundo
      const k = 1.55 / z; // perspectiva, ~1,55 a 0,17
      const h =
        Math.sin(pt.u * 2.4 + z * 1.15 + t * 0.00032) * 0.6 +
        Math.sin(pt.u * 1.1 - z * 2.1 + t * 0.0002) * 0.4;
      const x = largura / 2 + pt.u * k * largura * 0.52;
      const y = horizonte + (0.9 - h * 0.72) * k * vis * 0.62;
      if (x < -8 || x > largura + 8 || y < -8 || y > altura + 8) {
        p.a[i] = 0;
        continue;
      }

      // Perto = maior e mais claro. E o unico "sombreamento" que existe
      // aqui: sem brilho, sem halo, sem gradiente (TR-03 e TR-09).
      const perto = Math.max(0, Math.min(1, 1.15 - z / 7));
      const alpha = (0.08 + perto * 0.62) * pt.j;
      if (alpha < 0.05) {
        p.a[i] = 0;
        continue;
      }
      p.a[i] = Math.min(0.9, alpha);
      p.c[i] = pt.acento ? 1 : 0;
      p.d[i] = perto > 0.6 ? 2 : 1.4;
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
    this.pintar(t);
    this.quadro = this.agendar(this.laco);
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
      this.quadro = this.agendar(this.laco);
    } else if (!deve && this.vivo) {
      this.vivo = false;
      this.cancelar(this.quadro);
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
    this.largura = largura;
    this.altura = altura;
    this.dpr = dpr;
    this.tPrep = NaN;
    this.densidade();
    this.fatiar();
    // A secao mudou de tamanho: tudo o que depende dela (estrelas, rede, altura) e outro desenho, entao
    // todo ladrilho com buffer e medido e pintado de novo, como o canvas inteiro de antes.
    for (const lad of this.lad) {
      if (!lad.ativo) continue;
      this.medirLadrilho(lad);
      if (!this.vivo) this.pintarLadrilho(lad, this.agora());
    }
  }

  parar() {
    this.vivo = false;
    this.cancelar(this.quadro);
  }

  soltar() {
    this.parar();
    for (const lad of this.lad) lad.canvas.remove();
    this.lad = [];
  }
}

/**
 * Liga um campo a uma raiz: observa o tamanho, a proximidade e a pausa, e devolve a funcao que desfaz.
 * Cada ladrilho tem o proprio par de observadores (perto e na tela); a pagina so os usa.
 */
export function ligarCampo(raiz, opcoes, { aoMudarPausa, estaPausado }) {
  const campo = new Campo(raiz, opcoes);
  const porCanvas = new Map();
  let perto = null;
  let visivel = null;

  campo.aoCriar = (lad) => {
    porCanvas.set(lad.canvas, lad);
    perto?.observe(lad.canvas);
    visivel?.observe(lad.canvas);
  };
  campo.aoRemover = (lad) => {
    perto?.unobserve(lad.canvas);
    visivel?.unobserve(lad.canvas);
    porCanvas.delete(lad.canvas);
  };

  const comIO = typeof IntersectionObserver !== "undefined";
  if (comIO) {
    perto = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          const lad = porCanvas.get(e.target);
          if (lad) campo.perto(lad, e.isIntersecting);
        }
      },
      { rootMargin: "100% 0px" },
    );
    if (!opcoes.reduzido) {
      visivel = new IntersectionObserver(
        (entradas) => {
          for (const e of entradas) {
            const lad = porCanvas.get(e.target);
            if (lad) campo.visivel(lad, e.isIntersecting);
          }
        },
        { rootMargin: "120px 0px" },
      );
    }
  }

  // O tamanho e o da SECAO (a raiz nao tem caixa: ver `CampoDePontos.jsx`), a caixa de padding, que e o
  // que o canvas `inset-0` de antes cobria. O `ResizeObserver` avisa na hora de observar e a cada mudanca
  // da borda (so o padding mudar tambem conta), e dentro dele o layout esta limpo.
  const pai = raiz.parentElement;
  const tamanho = new ResizeObserver(() => {
    campo.tamanho(pai.clientWidth, pai.clientHeight, Math.min(window.devicePixelRatio || 1, 2));
    // Sem IntersectionObserver todo ladrilho vale (o comportamento de antes).
    if (!comIO) for (const lad of campo.lad) campo.perto(lad, true);
  });
  tamanho.observe(pai, { box: "border-box" });

  campo.pausa(estaPausado());
  const soltarPausa = comIO && !opcoes.reduzido ? aoMudarPausa((valor) => campo.pausa(valor)) : () => {};

  return () => {
    perto?.disconnect();
    visivel?.disconnect();
    soltarPausa();
    tamanho.disconnect();
    campo.soltar();
  };
}
