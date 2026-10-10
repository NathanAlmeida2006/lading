/**
 * Halteres em ragdoll, "assados": a fisica roda UMA vez por queda, deterministica, e a rolagem so reproduz.
 *
 * Tremulidade vem de simular enquanto se rola (o ritmo da rolagem vira entrada da fisica). Aqui
 * `assar` simula a queda inteira com passo fixo e semente fixa, gravando a pose de cada haltere
 * em cada quadro; `poseDe` le a gravacao por progresso (0..1) e interpola. Rolar para cima
 * desfaz a queda exatamente, rolar rapido so pula no tempo, e nada vibra: o que e gravado e o
 * que e mostrado.
 *
 * Fisica propria (o matter-js custava +27 KB e estourava o teto de JS, RNF-L04): corpo rigido por
 * posicao (PBD). Cada haltere tem pose (x, y, angulo) e 17 circulos de colisao (barra, anilhas
 * internas e externas). Um contato corrige posicao e angulo juntos, pela massa e inercia
 * generalizadas, com atrito: batida fora do centro faz o haltere tombar e rolar sobre os outros.
 * Subpassos, varias passadas de contato e "sono" por haltere seguram a pilha parada.
 *
 * Dez presets (PRESETS) mudam como a chuva entra; `assar(l, a, semente, preset)`.
 * Duas fontes de sorteio: a fixa (SEMENTE) decide a ENTRADA (colunas, posicao, angulo, cor), igual
 * em toda queda; a de `semente` decide o ragdoll (giro e velocidade iniciais), outra a cada queda.
 *
 * `assar` leva 0,5 a 3 s de CPU: quem chama roda num Worker (halteres.worker.js), fora da main.
 */
const GRAVIDADE = 0.55; // px/quadro^2
const SUBPASSOS = 6;
const PASSADAS = 3;
const ATRITO = 0.6;
const DENSIDADE = 0.9; // fracao da area da tela coberta
const GIRO_INICIAL = 0.12; // rad/quadro, maximo: cada um entra girando
const MAX_QUADROS = 1500;
const QUADROS_PARA_DORMIR = 15;
const QUADROS_ACORDADO_MAX = 300;
const PASSO_PARADO = 0.8; // px por quadro abaixo do qual o haltere conta como quieto
const IMPACTO = 0.3; // px por subpasso: acima disso quem toca acorda quem dorme
const SALTOS_DE_ACORDAR = 12; // o acordar se propaga 3 contatos adiante (12 -> 8 -> 4 -> 0)
const SEMENTE = 1234;
const FRENTE = [0, 1, 4095, 4096, 4097]; // a propria celula e as 4 vizinhas "a frente" (chave = x + y * 4096)

// [ao longo do eixo, perpendicular, raio], em L.
const CIRCULOS = [
  [-0.24, 0, 0.06], [-0.12, 0, 0.06], [0, 0, 0.06], [0.12, 0, 0.06], [0.24, 0, 0.06],
  ...[-1, 1].flatMap((lado) => [-0.09, 0.09].map((p) => [lado * 0.29, p, 0.065])),
  ...[-1, 1].flatMap((lado) => [-0.13, 0, 0.13].map((p) => [lado * 0.4, p, 0.07])),
];
const INERCIA = CIRCULOS.reduce((soma, [x, y]) => soma + x * x + y * y, 0) / CIRCULOS.length; // em L^2, massa 1

