import { subscribeToPause, isPaused } from "./pause.js";

/**
 * O campo de pontos de UMA seção, desenhado em LADRILHOS.
 *
 * O campo cobre a seção inteira, e há seções altas (uma delas, já removida, media 3.482 px). Um canvas desse tamanho
 * (1905 x 3482 = 6,6 MP, 26 MB) era redesenhado e reenviado ao compositor por quadro, e é isso, e
 * não o desenho, que derrubava a página a 20-30 quadros por segundo ao rolar a seção: medido
 * com o buffer em um quarto da área, o problema some, e escondendo o canvas (`visibility`) ele
 * continua. O custo é o TAMANHO do buffer atualizado a cada quadro.
 *
 * Então a seção é fatiada em ladrilhos de 320 px de altura (um `<canvas>` cada), e a cada quadro só
 * os que estão na tela são atualizados: ~2,5 MP em vez de 6,6 MP, e o buffer só existe nos que estão
 * a até uma tela de distância. O DESENHO não mudou: cada ladrilho roda a mesma conta, nas mesmas
 * coordenadas da seção (só o que cai dentro dele), e os ladrilhos juntos são, byte a byte, o canvas
 * inteiro de antes (conferido nos três tipos de campo, com DPR 1, 1,25, 1,5 e 2).
 *
 * Por que 320: a emenda entre ladrilhos só é invisível se a altura deles em pixels do dispositivo for
 * inteira, e 320 x DPR é inteiro para todo DPR em passos de 0,05 (1,25 -> 400, 1,5 -> 480, 2 -> 640).
 *
 * Estados, como eram (agora por ladrilho, que é quem tem buffer):
 *   `isActive`   - o ladrilho está a menos de uma tela de distância: o buffer existe e tem um quadro;
 *   `isOnScreen` - o ladrilho está na tela (com 120 px de folga): o laço o atualiza;
 *   `isPausedByUser` - o visitante pediu pausa (WCAG 2.2.2): fica no último quadro;
 *   `isReduced`- `prefers-reduced-motion`: um quadro único e nunca anda.
 */
const TILE_HEIGHT = 320;
const POINT_SPACING = 26; // distância entre pontos, em px de layout
const MAX_POINTS = 2600; // teto de pontos por quadro
const GRID_STEP = 160; // distância entre os fios da grade
// O ponto da malha sobe ou desce até 18 px (`onda * 9`, com |onda| <= 2) e tem 1,5 px de lado.
const WAVE_MARGIN = 24;
// Toque (`options.isTouch`): o desenho do campo é o que mais pesa no celular, então ele anda a no máximo 30
// quadros por segundo (não congela na rolagem). ponytail: teto fixo de 30 fps; calibrar só aqui (o FluidBackground usa a mesma).
export const TOUCH_FRAME_STEP_MS = 1000 / 30 - 4; // ms; a folga mantém um a cada dois quadros a 60 Hz

/**
 * A `estelar` (vem do Social Vibe do app): campo estelar, pontos com
 * profundidade (z), cada um na sua velocidade de deriva e na sua fase de
 * cintilar, sem grade por trás. Semente fixa, e o campo emenda nas bordas.
 */
function seedStars(count) {
  let seed = 20260907;
  const random = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const stars = [];
  for (let i = 0; i < count; i += 1)
    stars.push({
      x: random(),
      y: random(),
      z: 0.25 + random() * 0.75,
      phase: random() * 6.28,
      accent: random() < 0.06,
    });
  return stars;
}