// --- presets de queda ------------------------------------------------------------------------
// Cada preset decide COMO a chuva entra: a ordem das colunas, o ritmo e o empurrao inicial. A
// fisica e a mesma. `ordem(n, sorteio)` devolve a ordem das n colunas (repetida em ciclo);
// `intervalo` em quadros (o minimo real depende da escala: ver `criarMundo`); `vx`/`vxVar` e
// `vy`/`vyVar` em px/quadro; `giro` escala o giro inicial.
const sequencia = (n) => Array.from({ length: n }, (_, i) => i);
const doCentro = (n) => sequencia(n).sort((a, b) => Math.abs(a - (n - 1) / 2) - Math.abs(b - (n - 1) / 2));
const PRESETS = [
  { nome: "chuva", intervalo: 3, vx: 0, vxVar: 4, vy: 1, vyVar: 2, giro: 1, ordem: null }, // `null` = o passo coprimo
  { nome: "cascata-esquerda", intervalo: 3, vx: 0, vxVar: 2, vy: 1, vyVar: 2, giro: 1, ordem: sequencia },
  { nome: "cascata-direita", intervalo: 3, vx: 0, vxVar: 2, vy: 1, vyVar: 2, giro: 1, ordem: (n) => sequencia(n).reverse() },
  { nome: "centro-para-bordas", intervalo: 3, vx: 0, vxVar: 2, vy: 1, vyVar: 2, giro: 1, ordem: doCentro },
  { nome: "bordas-para-centro", intervalo: 3, vx: 0, vxVar: 2, vy: 1, vyVar: 2, giro: 1, ordem: (n) => doCentro(n).reverse() },
  { nome: "zigue-zague", intervalo: 2, vx: 0, vxVar: 2, vy: 1, vyVar: 2, giro: 1, ordem: (n) => sequencia(n).map((k) => (k % 2 ? n - 1 - (k >> 1) : k >> 1)) },
  { nome: "vento-da-esquerda", intervalo: 3, vx: 3, vxVar: 2, vy: 1, vyVar: 2, giro: 1.3, ordem: null },
  { nome: "vento-da-direita", intervalo: 3, vx: -3, vxVar: 2, vy: 1, vyVar: 2, giro: 1.3, ordem: null },
  { nome: "tempestade", intervalo: 1, vx: 0, vxVar: 6, vy: 3, vyVar: 3, giro: 2, ordem: (n, rnd) => {
    const o = sequencia(n);
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; }
    return o;
  } },
  { nome: "pesada", intervalo: 5, vx: 0, vxVar: 1, vy: 0, vyVar: 0.5, giro: 0.3, ordem: null },
];
export const quantidadeDePresets = PRESETS.length;

export const coresDeHaltere = 3;

function sorteio(semente) {
  let s = semente >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const mdc = (a, b) => (b ? mdc(b, a % b) : a);

function criarMundo(largura, altura, rnd, variacao, preset) {
  const L = Math.max(90, Math.min(170, largura / 9));
  const inversaInercia = 1 / (INERCIA * L * L);
  const passoMaximo = 0.06 * L * 0.7; // por subpasso: abaixo do raio da barra, nada atravessa nada
  const total = Math.ceil(((largura * altura) / (L * L * 0.4)) * DENSIDADE);
  const colunas = Math.max(1, Math.floor(largura / (L * 0.9)));
  // Passo coprimo com o numero de colunas: entradas seguidas caem em colunas distantes e a mesma
  // coluna so volta depois de todas, tempo de o anterior sair da frente.
  let salto = Math.max(1, Math.round(colunas * 0.618));
  while (mdc(salto, colunas) !== 1) salto++;

  const ordem = preset.ordem ? preset.ordem(colunas, rnd) : sequencia(colunas).map((i) => (i * salto) % colunas);
  // A mesma coluna volta depois de `colunas` entradas: tem de dar tempo de a anterior cair um
  // haltere inteiro (0.9 L = g t^2 / 2), senao dois nascem sobrepostos.
  const intervalo = Math.max(preset.intervalo, Math.ceil(Math.sqrt((2 * 0.9 * L) / GRAVIDADE) / colunas));

  const corpos = [];
  const circulos = [];

  function soltar(i) {
    const larguraDaColuna = largura / colunas;
    const coluna = ordem[i % colunas];
    const x = (coluna + 0.5) * larguraDaColuna + (rnd() - 0.5) * Math.max(0, larguraDaColuna - L * 0.9);
    const y = -L * 0.6;
    const a = rnd() * Math.PI;
    rnd(); rnd(); // giro e velocidade sao da `variacao`; estas chamadas mantem a entrada igual em toda queda
    const giro = (variacao() - 0.5) * 2 * GIRO_INICIAL * preset.giro;
    const corpo = {
      x, y, a,
      // pose do subpasso anterior = velocidade inicial
      px: x - (preset.vx + (variacao() - 0.5) * preset.vxVar) / SUBPASSOS, py: y - (preset.vy + variacao() * preset.vyVar) / SUBPASSOS, pa: a - giro / SUBPASSOS,
      co: Math.cos(a), si: Math.sin(a),
      fx: x, fy: y, fa: a, // pose no inicio do quadro, para medir se parou
      cor: Math.floor(rnd() * coresDeHaltere),
      dorme: false, quieto: 0, acordado: 0, recente: 0,
    };
    corpo.c = CIRCULOS.map(([lx, ly, r]) => ({ b: corpo, lx: lx * L, ly: ly * L, r: r * L }));
    corpos.push(corpo);
    circulos.push(...corpo.c);
  }

  // --- contatos --------------------------------------------------------------------------------

  const acordar = (b, saltos = SALTOS_DE_ACORDAR) => {
    b.dorme = false;
    b.quieto = 0;
    b.acordado = 0;
    b.recente = saltos;
  };

  // Posicao do circulo no mundo e alavanca em relacao ao centro do corpo.
  const alavancaX = (b, c) => b.co * c.lx - b.si * c.ly;
  const alavancaY = (b, c) => b.si * c.lx + b.co * c.ly;

  // Massa inversa generalizada do corpo naquele circulo e direcao (0 = estatico ou dormindo).
  const inversa = (b, c, ux, uy) => {
    if (!b || b.dorme) return 0;
    const giro = alavancaX(b, c) * uy - alavancaY(b, c) * ux;
    return 1 + giro * giro * inversaInercia;
  };

  // Move o corpo `k` ao longo de (ux, uy), aplicado no circulo `c`: translacao e giro juntos.
  // Com `anterior`, move a pose do subpasso anterior (e a velocidade implicita que muda).
  const mover = (b, c, ux, uy, k, anterior) => {
    const giro = (alavancaX(b, c) * uy - alavancaY(b, c) * ux) * inversaInercia * k;
    if (anterior) {
      b.px += ux * k;
      b.py += uy * k;
      b.pa += giro;
      return;
    }
    b.x += ux * k;
    b.y += uy * k;
    b.a += giro;
    b.co = Math.cos(b.a);
    b.si = Math.sin(b.a);
  };

  // Deslocamento do circulo neste subpasso (da pose anterior para a atual).
  const deslocamento = (b, c) => {
    if (!b) return [0, 0];
    const co = Math.cos(b.pa), si = Math.sin(b.pa);
    return [
      b.x + alavancaX(b, c) - (b.px + co * c.lx - si * c.ly),
      b.y + alavancaY(b, c) - (b.py + si * c.lx + co * c.ly),
    ];
  };

  // Separa A (para -n) e B (para +n), corta a velocidade de afastamento (sem quique) e aplica
  // atrito. A ou B nulo = estatico (parede, chao).
  const contato = (A, ca, B, cb, nx, ny, penetracao) => {
    const wa = inversa(A, ca, nx, ny), wb = inversa(B, cb, nx, ny);
    if (wa + wb === 0) return;
    const lambda = penetracao / (wa + wb);
    if (wa) mover(A, ca, -nx, -ny, lambda);
    if (wb) mover(B, cb, nx, ny, lambda);

    let [ax, ay] = deslocamento(A, ca);
    let [bx, by] = deslocamento(B, cb);
    let rn = (ax - bx) * nx + (ay - by) * ny;
    if (rn < 0) {
      // Afastando-se: a correcao de sobreposicao viraria velocidade e arremessaria o haltere.
      const k = -rn / (wa + wb);
      if (wa) mover(A, ca, -nx, -ny, k, true);
      if (wb) mover(B, cb, nx, ny, k, true);
      [ax, ay] = deslocamento(A, ca);
      [bx, by] = deslocamento(B, cb);
      rn = (ax - bx) * nx + (ay - by) * ny;
    }
    const tx = ax - bx - rn * nx, ty = ay - by - rn * ny;
    const tl = Math.hypot(tx, ty);
    if (tl < 1e-9) return;
    const ux = tx / tl, uy = ty / tl;
    const fa = inversa(A, ca, ux, uy), fb = inversa(B, cb, ux, uy);
    if (fa + fb === 0) return;
    const k = Math.min(tl, ATRITO * penetracao) / (fa + fb);
    if (fa) mover(A, ca, -ux, -uy, k);
    if (fb) mover(B, cb, ux, uy, k);
  };

  const chocar = (ca, cb) => {
    const A = ca.b, B = cb.b;
    if (A === B || (A.dorme && B.dorme)) return;
    const dx = B.x + alavancaX(B, cb) - (A.x + alavancaX(A, ca));
    const dy = B.y + alavancaY(B, cb) - (A.y + alavancaY(A, ca));
    const minimo = ca.r + cb.r;
    const d2 = dx * dx + dy * dy;
    // Quem dorme e tocado por quem se mexe (ou por quem acabou de acordar) e acorda tambem;
    // senao ficaria flutuando quando o apoio some.
    if (A.dorme !== B.dorme && d2 < (minimo + 2) * (minimo + 2)) {
      const [dormindo, ativo] = A.dorme ? [A, B] : [B, A];
      if (ativo.recente > 0) acordar(dormindo, Math.max(0, ativo.recente - 4));
      else if (Math.hypot(ativo.x - ativo.px, ativo.y - ativo.py) > IMPACTO) acordar(dormindo);
    }
    if (d2 >= minimo * minimo || d2 === 0) return;
    const d = Math.sqrt(d2);
    contato(A, ca, B, cb, dx / d, dy / d, minimo - d);
  };

  const contraAsParedes = (b, c) => {
    const cx = b.x + alavancaX(b, c), cy = b.y + alavancaY(b, c);
    if (cx - c.r < 0) contato(null, null, b, c, 1, 0, c.r - cx);
    else if (cx + c.r > largura) contato(null, null, b, c, -1, 0, cx + c.r - largura);
    if (cy + c.r > altura) contato(null, null, b, c, 0, -1, cy + c.r - altura);
  };

  // --- passo -----------------------------------------------------------------------------------

  function subpasso() {
    const g = GRAVIDADE / (SUBPASSOS * SUBPASSOS);
    for (const b of corpos) {
      if (b.dorme) continue;
      let vx = (b.x - b.px) * 0.995, vy = (b.y - b.py) * 0.995;
      const v2 = vx * vx + vy * vy;
      if (v2 > passoMaximo * passoMaximo) {
        const k = passoMaximo / Math.sqrt(v2);
        vx *= k;
        vy *= k;
      }
      const w = Math.max(-0.1, Math.min(0.1, (b.a - b.pa) * 0.99));
      b.px = b.x; b.py = b.y; b.pa = b.a;
      b.x += vx; b.y += vy + g; b.a += w;
      b.co = Math.cos(b.a);
      b.si = Math.sin(b.a);
    }

    // Grade: celula de 0.3 L; cada par e testado uma vez (a propria celula e 4 vizinhas "a frente").
    const celula = L * 0.3;
    const grade = new Map();
    for (const c of circulos) {
      const chave = Math.floor((c.b.x + alavancaX(c.b, c)) / celula) + Math.floor((c.b.y + alavancaY(c.b, c)) / celula) * 4096;
      const lista = grade.get(chave);
      if (lista) lista.push(c);
      else grade.set(chave, [c]);
    }
    for (let passada = 0; passada < PASSADAS; passada++) {
      for (const [chave, lista] of grade) {
        for (const vizinha of FRENTE) {
          const outra = vizinha ? grade.get(chave + vizinha) : lista;
          if (!outra) continue;
          for (let i = 0; i < lista.length; i++) {
            for (let j = vizinha ? 0 : i + 1; j < outra.length; j++) chocar(lista[i], outra[j]);
          }
        }
      }
      for (const b of corpos) {
        if (b.dorme) continue;
        for (const c of b.c) contraAsParedes(b, c);
      }
    }
  }

  /** Avanca um quadro (60 Hz). */
  function passo() {
    for (let i = 0; i < SUBPASSOS; i++) subpasso();
    for (const b of corpos) {
      if (b.recente > 0) b.recente--;
      if (b.dorme) continue;
      const mexeu = Math.abs(b.x - b.fx) + Math.abs(b.y - b.fy) + Math.abs(b.a - b.fa) * L * 0.4;
      b.fx = b.x; b.fy = b.y; b.fa = b.a;
      b.quieto = mexeu < PASSO_PARADO ? b.quieto + 1 : 0;
      b.acordado++;
      if (b.quieto >= QUADROS_PARA_DORMIR || (b.acordado > QUADROS_ACORDADO_MAX && mexeu < PASSO_PARADO * 4)) {
        b.dorme = true;
            b.px = b.x; b.py = b.y; b.pa = b.a;
      }
    }
  }

  const quieto = () => corpos.every((b) => b.dorme);

  return { L, total, corpos, soltar, passo, quieto, intervalo };
}

/**
 * Simula a queda inteira e grava `poses[quadro * total * 3 + i * 3 + {0,1,2}] = x, y, angulo`.
 */
export function assar(largura, altura, semente = SEMENTE, preset = 0) {
  const mundo = criarMundo(largura, altura, sorteio(SEMENTE), sorteio(semente), PRESETS[preset]);
  const { total, corpos } = mundo;
  const poses = new Float32Array(MAX_QUADROS * total * 3);
  const inicio = new Int32Array(total);
  let quadro = 0;
  let entrou = 0;

  while (quadro < MAX_QUADROS) {
    if (entrou < total && quadro % mundo.intervalo === 0) {
      inicio[entrou] = quadro;
      mundo.soltar(entrou++);
    }
    mundo.passo();
    const base = quadro * total * 3;
    for (let i = 0; i < entrou; i++) {
      const b = corpos[i];
      poses[base + i * 3] = b.x;
      poses[base + i * 3 + 1] = b.y;
      poses[base + i * 3 + 2] = b.a;
    }
    quadro++;
    if (entrou === total && mundo.quieto()) break;
  }

  return {
    L: mundo.L,
    total,
    quadros: quadro,
    inicio,
    cores: Uint8Array.from(corpos, (b) => b.cor),
    poses: poses.slice(0, quadro * total * 3),
    circulos: CIRCULOS.map(([x, y, r]) => [x * mundo.L, y * mundo.L, r * mundo.L]),
  };
}

/** Pose do haltere `i` no progresso `u` (0..1) em `saida`; false se ainda nao entrou. */
export function poseDe(sim, i, u, saida) {
  const f = Math.max(0, Math.min(1, u)) * (sim.quadros - 1);
  if (f < sim.inicio[i]) return false;
  const f0 = Math.floor(f);
  const t = f - f0;
  const f1 = Math.min(f0 + 1, sim.quadros - 1);
  const a = (f0 * sim.total + i) * 3;
  const b = (f1 * sim.total + i) * 3;
  const p = sim.poses;
  saida.x = p[a] + (p[b] - p[a]) * t;
  saida.y = p[a + 1] + (p[b + 1] - p[a + 1]) * t;
  saida.a = p[a + 2] + (p[b + 2] - p[a + 2]) * t;
  return true;
}