class Field {
  /**
   * @param {HTMLElement} root - Onde os ladrilhos entram (sem caixa; os ladrilhos são `absolute` e se posicionam pela seção).
   * @param {object} options - Opções do campo.
   * @param {string} options.variant - `estelar` (pontos com profundidade) ou a malha.
   * @param {{ dot: string, thread: string, accent: string }} options.colors - Cores dos pontos, dos fios e do acento.
   * @param {boolean} options.isReduced - Movimento reduzido: um quadro e para.
   * @param {boolean} options.isTouch - Ponteiro grosso: limita a 30 quadros por segundo.
   */
  constructor(root, { variant, colors, isReduced, isTouch }) {
    this.root = root;
    this.isStellar = variant === "estelar";
    this.colors = colors;
    this.isReduced = isReduced;
    this.isTouch = isTouch;
    // Toque: o tempo do quadro que o campo não desenhou (congelado), descontado para a onda retomar sem salto de fase.
    // O relógio do campo NÃO anda com o laço parado (fora da tela, pausa): `discount` soma o tempo parado, e o
    // desenho usa `time - discount`. Sem isso, ao voltar à seção a onda saltava para onde o relógio de parede a levaria. Nasce parado: o primeiro quadro é o instante 0.
    this.discount = 0;
    this.stoppedAt = performance.now();
    this.paintedTime = -Infinity; // o último quadro de fato pintado, para o teto de 30 fps

    this.width = 0;
    this.height = 0;
    // A altura usada na GEOMETRIA dos pontos: só acompanha a seção quando ela muda de verdade (ver `setSize`).
    this.geoHeight = 0;
    this.dpr = 1;
    this.spacing = POINT_SPACING;
    this.columns = 0;
    this.lines = 0;
    this.stars = [];
    this.tiles = [];
    this.frame = 0;
    this.isAlive = false;
    this.isPausedByUser = false;
    // O quadro do último instante pintado: o ladrilho que acorda com o laço parado (pausa) nasce na
    // mesma fase dos outros, e não num `t = 0` que emendaria com eles num degrau de fase.
    this.lastTime = 0;
    // Pontos projetados do quadro (estelar), calculados UMA vez por quadro e não por ladrilho.
    this.projected = null;
    this.projectedTime = NaN;
    // Cada ladrilho observado e recalculado pelo navegador a CADA quadro (52 canvases x 2 observadores,
    // medido: 908 ms de 8.405 ms da thread principal ao rolar), mesmo o de uma seção a milhares de px da
    // tela. Então os ladrilhos só são observados enquanto a seção está perto (`isSectionNear`, ligado em startField).
    this.tileByCanvas = new Map();
    this.isSectionNear = false;
    this.nearObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const tile = this.tileByCanvas.get(entry.target);
          if (tile) this.setNear(tile, entry.isIntersecting);
        }
      },
      { rootMargin: "100% 0px" },
    );
    this.visibleObserver = isReduced
      ? null
      : new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              const tile = this.tileByCanvas.get(entry.target);
              if (tile) this.setVisible(tile, entry.isIntersecting);
            }
          },
          { rootMargin: isTouch ? "0px" : "120px 0px" },
        );
  }

  /** O que depende da área da seção: densidade dos pontos e estrelas. */
  updateDensity() {
    const { width, height } = this;
    // Densidade por área, com teto: o espaço cresce se a tela for grande
    // demais para a malha caber no orçamento de pontos.
    let spacing = POINT_SPACING;
    while ((width / spacing) * (height / spacing) > MAX_POINTS) spacing += 2;
    this.spacing = spacing;
    this.columns = Math.ceil(width / spacing) + 1;
    this.lines = Math.ceil(height / spacing) + 1;

    if (this.isStellar) {
      const target = Math.max(60, Math.min(260, Math.round((width * height) / 5500)));
      if (this.stars.length !== target) this.stars = seedStars(target);
    }
  }

  /** Cria, remove e reposiciona os ladrilhos para a altura atual. */
  sliceTiles() {
    const count = Math.ceil(this.height / TILE_HEIGHT);
    while (this.tiles.length < count) {
      const canvas = document.createElement("canvas");
      canvas.className = "input-field absolute left-0 w-full pointer-events-none";
      // Sem buffer até ficar perto da tela (o padrão de um canvas e 300 x 150): 0 e o "sem buffer" de `setNear(tile, false)`.
      canvas.width = 0;
      canvas.height = 0;
      const tile = { canvas, ctx: null, y0: 0, isActive: false, isOnScreen: false, isNew: true };
      this.tiles.push(tile);
      this.root.append(canvas);
      this.tileByCanvas.set(canvas, tile);
      if (this.isSectionNear) this.watchTile(tile);
    }
    while (this.tiles.length > count) {
      const tile = this.tiles.pop();
      this.unwatchTile(tile);
      this.tileByCanvas.delete(tile.canvas);
      tile.canvas.remove();
    }
    for (const [i, tile] of this.tiles.entries()) {
      tile.y0 = i * TILE_HEIGHT;
      // Todo ladrilho tem a altura cheia, o último também: a seção recorta (`overflow-clip`). Assim
      // uma seção que cresce ou encolhe (o acordeão da FAQ) não realoca o buffer do último a cada quadro.
      tile.canvas.style.top = `${tile.y0}px`;
      tile.canvas.style.height = `${TILE_HEIGHT}px`;
    }
  }

  /** Observa o ladrilho nos dois observadores (só com a seção perto). */
  watchTile(tile) {
    this.nearObserver.observe(tile.canvas);
    this.visibleObserver?.observe(tile.canvas);
  }

  /** Larga o ladrilho nos dois observadores. */
  unwatchTile(tile) {
    this.nearObserver.unobserve(tile.canvas);
    this.visibleObserver?.unobserve(tile.canvas);
  }

  /** Aloca o buffer do ladrilho e põe a escala e o deslocamento (o desenho usa coordenadas da seção). */
  measureTile(tile) {
    const { dpr } = this;
    tile.ctx ??= tile.canvas.getContext("2d", { alpha: true });
    // Atribuir width/height LIMPA o canvas, mesmo com o valor igual: só mexe se o tamanho mudou.
    const width = Math.round(this.width * dpr);
    const height = Math.round(TILE_HEIGHT * dpr);
    if (tile.canvas.width !== width) tile.canvas.width = width;
    if (tile.canvas.height !== height) tile.canvas.height = height;
    tile.ctx.setTransform(dpr, 0, 0, dpr, 0, -tile.y0 * dpr);
  }

  /** Quadro de um ladrilho. A conta é a de sempre, só no que cai dentro dele. */
  paintTile(tile, time) {
    const { ctx, y0 } = tile;
    const y1 = y0 + TILE_HEIGHT;
    // Com DPR fracionário o buffer do ÚLTIMO ladrilho passa da seção em até um pixel do dispositivo
    // (319 x 1,25 = 398,75, buffer de 399): o canvas inteiro de antes desenhava, e o ponto que cai nessa
    // última linha parcial aparecia. A poda dos pontos olha um pixel de css além.
    const yMax = y1 + 1;
    const { width, spacing, columns, lines } = this;
    const { dot: dotColor, thread: threadColor, accent: accentColor } = this.colors;
    ctx.clearRect(0, y0, width, TILE_HEIGHT);

    if (this.isStellar) {
      this.projectStars(time);
      const { x, y, alphas, sizes, accents, count } = this.projected;
      // Perto (z alto) = mais rapida, maior e mais clara.
      for (let i = 0; i < count; i += 1) {
        if (alphas[i] === 0) continue;
        const yStar = y[i];
        if (yStar + sizes[i] <= y0 || yStar >= yMax) continue;
        ctx.globalAlpha = alphas[i];
        ctx.fillStyle = accents[i] ? accentColor : dotColor;
        ctx.fillRect(x[i], yStar, sizes[i], sizes[i]);
      }
      ctx.globalAlpha = 1;
      return;
    }

    // A grade: fios de 1px, o mesmo vocabulário do resto da página.
    ctx.strokeStyle = threadColor;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    for (let x = GRID_STEP / 2; x < width; x += GRID_STEP) {
      ctx.moveTo(Math.round(x) + 0.5, y0);
      ctx.lineTo(Math.round(x) + 0.5, y1);
    }
    for (let y = GRID_STEP / 2; y < yMax; y += GRID_STEP) {
      const yLine = Math.round(y) + 0.5;
      if (yLine + 0.5 <= y0 || yLine - 0.5 >= yMax) continue;
      ctx.moveTo(0, yLine);
      ctx.lineTo(width, yLine);
    }
    ctx.stroke();

    // A superfície: duas senoides cruzadas deslocam o ponto no eixo Y, e a
    // mesma conta manda na opacidade. É o que faz a malha ler como relevo em
    // vez de chuvisco - ponto alto aparece, ponto baixo some.
    ctx.fillStyle = dotColor;
    const firstRow = Math.max(0, Math.floor((y0 - WAVE_MARGIN) / spacing));
    const lastRow = Math.min(lines - 1, Math.ceil((y1 + WAVE_MARGIN) / spacing));
    for (let i = 0; i < columns; i += 1) {
      const x = i * spacing;
      for (let j = firstRow; j <= lastRow; j += 1) {
        const y = j * spacing;
        const wave =
          Math.sin(x * 0.011 + time * 0.00042) * Math.cos(y * 0.013 - time * 0.00031) +
          Math.sin((x + y) * 0.006 + time * 0.00019);
        const alpha = 0.06 + Math.max(0, wave) * 0.34;
        if (alpha <= 0.07) continue;
        ctx.globalAlpha = alpha;
        ctx.fillRect(Math.round(x), Math.round(y + wave * 9), 1.5, 1.5);
      }
    }
    ctx.globalAlpha = 1;
  }

  /**
   * Os pontos da variante `estelar`, projetados UMA vez por quadro: cada ladrilho só escolhe os
   * seus. A conta de cada ponto é a de antes; `alphas` (opacidade) 0 e o ponto descartado.
   * Float64, e não Float32: o `Math.round` das posições tem de cair onde sempre caiu.
   */
  projectStars(time) {
    if (this.projectedTime === time) return;
    this.projectedTime = time;
    const { width, geoHeight: height } = this;
    const source = this.stars;
    const count = source.length;
    if (!this.projected || this.projected.x.length < count) {
      this.projected = {
        x: new Float64Array(count),
        y: new Float64Array(count),
        alphas: new Float64Array(count),
        sizes: new Float64Array(count),
        accents: new Uint8Array(count),
        count,
      };
    }
    const buffer = this.projected;
    buffer.count = count;

    for (let i = 0; i < count; i += 1) {
      const star = source[i];
      const x = ((star.x + time * 0.000015 * star.z) % 1) * width;
      const y = ((star.y + time * 0.000009 * star.z) % 1) * height;
      const alpha = Math.min(
        1,
        (0.12 + star.z * 0.6) * (0.6 + Math.sin(time * 0.0018 + star.phase) * 0.4),
      );
      if (alpha < 0.04) {
        buffer.alphas[i] = 0;
        continue;
      }
      buffer.alphas[i] = alpha;
      buffer.accents[i] = star.accent ? 1 : 0;
      buffer.sizes[i] = star.z > 0.75 ? 2 : star.z > 0.45 ? 1.5 : 1;
      buffer.x[i] = Math.round(x);
      buffer.y[i] = Math.round(y);
    }
  }

  /** Um quadro: só os ladrilhos que estão na tela. */
  paint(time) {
    this.lastTime = time;
    for (const tile of this.tiles) if (tile.isActive && tile.isOnScreen) this.paintTile(tile, time);
  }

  loop = (time) => {
    if (!this.isAlive) return;
    if (!this.isTouch) this.paint(time - this.discount);
    else {
      if (time - this.paintedTime >= TOUCH_FRAME_STEP_MS) {
        this.paintedTime = time;
        this.paint(time - this.discount);
      }
    }
    this.frame = requestAnimationFrame(this.loop);
  };

  // Sob movimento reduzido fica no quadro único: o campo é ornamento e não
  // carrega informação nenhuma.
  //
  // Anda só na tela E se o visitante não pausou (WCAG 2.2.2): pausado, o campo
  // fica no último quadro.
  sync() {
    const shouldRun =
      !this.isReduced &&
      !this.isPausedByUser &&
      this.tiles.some((tile) => tile.isActive && tile.isOnScreen);
    if (shouldRun && !this.isAlive) {
      this.isAlive = true;
      this.discount += performance.now() - this.stoppedAt;
      this.frame = requestAnimationFrame(this.loop);
    } else if (!shouldRun && this.isAlive) {
      this.isAlive = false;
      this.stoppedAt = performance.now();
      cancelAnimationFrame(this.frame);
    }
  }

  // O buffer só existe PERTO da tela. Com todos vivos o celular segura dezenas de MB de pixels que
  // ninguém vê. Fora de uma tela de folga, em cima e embaixo, o buffer é liberado; ele volta a ser
  // pintado antes de entrar. O quadro é determinístico (semente fixa), então a volta não muda nada.
  setNear(tile, isOn) {
    if (isOn === tile.isActive) return;
    tile.isActive = isOn;
    if (isOn) {
      this.measureTile(tile);
      this.paintTile(tile, this.lastTime);
    } else {
      tile.canvas.width = 0;
      tile.canvas.height = 0;
    }
    this.sync();
  }

  setVisible(tile, isOn) {
    // Toque: o laço não pinta durante a rolagem, e o ladrilho que entra foi pintado quando acordou, talvez segundos atrás. Sem isto ele
    // apareceria numa fase da onda diferente da dos vizinhos, com a emenda visível.
    if (this.isTouch && isOn && !tile.isOnScreen && tile.isActive)
      this.paintTile(tile, this.lastTime);
    tile.isOnScreen = isOn;
    this.sync();
  }

  setPause(isOn) {
    this.isPausedByUser = isOn;
    this.sync();
  }

  // Mede de novo só quando o tamanho da CAIXA ou a densidade de pixels (`dpr`) mudou. `resize` da janela dispara
  // a cada vez que a barra do navegador entra ou sai no celular, e isso realocava
  // o buffer de cada canvas no meio da rolagem.
  setSize(rawWidth, rawHeight, dpr) {
    const width = Math.max(1, Math.round(rawWidth));
    const height = Math.max(1, Math.round(rawHeight));
    if (width === this.width && height === this.height && dpr === this.dpr) return;
    // Uma seção que cresce ou encolhe um pouco (o acordeão da FAQ, ao abrir) não pode arrastar a onda
    // junto: o centro dela é `altura / 2`, e a cada quadro da animação todos os pontos andavam e o
    // fundo cintilava. A geometria só muda com uma variação grande ou com a largura.
    const geoAntes = `${this.width}:${this.geoHeight}:${this.dpr}`;
    if (!this.geoHeight || width !== this.width || Math.abs(height - this.geoHeight) >= 240)
      this.geoHeight = height;
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    const mudouGeo = geoAntes !== `${width}:${this.geoHeight}:${dpr}`;
    this.projectedTime = NaN;
    this.updateDensity();
    this.sliceTiles();
    // A seção mudou de tamanho: tudo o que depende dela (estrelas, rede, altura) é outro desenho, então
    // todo ladrilho com buffer é medido e pintado de novo, como o canvas inteiro de antes.
    // Um ladrilho que nasce porque a seção cresceu fica colado a um que já está perto da tela: acorda
    // agora, e não quando o IntersectionObserver avisar (alguns quadros depois, com o canto em branco).
    for (const [i, tile] of this.tiles.entries()) {
      if (!tile.isNew) continue;
      tile.isNew = false;
      if (i > 0 && this.tiles[i - 1].isActive) this.setNear(tile, true);
    }
    // A `estelar` desenha pela geometria, que só muda com `mudouGeo`: crescer um pouco (o acordeão)
    // só recorta mais ou menos do mesmo desenho, e repintar tudo a cada quadro da animação dobrava o
    // trabalho do laço e engasgava a abertura de respostas grandes. A `malha` conta linhas pela
    // altura, então ela repinta.
    if (!mudouGeo && this.isStellar) return;
    for (const tile of this.tiles) {
      if (!tile.isActive) continue;
      this.measureTile(tile);
      // Pinta já, no mesmo tick: com o laço vivo, esperar o próximo quadro deixava um quadro em branco
      // (o buffer foi limpo) a cada mudança de altura, e o fundo piscava enquanto a FAQ animava.
      this.paintTile(tile, this.lastTime);
    }
  }

  release() {
    this.isAlive = false;
    cancelAnimationFrame(this.frame);
    this.nearObserver.disconnect();
    this.visibleObserver?.disconnect();
    for (const tile of this.tiles) tile.canvas.remove();
    this.tiles = [];
  }
}

/**
 * Liga um campo a uma raiz: observa o tamanho, a proximidade e a pausa, e devolve a função que desfaz.
 * Cada ladrilho tem o próprio par de observadores (perto e na tela); a página só os usa.
 * @param {HTMLElement} root - Raiz onde os ladrilhos entram.
 * @param {object} options - Mesmas opções de `Field`: `variant`, `colors`, `isReduced` e `isTouch`.
 * @returns {() => void} Função que desliga observadores, pausa e ladrilhos.
 */
export function startField(root, options) {
  const field = new Field(root, options);

  // O tamanho é o da SEÇÃO (a raiz não tem caixa: ver `DotField.jsx`), a caixa de padding, que é o
  // que o canvas `inset-0` de antes cobria. O `ResizeObserver` avisa na hora de observar e a cada mudança
  // da borda (só o padding mudar também conta), e dentro dele o layout está limpo.
  const parent = root.parentElement;
  // A margem (150%) é MAIOR que a do `nearObserver` (100%): quando a seção sai dela, o buffer de cada ladrilho
  // já foi liberado. `unobserve` não avisa `false`, então ele é dito aqui mesmo (sem efeito se já foi).
  const section = new IntersectionObserver(
    (entries) => {
      const isOn = entries[entries.length - 1].isIntersecting;
      if (isOn === field.isSectionNear) return;
      field.isSectionNear = isOn;
      for (const tile of field.tiles) {
        if (isOn) field.watchTile(tile);
        else {
          field.unwatchTile(tile);
          field.setNear(tile, false);
          field.setVisible(tile, false);
        }
      }
    },
    { rootMargin: "150% 0px" },
  );
  section.observe(parent);
  const sizeObserver = new ResizeObserver(() => {
    field.setSize(
      parent.clientWidth,
      parent.clientHeight,
      Math.min(window.devicePixelRatio || 1, 2),
    );
  });
  sizeObserver.observe(parent, { box: "border-box" });

  field.setPause(isPaused());
  const releasePause = !options.isReduced
    ? subscribeToPause((value) => field.setPause(value))
    : () => {};

  return () => {
    section.disconnect();
    releasePause();
    sizeObserver.disconnect();
    field.release();
  };
}

/**
 * As cores do campo, lidas dos tokens do CSS.
 * @returns {{ dot: string, thread: string, accent: string }} Cores dos pontos, dos fios e do acento.
 */
export function getFieldColors() {
  const style = getComputedStyle(document.documentElement);
  const readColor = (name, fallback) => style.getPropertyValue(name).trim() || fallback;
  return {
    dot: readColor("--bone", "#ededf0"),
    thread: readColor("--line", "#2c2c33"),
    accent: readColor("--accent", "#d2202c"),
  };
}
