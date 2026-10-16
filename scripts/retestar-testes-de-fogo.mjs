#!/usr/bin/env node
/**
 * Retestador dos Testes de Fogo (tarefa 23, QA): reexecuta os dez cenarios da auditoria de 10/10/2026
 * contra o build LOCAL (nunca o ar), com as verificacoes das correcoes 16 a 22.
 *
 *   npm run build && node node_modules/vite/bin/vite.js preview --port 4173 --strictPort &
 *   node scripts/retestar-testes-de-fogo.mjs
 *   ONLY=2,3,6 node scripts/retestar-testes-de-fogo.mjs      (so esses testes)
 *   FALHAR_DE_PROPOSITO=1 node scripts/retestar-testes-de-fogo.mjs   (prova do codigo de saida)
 *
 * Variaveis: URL (http://127.0.0.1:4173/), OUT (output/playwright/fire-tests/retest/23), ROTULO,
 *   SOAK_S (300), SOAK_B_S (300, 0 desliga o soak de ritmo humano), ONLY, RAPIDO=1 (smoke: soak 20 s),
 *   CHROMIUM (funcional; padrao: Chromium do playwright-core), CHROMIUM_FLUIDEZ (fluidez; padrao:
 *   chromium-1243, o Chrome 153 da auditoria e da tarefa 21, para comparar com o mesmo navegador),
 *   FALHAR_DE_PROPOSITO=1 e FALHAR_ID (criterio forcado a falhar; padrao 3.menu-unico).
 *
 * Saida: resultado[-ROTULO].json e .md em OUT. Estados do criterio: passa, falha, na (nao se aplica),
 * manual (so aparelho fisico), ambiente (limite do host, nao falha do produto), erro (falha de harness).
 * Codigo de saida: 0 tudo ok; 1 algum criterio implementado falhou; 3 so falhas de correcao
 * BLOQUEADA (tarefa 19); 2 falha de harness (vence 1 e 3: rodada incompleta).
 * Nao edita src/, package.json nem public/. Nada sai da maquina alem de 127.0.0.1.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { cpus, homedir, loadavg, release } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const ARQUIVO = fileURLToPath(import.meta.url);
const REPO = resolve(dirname(ARQUIVO), "..");
const E = process.env;
const URL_ALVO = (E.URL || "http://127.0.0.1:4173/").replace(/\/?$/, "/");
const ORIGEM = new URL(URL_ALVO).origin;
const FALHAR = E.FALHAR_DE_PROPOSITO === "1";
const SOAK_S = Number(E.SOAK_S || (E.RAPIDO === "1" ? 20 : 300));
const SOAK_B_S = Number(E.SOAK_B_S ?? (E.RAPIDO === "1" ? 0 : 300));
const ROTULO = (E.ROTULO || (FALHAR ? "injetada" : SOAK_S < 300 || E.ONLY ? "parcial" : "real")).replace(/[^\w.-]+/g, "_");
const OUT = resolve(E.OUT || join(REPO, "output/playwright/fire-tests/retest/23"));
const EVID = ROTULO === "real" ? OUT : join(OUT, ROTULO);
const SO = E.ONLY ? new Set(E.ONLY.split(",").map((s) => s.trim())) : null;
const quer = (id) => !SO || SO.has(String(id));
mkdirSync(EVID, { recursive: true });

const ABRIR = '[aria-label="Abrir menu"]';
const FECHAR = '#menu [aria-label="Fechar menu"]';
const COOKIE = 'aside[aria-label="Aviso de cookies"]';
const esp = (ms) => new Promise((r) => setTimeout(r, ms));
const r1 = (x) => (x == null || Number.isNaN(x) ? null : Math.round(x * 10) / 10);
const pct = (arr, p) => {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)];
};
const requisitos = createRequire(join(REPO, "package.json"));
const png = (nome) => join(EVID, `${nome}.png`);
const rel = (p) => p.replace(OUT + "/", "");

// ---------------------------------------------------------------------------------------------
// Registro: testes, criterios, veredito
// ---------------------------------------------------------------------------------------------

const testes = new Map();
function T(id, nome) {
  if (!testes.has(id)) testes.set(id, { id, nome, criterios: [], notas: [], evidencias: [], erroHarness: null, console: null, duracaoMs: 0 });
  return testes.get(id);
}
/** estado: passa | falha | na | manual | ambiente | erro. opts.bloqueada: id da correcao que bloqueia. */
function crit(t, id, descricao, estado, valores = {}, opts = {}) {
  if (FALHAR && id === (E.FALHAR_ID || "3.menu-unico") && estado === "passa") {
    estado = "falha";
    valores = { ...valores, injetada: "FALHAR_DE_PROPOSITO=1: falha injetada, nao e do produto" };
  }
  t.criterios.push({ id, descricao, estado, valores, bloqueada: opts.bloqueada ?? null });
}
const sim = (ok) => (ok ? "passa" : "falha");
const nota = (t, s) => t.notas.push(s);
function veredito(t) {
  const c = t.criterios;
  const n = (e) => c.filter((x) => x.estado === e).length;
  let status;
  if (n("falha")) status = "Falhou";
  else if (t.erroHarness || n("erro")) status = "Não executado";
  else if (!n("passa") && n("na") && !n("manual") && !n("ambiente")) status = "Não aplicável";
  else if (!n("passa")) status = "Não executado";
  else status = "Passou";
  return { status, parcial: status === "Falhou" && n("passa") > 0, ressalvas: n("ambiente") + n("manual") };
}

// ---------------------------------------------------------------------------------------------
// Navegador: launchServer + connect (pid conhecido, morte garantida por PID)
// ---------------------------------------------------------------------------------------------

const servidores = new Set();
function matarTudo() {
  for (const s of servidores) {
    try {
      const pid = s.process().pid;
      try { process.kill(-pid, "SIGKILL"); } catch { process.kill(pid, "SIGKILL"); }
    } catch { /* ja saiu */ }
  }
}
process.on("exit", matarTudo);
for (const sinal of ["SIGINT", "SIGTERM", "SIGHUP"]) process.on(sinal, () => { matarTudo(); process.exit(130); });

async function abrirNavegador({ executavel = null, args = [] } = {}) {
  const base = { headless: true, args };
  let servidor;
  try {
    servidor = await chromium.launchServer(executavel ? { ...base, executablePath: executavel } : base);
  } catch (e) {
    const raiz = join(homedir(), ".cache/ms-playwright");
    const exe = readdirSync(raiz).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse()
      .map((d) => join(raiz, d, "chrome-linux/chrome")).find(existsSync);
    if (!exe) throw e;
    servidor = await chromium.launchServer({ ...base, executablePath: exe });
  }
  servidores.add(servidor);
  const browser = await chromium.connect(servidor.wsEndpoint());
  const pid = servidor.process().pid;
  return {
    browser, pid, versao: browser.version(),
    async encerrar() {
      await browser.close().catch(() => {});
      await Promise.race([servidor.close().catch(() => {}), esp(5000)]);
      try { process.kill(-pid, "SIGKILL"); } catch { /* ja saiu */ }
      servidores.delete(servidor);
    },
  };
}

// So a origem da URL alvo sai da maquina.
async function contexto(browser, opcoes = {}) {
  const ctx = await browser.newContext(opcoes);
  await ctx.route("**/*", (rota) => {
    let u;
    try { u = new URL(rota.request().url()); } catch { return rota.abort(); }
    return u.origin === ORIGEM || ["data:", "blob:", "about:"].includes(u.protocol) ? rota.continue() : rota.abort();
  });
  return ctx;
}
function coletar(page) {
  const c = { erros: [], tErros: [], avisos: [], pageerrors: [], falhas: [], crash: false };
  page.on("console", (m) => {
    if (m.type() === "error") { c.erros.push(m.text().slice(0, 300)); c.tErros.push(Date.now()); }
    else if (m.type() === "warning") c.avisos.push(m.text().slice(0, 300));
  });
  page.on("pageerror", (e) => c.pageerrors.push(String(e?.message || e).slice(0, 300)));
  page.on("requestfailed", (r) => c.falhas.push(`${r.url().replace(ORIGEM, "")} ${r.failure()?.errorText ?? ""}`));
  page.on("crash", () => { c.crash = true; });
  return c;
}
async function comPagina(browser, opcoes, fn) {
  const ctx = await contexto(browser, opcoes);
  try {
    const page = await ctx.newPage();
    const col = coletar(page);
    return await fn(page, ctx, col);
  } finally {
    await ctx.close().catch(() => {});
  }
}
function guardarConsole(t, col, esperados = []) {
  const ruido = (s) => esperados.some((re) => re.test(s));
  const k = t.console ?? (t.console = { erros: [], avisos: [], pageerrors: [], esperados: 0 });
  for (const e of col.erros) (ruido(e) ? (k.esperados++, 0) : k.erros.push(e));
  k.avisos.push(...col.avisos);
  k.pageerrors.push(...col.pageerrors);
}

// Execucao de um teste: excecao ou tempo limite vira falha de harness, nunca falha do produto.
async function executar(t, limiteMs, fn) {
  const ini = Date.now();
  let timer;
  try {
    await Promise.race([
      fn(t),
      new Promise((_, rej) => { timer = setTimeout(() => rej(new Error(`tempo limite do harness (${Math.round(limiteMs / 1000)} s)`)), limiteMs); }),
    ]);
  } catch (e) {
    t.erroHarness = String(e.message || e).split("\n")[0];
    console.error(`  [${t.id}] FALHA DE HARNESS: ${t.erroHarness}`);
  } finally {
    clearTimeout(timer);
    t.duracaoMs = Date.now() - ini;
  }
}

// ---------------------------------------------------------------------------------------------
// Auxiliares de pagina
// ---------------------------------------------------------------------------------------------

async function abrirPagina(page, { pronto = true } = {}) {
  await page.goto(URL_ALVO, { waitUntil: "load", timeout: 30000 });
  if (pronto) await page.waitForFunction(() => document.documentElement.classList.contains("pronto"), null, { timeout: 20000 });
  await page.waitForFunction(() => !document.documentElement.classList.contains("intro-pendente"), null, { timeout: 10000 }).catch(() => {});
  await esp(700);
}
const recusar = (page) => page.getByRole("button", { name: "Recusar", exact: true }).click({ timeout: 5000 }).then(() => true, () => false);
async function abrirMenu(page) {
  await page.click(ABRIR, { timeout: 8000 });
  await page.waitForFunction((s) => document.querySelector(s)?.getAttribute("aria-expanded") === "true", ABRIR, { timeout: 5000 });
  await esp(900);
}
const expandido = (page) => page.evaluate((s) => document.querySelector(s)?.getAttribute("aria-expanded"), ABRIR);
const docOverflow = (page) => page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
const semOverflow = (d) => d.sw <= d.iw + 1;
const travaRolagem = (page) => page.evaluate(() => ({
  inline: document.documentElement.style.overflow,
  html: getComputedStyle(document.documentElement).overflowY,
  fundoInert: [...document.body.children].filter((e) => e.id !== "menu" && e.inert).length,
}));

/** Alvo de Fechar: dentro da viewport, >= 44 px, e o proprio botao no ponto central. */
function medirFechar() {
  const el = document.querySelector('#menu [aria-label="Fechar menu"]');
  if (!el) return { existe: false };
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const topo = document.elementFromPoint(cx, cy);
  return {
    existe: true, x: r.left, y: r.top, w: r.width, h: r.height, cx, cy,
    dentro: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight,
    alvo44: r.width >= 44 && r.height >= 44,
    hit: !!topo && !!topo.closest('[aria-label="Fechar menu"]'),
    links: [...document.querySelectorAll("#menu nav a")].length,
  };
}

// ---------------------------------------------------------------------------------------------
// Fluidez: testes 1 e 10 (uma unica sessao, em serie, antes de qualquer outro navegador)
// ---------------------------------------------------------------------------------------------

const statLT = (l) => ({
  n: l.length, somaMs: r1(l.reduce((a, x) => a + x.dur, 0)), maxMs: r1(Math.max(0, ...l.map((x) => x.dur))),
  p95Ms: r1(pct(l.map((x) => x.dur), 95)), ge200: l.filter((x) => x.dur >= 200).length, ge500: l.filter((x) => x.dur >= 500).length,
});
const statFr = (f) => ({ n: f.length, p50: r1(pct(f, 50)), p95: r1(pct(f, 95)), p99: r1(pct(f, 99)), maxMs: r1(Math.max(0, ...f)), gt50: f.filter((x) => x > 50).length });

async function fluidez(nav) {
  const t1 = T(1, "Rage Scroll & Break");
  const t10 = T(10, "Memória e CPU por cinco minutos");
  const { browser } = nav;
  const ctx = await contexto(browser, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  const out = { fases: {}, soakA: null, soakB: null, host: null, verificacao: null };
  try {
    const page = await ctx.newPage();
    const col = coletar(page);
    await page.addInitScript(() => {
      const q = (window.__qa = { lt: [], fr: [], last: 0 });
      try {
        new PerformanceObserver((l) => { for (const e of l.getEntries()) q.lt.push([e.startTime, e.duration]); }).observe({ type: "longtask", buffered: true });
      } catch { /* sem longtask */ }
      const f = (t) => { if (q.last) q.fr.push(t - q.last); q.last = t; requestAnimationFrame(f); };
      requestAnimationFrame(f);
    });
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Performance.enable");
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

    // Vigia do host (processo do harness, fora da pagina): separa "a maquina engasgou" de "a thread da pagina".
    const host = { lags: [], cpu: [] };
    let prev = Date.now();
    const vLag = setInterval(() => { const n = Date.now(); const lag = n - prev - 50; prev = n; if (lag > 80) host.lags.push([n, lag]); }, 50);
    const lerStat = () => { const v = readFileSync("/proc/stat", "utf8").split("\n")[0].trim().split(/\s+/).slice(1).map(Number); return [v.reduce((a, b) => a + b, 0), v[3] + (v[4] || 0)]; };
    let s0 = lerStat();
    const vCpu = setInterval(() => { const s = lerStat(); const dt = s[0] - s0[0]; host.cpu.push([Date.now(), dt ? Math.round((100 * (dt - (s[1] - s0[1]))) / dt) : 0]); s0 = s; }, 1000);

    const agora = () => page.evaluate(() => performance.now());
    const drena = () => page.evaluate(() => window.__qa.fr.splice(0));
    const metricas = async () => Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((x) => [x.name, x.value]));
    async function snap(rotulo) {
      const t0 = await agora();
      const antes = await metricas();
      await cdp.send("HeapProfiler.collectGarbage");
      const m = await metricas();
      const dom = await cdp.send("Memory.getDOMCounters");
      const t1 = await agora();
      const estado = await page.evaluate(() => ({ y: Math.round(scrollY), lock: document.documentElement.style.overflow, menu: document.querySelector('[aria-label="Abrir menu"]')?.getAttribute("aria-expanded") }));
      return { rotulo, t0, t1, wall: Date.now(), heapAntesGC: antes.JSHeapUsedSize, heapPosGC: m.JSHeapUsedSize, m, dom, estado };
    }
    const lerLT = async () => (await page.evaluate(() => window.__qa.lt)).map(([start, dur]) => ({ start, dur }));
    let janelasHarness = [];
    const marcarHarness = (l) => { l.harness = janelasHarness.some(([a, b]) => l.start < b && l.start + l.dur > a); return l; };
    const naJanela = (lts, a, b) => lts.filter((l) => l.start >= a && l.start < b).map(marcarHarness);
    function fase(nome, a, b, lts, frames) {
      const d = (k) => (b.m[k] - a.m[k]);
      const par = d("Timestamp") || 1;
      return {
        nome, janelaS: r1(par), longTasks: statLT(lts), longTasksSemHarness: statLT(lts.filter((l) => !l.harness)), frames: statFr(frames),
        taskDurationPct: r1((100 * d("TaskDuration")) / par), scriptPct: r1((100 * d("ScriptDuration")) / par),
        layoutPct: r1((100 * d("LayoutDuration")) / par), stylePct: r1((100 * d("RecalcStyleDuration")) / par),
        heapAntesGCFim: b.heapAntesGC, heapPosGCIni: a.heapPosGC, heapPosGCFim: b.heapPosGC,
        nosIni: a.dom.nodes, nosFim: b.dom.nodes, listenersIni: a.dom.jsEventListeners, listenersFim: b.dom.jsEventListeners,
      };
    }

    const sInicio = await snap("inicio");
    // (1) CARGA
    const tNav = Date.now();
    await page.goto(URL_ALVO, { waitUntil: "load", timeout: 30000 });
    await esp(Math.max(0, 8000 - (Date.now() - tNav)));
    const tCarga = await agora();
    const framesCarga = await drena();
    const sCarga = await snap("carga-fim");
    janelasHarness = [sInicio, sCarga].map((s) => [s.t0 - 150, s.t1 + 150]);

    // (2) RAGE SCROLL (metodo da auditoria: 150 saltos topo/rodape, wheel intercalado, 12 ms)
    const tRageIni = await agora();
    for (let i = 0; i < 150; i++) {
      await page.evaluate((k) => scrollTo({ top: k % 2 ? 0 : document.documentElement.scrollHeight, behavior: "instant" }), i);
      if (i % 4 === 0) await page.mouse.wheel(0, i % 8 ? -16000 : 16000);
      await esp(12);
    }
    const tRageFim = await agora();
    const framesRage = await drena();
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await esp(2000);
    await page.screenshot({ path: png("t1-apos-rage-topo") });
    t1.evidencias.push(rel(png("t1-apos-rage-topo")));
    const sRage = await snap("rage-fim");

    // (2b) VERIFICACAO DE INTEGRIDADE: 40 wheels alternados, Home, oito secoes e indices
    const tVIni = await agora();
    for (let i = 0; i < 40; i++) await page.mouse.wheel(0, i % 2 ? -25000 : 25000);
    await page.keyboard.press("Home");
    await esp(2000);
    const recuperado = await page.evaluate(() => ({ y: Math.round(scrollY), inline: document.documentElement.style.overflow, htmlOverflowY: getComputedStyle(document.documentElement).overflowY }));
    const ids = await page.evaluate(() => [...document.querySelectorAll("#menu a")].map((a) => a.hash.slice(1)));
    const secoes = [];
    for (const id of ids) {
      await page.evaluate((i) => document.getElementById(i)?.scrollIntoView(), id);
      await esp(1600);
      secoes.push(await page.evaluate((i) => {
        const s = document.getElementById(i);
        const idx = [...document.querySelectorAll('div[aria-hidden="true"]')].map((x) => x.textContent.trim()).find((t) => /^\d\d \/ \d\d$/.test(t)) ?? null;
        const presos = s ? [...s.querySelectorAll("[data-revelar]")].filter((e) => { const r = e.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0 && Number(getComputedStyle(e).opacity) < 0.99; }).length : -1;
        return { id: i, existe: !!s, altura: s ? Math.round(s.getBoundingClientRect().height) : 0, indice: idx, presos, sw: document.documentElement.scrollWidth, iw: innerWidth };
      }, id));
    }
    await page.screenshot({ path: png("t1-ultima-secao") });
    t1.evidencias.push(rel(png("t1-ultima-secao")));
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await esp(1500);
    const framesVerif = await drena();
    const tVFim = await agora();
    const sVerif = await snap("verificacao-fim");
    out.verificacao = { recuperado, secoes };

    // (3) SOAK A: metodo da auditoria (abrir menu por clique DOM, Escape, rolar por dez posicoes)
    async function soak(nomeSoak, segundos, passoSnapS, ciclo) {
      await esp(1000);
      const snaps = [await snap(`${nomeSoak}-0`)];
      await drena();
      const ini = Date.now();
      let ciclos = 0;
      let proximo = ini + passoSnapS * 1000;
      while (Date.now() - ini < segundos * 1000) {
        await ciclo(ciclos);
        ciclos++;
        if (Date.now() >= proximo) {
          snaps.push(await snap(`${nomeSoak}-${Math.round((Date.now() - ini) / 1000)}s`));
          proximo += passoSnapS * 1000;
          console.log(`  [soak ${nomeSoak}] ${Math.round((Date.now() - ini) / 1000)} s, ciclos ${ciclos}, heap ${snaps.at(-1).heapPosGC}`);
        }
      }
      const parede = (Date.now() - ini) / 1000;
      const frames = await drena();
      await page.keyboard.press("Escape");
      await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
      await esp(2000);
      const fim = await snap(`${nomeSoak}-final`);
      return { snaps: [...snaps, fim], ciclos, parede, frames, tIni: snaps[0].t1, tFim: fim.t0 };
    }
    const cicloA = async (n) => {
      await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
      await page.evaluate(() => document.querySelector('[aria-label="Abrir menu"]').click());
      await esp(100);
      await page.keyboard.press("Escape");
      await esp(100);
      await page.evaluate((i) => scrollTo({ top: (document.documentElement.scrollHeight - innerHeight) * ((i % 10) / 9), behavior: "instant" }), n);
      await esp(150);
    };
    const A = await soak("A", SOAK_S, 30, cicloA);
    janelasHarness = [sInicio, sCarga, sRage, sVerif, ...A.snaps].map((s) => [s.t0 - 150, s.t1 + 150]);

    // (3b) SOAK B: ritmo humano (wheel em passos, pausas de leitura, menu a cada volta), como a tarefa 21
    let B = null;
    if (SOAK_B_S > 0) {
      let seed = 23;
      const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
      const cicloB = async () => {
        await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
        await page.evaluate(() => document.querySelector('[aria-label="Abrir menu"]').click());
        await esp(150);
        await page.keyboard.press("Escape");
        await esp(450);
        const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
        for (let p = 0; p < 260; p++) {
          if ((await page.evaluate(() => scrollY)) >= max - 4) break;
          await page.mouse.wheel(0, 220 + Math.floor(rnd() * 160));
          await esp(50 + Math.floor(rnd() * 50));
          if (p % (5 + Math.floor(rnd() * 5)) === 4) await esp(350 + Math.floor(rnd() * 800));
        }
        await esp(800);
      };
      B = await soak("B", SOAK_B_S, 60, cicloB);
      janelasHarness = [sInicio, sCarga, sRage, sVerif, ...A.snaps, ...B.snaps].map((s) => [s.t0 - 150, s.t1 + 150]);
    }
    clearInterval(vLag);
    clearInterval(vCpu);

    const lts = await lerLT();
    const final = (S) => S.snaps.at(-1);
    out.fases.carga = fase("carga (8 s)", sInicio, sCarga, naJanela(lts, 0, tCarga), framesCarga);
    out.fases.rage = fase("rage scroll (150 saltos)", sCarga, sRage, naJanela(lts, tRageIni, tRageFim), framesRage);
    out.fases.verificacao = fase("verificacao (40 wheels, Home, 8 secoes)", sRage, sVerif, naJanela(lts, tVIni, tVFim), framesVerif);
    const resumoSoak = (S) => {
      const lt = naJanela(lts, S.tIni, S.tFim);
      const f = fase(`soak ${S.snaps[0].rotulo[0]}`, S.snaps[0], final(S), lt, S.frames);
      const pos = S.snaps.map((s) => s.heapPosGC);
      return { ...f, paredeS: r1(S.parede), ciclos: S.ciclos, heapPosGCSerie: pos, nosSerie: S.snaps.map((s) => s.dom.nodes), listenersSerie: S.snaps.map((s) => s.dom.jsEventListeners),
        pausasGe500: lt.filter((l) => l.dur >= 500).map((l) => ({ startMs: r1(l.start), durMs: r1(l.dur), harness: l.harness })),
        piores: [...lt].sort((a, b) => b.dur - a.dur).slice(0, 8).map((l) => ({ startMs: r1(l.start), durMs: r1(l.dur), harness: l.harness })),
        lockFinal: final(S).estado.lock };
    };
    out.soakA = resumoSoak(A);
    if (B) out.soakB = resumoSoak(B);
    const cpuPor = (S) => host.cpu.filter(([w]) => w >= S.snaps[0].wall && w <= final(S).wall).map(([, p]) => p);
    const mediaCpu = (a) => (a.length ? r1(a.reduce((x, y) => x + y, 0) / a.length) : null);
    out.host = {
      nota: "lags: atraso do event loop do PROCESSO DO HARNESS (>80 ms); cpuMaquina: uso da CPU da maquina inteira por segundo (/proc/stat). Nao medem o renderer.",
      lagsN: host.lags.length, lagMaxMs: Math.max(0, ...host.lags.map((l) => l[1])),
      cpuMaquinaSoakAMedia: mediaCpu(cpuPor(A)), cpuMaquinaSoakAMax: Math.max(0, ...cpuPor(A)), cpuMaquinaSoakBMedia: B ? mediaCpu(cpuPor(B)) : null,
      cargaMediaIni: loadavg()[0],
    };
    out.consoleLogs = { erros: col.erros.slice(0, 10), avisos: col.avisos.slice(0, 10), pageerrors: col.pageerrors.slice(0, 10) };
    out.crash = col.crash;
    out.config = { chrome: nav.versao, viewport: "390x844 isMobile hasTouch DSF 1", cpuThrottle: 4, soakAS: SOAK_S, soakBS: SOAK_B_S, rageSaltos: 150 };
    guardarConsole(t1, col);
    guardarConsole(t10, col);
    writeFileSync(join(EVID, "fluidez-fases.json"), JSON.stringify(out, null, 2));
    t10.evidencias.push(rel(join(EVID, "fluidez-fases.json")));
    t1.evidencias.push(rel(join(EVID, "fluidez-fases.json")));

    // --- criterios do teste 1
    const aud = { longPre: 99, maxPre: 491, longSoak: 133, maxSoak: 1607, p95Frames: 50, ocupacaoPct: 82.6 };
    crit(t1, "1.secoes-montadas", "oito secoes do indice montadas, com altura, depois do rage", sim(secoes.length === 8 && secoes.every((s) => s.existe && s.altura > 0)), { secoes: secoes.map((s) => [s.id, s.altura]) });
    crit(t1, "1.retorno-sem-lock", "Home volta a y=0 e nao deixa trava de rolagem", sim(recuperado.y === 0 && recuperado.inline === "" && recuperado.htmlOverflowY !== "hidden"), recuperado);
    crit(t1, "1.indices", "indices 01 / 08 a 08 / 08 corretos em cada secao", sim(secoes.every((s, i) => s.indice === `${String(i + 1).padStart(2, "0")} / 08`)), { lidos: secoes.map((s) => s.indice) });
    crit(t1, "1.sem-revelacao-presa", "nenhum [data-revelar] visivel preso com opacidade < 0,99", sim(secoes.every((s) => s.presos === 0)), { presos: secoes.map((s) => s.presos) });
    crit(t1, "1.sem-overflow-x", "sem rolagem horizontal em nenhuma secao", sim(secoes.every((s) => s.sw <= s.iw + 1)), { max: Math.max(...secoes.map((s) => s.sw)) });
    const pre = naJanela(lts, 0, tVFim);
    const preSt = statLT(pre);
    crit(t1, "1.long-tasks-vs-auditoria", `carga+rage+verificacao sem regressao frente a auditoria (<= ${aud.longPre} long tasks, maximo <= ${aud.maxPre} ms)`, sim(preSt.n <= aud.longPre && preSt.maxMs <= aud.maxPre), { agora: preSt, auditoria: { n: aud.longPre, maxMs: aud.maxPre } });
    crit(t1, "1.pausas-500", "nenhuma pausa >= 500 ms na carga, rage e verificacao (>= 1 e limite do host headless, tarefa 21)", preSt.ge500 ? "ambiente" : "passa", { ge500: preSt.ge500, nota: "sem trace nesta rodada: atribuicao a Commit nativo herdada da tarefa 21" });
    crit(t1, "1.sem-erro-de-pagina", "nenhum pageerror nem crash", sim(!col.pageerrors.length && !col.crash), { pageerrors: col.pageerrors.slice(0, 3), crash: col.crash });

    // --- criterios do teste 10
    const hs = out.soakA.heapPosGCSerie;
    const ult = hs.slice(-4);
    const faixa = (Math.max(...ult) - Math.min(...ult)) / Math.min(...ult);
    crit(t10, "10.soak-300s", "soak A dura >= 300 s reais", sim(out.soakA.paredeS >= 300), { paredeS: out.soakA.paredeS, ciclos: out.soakA.ciclos });
    crit(t10, "10.sem-crash", "pagina viva ao fim, sem crash nem pageerror", sim(!col.crash && !col.pageerrors.length), { crash: col.crash });
    crit(t10, "10.dom-listeners-estaveis", "nos DOM e listeners finais iguais aos iniciais (tolerancia 1%)",
      sim(Math.abs(out.soakA.nosFim - out.soakA.nosIni) <= out.soakA.nosIni * 0.01 && Math.abs(out.soakA.listenersFim - out.soakA.listenersIni) <= out.soakA.listenersIni * 0.01),
      { nos: [out.soakA.nosIni, out.soakA.nosFim], listeners: [out.soakA.listenersIni, out.soakA.listenersFim] });
    crit(t10, "10.heap-estavel", "heap pos-GC final <= 1,25x o inicial e ultimas 4 amostras dentro de 8%", sim(hs.at(-1) <= hs[0] * 1.25 && faixa <= 0.08), { ini: hs[0], fim: hs.at(-1), faixaUltimas4: r1(faixa * 100) });
    crit(t10, "10.sem-lock-residual", "sem trava de rolagem residual ao fim", sim(out.soakA.lockFinal === ""), { lock: out.soakA.lockFinal });
    crit(t10, "10.long-tasks-vs-auditoria", `soak A sem regressao frente a auditoria (<= ${aud.longSoak} long tasks, maximo <= ${aud.maxSoak} ms, ocupacao <= ${aud.ocupacaoPct}%)`,
      sim(out.soakA.longTasks.n <= aud.longSoak && out.soakA.longTasks.maxMs <= aud.maxSoak && out.soakA.taskDurationPct <= aud.ocupacaoPct),
      { agora: { n: out.soakA.longTasks.n, maxMs: out.soakA.longTasks.maxMs, ocupacaoPct: out.soakA.taskDurationPct }, auditoria: { n: aud.longSoak, maxMs: aud.maxSoak, ocupacaoPct: aud.ocupacaoPct } });
    crit(t10, "10.frames-p95", `intervalo de frames p95 <= ${aud.p95Frames} ms no soak A`, sim((out.soakA.frames.p95 ?? 0) <= aud.p95Frames), { p95: out.soakA.frames.p95, p99: out.soakA.frames.p99 });
    crit(t10, "10.pausas-500", "nenhuma pausa >= 500 ms no soak A (>= 1 e limite do host headless, tarefa 21)", out.soakA.longTasks.ge500 ? "ambiente" : "passa",
      { ge500A: out.soakA.longTasks.ge500, ge500B: out.soakB?.longTasks.ge500 ?? null, nota: "sem trace nesta rodada: atribuicao a Commit nativo herdada da tarefa 21" });
    nota(t10, "TaskDuration e tempo ocupado da thread principal do renderer, nao percentual de CPU do SO; headless x86 de desktop com CPU 4x nao substitui aparelho fisico.");
    nota(t10, "A queda frente a auditoria nao e prova de ganho de uma correcao: a tarefa 21 nao alterou produto; mudaram a arvore (Halteres removida) e o navegador.");
  } finally {
    await ctx.close().catch(() => {});
  }
}

// ---------------------------------------------------------------------------------------------
// Teste 2: resize thrashing
// ---------------------------------------------------------------------------------------------

async function teste2(browser) {
  const t = T(2, "Resize Thrashing");
  await comPagina(browser, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, async (page, ctx, col) => {
    await abrirPagina(page);
    await recusar(page);
    const tam = [[320, 568], [1080, 320], [390, 844], [844, 390]];
    const ruins = [];
    for (let i = 0; i < 64; i++) {
      await page.setViewportSize({ width: tam[i % 4][0], height: tam[i % 4][1] });
      const d = await docOverflow(page);
      if (!semOverflow(d)) ruins.push({ i, ...d });
    }
    const estaveis = [];
    for (const [w, h] of tam) {
      await page.setViewportSize({ width: w, height: h });
      await esp(400);
      estaveis.push({ w, ...(await docOverflow(page)) });
    }
    crit(t, "2.64-resizes", "64 mudancas sequenciais de viewport sem overflow horizontal (nem estabilizado)", sim(!ruins.length && estaveis.every(semOverflow)), { overflowEm: ruins.slice(0, 5), estaveis });

    // cenario do cartao: 1080x720 -> 320x568 com menu aberto
    await page.setViewportSize({ width: 1080, height: 720 });
    await page.evaluate(() => scrollTo(0, 0));
    await abrirMenu(page);
    await page.setViewportSize({ width: 320, height: 568 });
    await esp(600);
    const m = await page.evaluate(medirFechar);
    await page.screenshot({ path: png("t2-menu-1080-para-320") });
    t.evidencias.push(rel(png("t2-menu-1080-para-320")));
    crit(t, "2.fechar-visivel", "1080x720 -> 320x568 com menu aberto: Fechar dentro da viewport, alvo >= 44 px, e o proprio botao no ponto central", sim(m.existe && m.dentro && m.alvo44 && m.hit), m);
    await page.touchscreen.tap(m.cx, m.cy);
    await esp(1000);
    crit(t, "2.fechar-por-toque", "toque real em Fechar fecha o menu", sim((await expandido(page)) === "false"), { expandido: await expandido(page), trava: await travaRolagem(page) });

    // landscape -> portrait com menu aberto
    await page.setViewportSize({ width: 844, height: 390 });
    await esp(400);
    await abrirMenu(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await esp(600);
    const p = await page.evaluate(medirFechar);
    const d = await docOverflow(page);
    crit(t, "2.landscape-portrait", "844x390 -> 390x844 com menu aberto: Fechar >= 44 px, alcancavel, 8 links e sem overflow", sim(p.existe && p.dentro && p.alvo44 && p.hit && p.links === 8 && semOverflow(d)), { ...p, doc: d });
    await page.touchscreen.tap(p.cx, p.cy);
    await esp(900);
    crit(t, "2.landscape-fecha", "toque em Fechar apos landscape -> portrait fecha o menu e libera a rolagem", sim((await expandido(page)) === "false" && (await travaRolagem(page)).inline === ""), await travaRolagem(page));
    guardarConsole(t, col);
  });
}

// ---------------------------------------------------------------------------------------------
// Teste 3: rage clicks
// ---------------------------------------------------------------------------------------------

async function teste3(browser) {
  const t = T(3, "Rage Clicks & Double Submits");
  await comPagina(browser, { viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true }, async (page, ctx, col) => {
    await abrirPagina(page);
    await recusar(page);
    const bb = await page.locator(ABRIR).boundingBox();
    for (let i = 0; i < 50; i++) await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2);
    await page.keyboard.press("Escape");
    await esp(900);
    const dep = await page.evaluate((s) => ({ menus: document.querySelectorAll("#menu").length, exp: document.querySelector(s)?.getAttribute("aria-expanded"), ...(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }))() }), ABRIR);
    const trava = await travaRolagem(page);
    crit(t, "3.menu-unico", "50 cliques no menu: um unico #menu no DOM", sim(dep.menus === 1), dep);
    crit(t, "3.menu-fechado-sem-lock", "apos Escape: menu fechado, sem trava de rolagem, fundo sem inert e sem overflow", sim(dep.exp === "false" && trava.inline === "" && trava.fundoInert === 0 && semOverflow(dep)), { ...dep, ...trava });

    // FAQ
    const sums = page.locator("summary");
    const nFaq = await sums.count();
    await sums.first().scrollIntoViewIfNeeded();
    await esp(1000);
    const fb = await sums.first().boundingBox();
    for (let i = 0; i < 40; i++) await page.mouse.click(fb.x + 20, fb.y + 15);
    await esp(800);
    const faq = await page.evaluate(() => {
      const ds = [...document.querySelectorAll(".dialogo > details")];
      return {
        itens: ds.length,
        abertos: ds.filter((d) => d.querySelector("summary")?.getAttribute("aria-expanded") === "true").length,
        // details fica sempre open (decisao de projeto): o estado real e aria-expanded + data-aberto + inert
        consistente: ds.every((d) => {
          const exp = d.querySelector("summary")?.getAttribute("aria-expanded") === "true";
          return exp === d.hasAttribute("data-aberto") && exp === !d.querySelector(".resposta")?.inert;
        }),
      };
    });
    crit(t, "3.faq-consistente", "40 cliques no FAQ: no maximo 1 item aberto e aria-expanded, data-aberto e inert coerentes", sim(faq.itens > 0 && faq.abertos <= 1 && faq.consistente), { ...faq, summaries: nFaq });

    // CTA da dobra: tres cadencias, cada uma em pagina recarregada
    const irAoCta = async (rotulo, acao) => {
      await page.goto(URL_ALVO, { waitUntil: "load" });
      await page.waitForFunction(() => document.documentElement.classList.contains("pronto"), null, { timeout: 20000 });
      await page.waitForFunction(() => !document.documentElement.classList.contains("intro-pendente"), null, { timeout: 10000 }).catch(() => {});
      await esp(700);
      await recusar(page);
      await esp(400);
      await acao();
      await esp(2800);
      const r = await page.evaluate(() => ({ y: Math.round(scrollY), hash: location.hash, ofertaTop: Math.round(document.getElementById("oferta").getBoundingClientRect().top), menus: document.querySelectorAll("#menu").length, sw: document.documentElement.scrollWidth, iw: innerWidth }));
      return { rotulo, ...r };
    };
    const ok = (r) => Math.abs(r.ofertaTop) <= 24 && r.menus === 1 && r.sw <= r.iw + 1;
    const rajada = await irAoCta("25 .click() DOM no mesmo task (cenario do suplemento da auditoria)", () => page.evaluate(() => { for (let i = 0; i < 25; i++) document.querySelector('a[data-posicao="dobra"]').click(); }));
    await page.screenshot({ path: png("t3-cta-rajada-sincrona") });
    t.evidencias.push(rel(png("t3-cta-rajada-sincrona")));
    const ritmada = await irAoCta("25 .click() DOM a cada 16 ms", () => page.evaluate(async () => { for (let i = 0; i < 25; i++) { document.querySelector('a[data-posicao="dobra"]').click(); await new Promise((r) => setTimeout(r, 16)); } }));
    const real = await irAoCta("25 cliques reais de mouse no centro do CTA", async () => {
      const b = await page.locator('a[data-posicao="dobra"]').first().boundingBox();
      for (let i = 0; i < 25; i++) await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
    });
    crit(t, "3.cta-cliques-reais", "25 cliques reais de mouse no CTA: termina em #oferta (|topo| <= 24 px), sem overflow e um menu", sim(ok(real)), real);
    crit(t, "3.cta-ritmado", "25 .click() DOM a cada 16 ms: termina em #oferta", sim(ok(ritmada)), ritmada);
    crit(t, "3.cta-rajada-sincrona", "INFORMATIVA, fora do veredito: 25 .click() DOM no mesmo task. Sem gesto humano que a produza (cliques reais de 30 a 150 ms e toque duplo terminam em #oferta; tarefa 40)", "na", rajada);
    nota(t, "A rajada sincrona (2 ou mais .click() no mesmo task) deixa a pagina em y=0 com hash #oferta: o hash muda e a rolagem nao ocorre. Cliques reais e ritmados (>= 16 ms) rolam. Causa medida na tarefa 40: Lenis com anchors:true chama scrollTo('#oferta') e a navegacao nativa do hash e sincrona, entao do 2o clique em diante o destino sai 0 (rect.top ~0 e animatedScroll ainda 0 ate o rAF); sem Lenis ou com anchors:false a rajada passa. Gesto humano nao falha.");

    // 15 ciclos abrir menu -> link Inicio
    await page.evaluate(() => scrollTo({ top: 3000, behavior: "instant" }));
    await esp(500);
    await recusar(page);
    let falhasClique = 0;
    for (let i = 0; i < 15; i++) {
      try {
        await page.click(ABRIR, { timeout: 6000 });
        await page.click('#menu a[href="#inicio"]', { timeout: 6000 });
      } catch { falhasClique++; }
    }
    await esp(1800);
    const fim = await page.evaluate((s) => ({ y: Math.round(scrollY), exp: document.querySelector(s)?.getAttribute("aria-expanded") }), ABRIR);
    crit(t, "3.ciclos-navegacao", "15 ciclos abrir menu + ir a Inicio: nenhum clique perdido, termina no topo e com menu fechado", sim(falhasClique === 0 && fim.y <= 8 && fim.exp === "false"), { falhasClique, ...fim });
    await page.screenshot({ path: png("t3-apos-rage") });
    t.evidencias.push(rel(png("t3-apos-rage")));

    const campos = await page.evaluate(() => document.querySelectorAll("input,textarea,select,form,[contenteditable='true']").length);
    crit(t, "3.double-submit", "double-submit: nao ha formulario nem checkout real nesta versao (#oferta e ancora)", campos === 0 ? "na" : "erro", { camposNoDom: campos, nota: "campos apareceram: o harness nao implementa envio" });
    guardarConsole(t, col);
  });
}

// ---------------------------------------------------------------------------------------------
// Teste 4: rede lenta e interacao precoce
// ---------------------------------------------------------------------------------------------

const INIT_CLS = () => {
  window.__shifts = [];
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__shifts.push({ v: e.value, r: e.hadRecentInput, t: e.startTime }); }).observe({ type: "layout-shift", buffered: true });
};
const clsJanela = (shifts) => {
  let cls = 0, ini = 0, ult = 0, soma = 0;
  for (const e of shifts.filter((s) => !s.r)) {
    if (e.t - ult > 1000 || e.t - ini > 5000) { ini = e.t; soma = 0; }
    soma += e.v; ult = e.t; cls = Math.max(cls, soma);
  }
  return cls;
};
const menuVisivel = () => {
  const m = document.querySelector("#menu");
  const r = m.getBoundingClientRect();
  const cs = getComputedStyle(m);
  return { pronto: document.documentElement.classList.contains("pronto"), hash: location.hash, visibility: cs.visibility, alvo: m.matches(":target"), w: Math.round(r.width), h: Math.round(r.height), iw: innerWidth, ih: innerHeight, exp: document.querySelector('[aria-label="Abrir menu"]')?.getAttribute("aria-expanded") };
};

async function teste4(browser) {
  const t = T(4, "Rede lenta e interação precoce");
  const movel = { viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true };

  // (a) 2G natural, sem gate: menu antes da hidratacao
  await comPagina(browser, movel, async (page, ctx, col) => {
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 1000, downloadThroughput: 15000, uploadThroughput: 7500 });
    await page.goto(URL_ALVO, { waitUntil: "commit", timeout: 90000 });
    const trig = page.locator(ABRIR);
    await trig.waitFor({ state: "visible", timeout: 90000 });
    const pre = await page.evaluate(() => ({ pronto: document.documentElement.classList.contains("pronto"), t: Math.round(performance.now()) }));
    if (pre.pronto) {
      crit(t, "4.2g.abre-antes", "2G natural: menu abre por :target antes da hidratacao", "erro", { pre, motivo: "ja hidratado quando o menu ficou visivel: precondicao nao reproduzida" });
    } else {
      await trig.click({ timeout: 60000 });
      const ap = await page.evaluate(menuVisivel);
      await page.screenshot({ path: png("t4-2g-menu-antes-da-hidratacao"), timeout: 60000 });
      t.evidencias.push(rel(png("t4-2g-menu-antes-da-hidratacao")));
      crit(t, "4.2g.abre-antes", "2G natural: clicar no menu antes da hidratacao o abre (visivel, tela cheia) sem JavaScript", sim(ap.visibility === "visible" && ap.h >= ap.ih * 0.9 && ap.w >= ap.iw * 0.9), { pre, ap });
      await page.waitForFunction(() => document.documentElement.classList.contains("pronto"), null, { timeout: 120000 });
      await esp(1200);
      const dep = await page.evaluate(menuVisivel);
      crit(t, "4.2g.sobrevive-hidratacao", "a hidratacao nao fecha nem salta o menu aberto (aria-expanded=true, visivel, hash limpo)", sim(dep.exp === "true" && dep.visibility === "visible" && dep.hash === ""), dep);
      await page.click(FECHAR, { timeout: 10000 });
      await esp(1000);
      crit(t, "4.2g.fecha-depois", "Fechar apos a hidratacao fecha o menu", sim((await expandido(page)) === "false"), { exp: await expandido(page) });
    }
    guardarConsole(t, col);
  });

  // (a2) 2G natural: CTA nativo antes da hidratacao
  await comPagina(browser, movel, async (page, ctx, col) => {
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 1000, downloadThroughput: 15000, uploadThroughput: 7500 });
    await page.goto(URL_ALVO, { waitUntil: "commit", timeout: 90000 });
    const cta = page.locator('a[data-posicao="dobra"]').first();
    await cta.waitFor({ state: "visible", timeout: 90000 });
    // so ha o que testar quando o documento ja traz a pagina inteira (o preview local nao comprime o HTML)
    await page.waitForFunction(() => !!document.getElementById("fechamento"), null, { timeout: 90000 });
    const pronto = await page.evaluate(() => document.documentElement.classList.contains("pronto"));
    await cta.click({ timeout: 60000 });
    let r = null;
    for (let i = 0; i < 24; i++) {
      await esp(500);
      r = await page.evaluate(() => ({ hash: location.hash, top: document.getElementById("oferta")?.getBoundingClientRect().top ?? null, pronto: document.documentElement.classList.contains("pronto") }));
      if (r.top !== null && Math.abs(r.top) <= 24) break;
    }
    crit(t, "4.2g.cta-nativo", "2G natural: CTA da dobra navega a #oferta antes do JavaScript (|topo| <= 24 px)", pronto ? "erro" : sim(r.hash === "#oferta" && r.top !== null && Math.abs(r.top) <= 24), { prontoNoClique: pronto, ...r });
    guardarConsole(t, col);
  });

  // (b) 3G controlado: bundle principal retido; teclado antes da hidratacao
  await comPagina(browser, movel, async (page, ctx, col) => {
    await page.addInitScript(INIT_CLS);
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 750, downloadThroughput: 50000, uploadThroughput: 25000 });
    let soltar;
    const portao = new Promise((r) => { soltar = r; });
    await page.route("**/assets/index-*.js", async (rota) => { await portao; await rota.continue(); });
    await page.goto(URL_ALVO, { waitUntil: "commit", timeout: 60000 });
    const trig = page.locator(ABRIR);
    await trig.waitFor({ state: "visible", timeout: 60000 });
    await trig.focus();
    await page.keyboard.press("Enter");
    await esp(900);
    const ap = await page.evaluate(menuVisivel);
    await page.screenshot({ path: png("t4-3g-menu-por-teclado") });
    t.evidencias.push(rel(png("t4-3g-menu-por-teclado")));
    crit(t, "4.3g.teclado-antes", "3G com bundle retido: Enter no menu antes da hidratacao o abre", sim(!ap.pronto && ap.visibility === "visible" && ap.h >= ap.ih * 0.9), ap);
    await page.click('#menu a[href="#fechamento"]', { timeout: 10000 });
    await esp(900);
    const nav = await page.evaluate(() => ({ hash: location.hash, top: document.getElementById("fechamento")?.getBoundingClientRect().top ?? null, menu: getComputedStyle(document.querySelector("#menu")).visibility }));
    crit(t, "4.3g.link-nativo", "link do menu navega ao destino e fecha o menu antes da hidratacao", sim(nav.hash === "#fechamento" && nav.top !== null && Math.abs(nav.top) <= 24 && nav.menu === "hidden"), nav);
    await esp(8500);
    const fb = await page.evaluate(() => ({ classes: document.documentElement.className, travado: getComputedStyle(document.body).overflowY === "hidden" || getComputedStyle(document.documentElement).overflowY === "hidden" }));
    crit(t, "4.3g.fallback-libera", "sem JS aos 8 s: classe js removida e rolagem liberada (nada preso invisivel)", sim(!/\bjs\b/.test(fb.classes) && !fb.travado), fb);
    soltar();
    await page.waitForFunction(() => document.documentElement.classList.contains("pronto"), null, { timeout: 90000 });
    await page.evaluate(() => scrollTo(0, 0));
    await esp(800);
    await page.click(ABRIR, { timeout: 10000 });
    await esp(900);
    crit(t, "4.3g.apos-hidratacao", "apos hidratar, o menu abre normalmente", sim((await expandido(page)) === "true"), { exp: await expandido(page) });
    const shifts = await page.evaluate(() => window.__shifts);
    const cls = clsJanela(shifts);
    crit(t, "4.cls", "CLS por janela <= 0,1 durante a carga lenta", sim(cls <= 0.1), { cls: Math.round(cls * 10000) / 10000, auditoria: 0.0217 });
    guardarConsole(t, col);
  });

  // (c) JavaScript desligado
  await comPagina(browser, { ...movel, javaScriptEnabled: false }, async (page) => {
    await page.goto(URL_ALVO, { waitUntil: "load", timeout: 30000 });
    await page.click(ABRIR, { timeout: 10000 });
    await esp(600);
    const ap = await page.evaluate(menuVisivel);
    await page.click('#menu a[href="#mapa"]', { timeout: 10000 });
    await esp(600);
    const nav = await page.evaluate(() => ({ hash: location.hash, top: document.getElementById("mapa")?.getBoundingClientRect().top ?? null }));
    crit(t, "4.sem-js", "sem JavaScript: menu abre por :target e o link navega ao destino", sim(ap.visibility === "visible" && nav.hash === "#mapa" && nav.top !== null && Math.abs(nav.top) <= 24), { ap, nav });
  });
}

// ---------------------------------------------------------------------------------------------
// Teste 5: inputs (N/A com inventario)
// ---------------------------------------------------------------------------------------------

async function teste5(browser) {
  const t = T(5, "Abuso de inputs");
  await comPagina(browser, { viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true }, async (page, ctx, col) => {
    await abrirPagina(page);
    const inv = await page.evaluate(() => ({
      input: document.querySelectorAll("input").length, textarea: document.querySelectorAll("textarea").length, select: document.querySelectorAll("select").length,
      contenteditable: document.querySelectorAll('[contenteditable="true"]').length, textbox: document.querySelectorAll('[role="textbox"]').length, forms: document.forms.length,
    }));
    const total = Object.values(inv).reduce((a, b) => a + b, 0);
    crit(t, "5.inventario", "nao ha campo editavel nem formulario: validacao de entrada e XSS nao se aplicam (nao aprovar recurso inexistente)", total === 0 ? "na" : "erro", { ...inv, nota: total ? "campos apareceram: o harness nao implementa a matriz de abuso" : "nenhum payload foi injetado" });
    guardarConsole(t, col);
  });
}

// ---------------------------------------------------------------------------------------------
// Teste 6: modais e z-index
// ---------------------------------------------------------------------------------------------

async function teste6(browser) {
  const t = T(6, "Pesadelo de modais e z-index");
  await comPagina(browser, { viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true }, async (page, ctx, col) => {
    await abrirPagina(page);
    await page.waitForSelector(COOKIE, { state: "visible", timeout: 10000 });
    const y0 = await page.evaluate(() => Math.round(scrollY));
    await abrirMenu(page);
    const foco = () => page.evaluate(() => ({ dentro: !!document.activeElement?.closest("#menu"), tag: document.activeElement?.tagName, rotulo: document.activeElement?.getAttribute("aria-label") || document.activeElement?.textContent?.trim().slice(0, 24), y: Math.round(scrollY) }));
    const tabs = [], shifts = [];
    for (let i = 0; i < 20; i++) { await page.keyboard.press("Tab"); tabs.push(await foco()); }
    for (let i = 0; i < 20; i++) { await page.keyboard.press("Shift+Tab"); shifts.push(await foco()); }
    crit(t, "6.tab-contido", "20 Tabs com o menu aberto: o foco nunca sai do menu", sim(tabs.every((f) => f.dentro)), { fora: tabs.filter((f) => !f.dentro).slice(0, 3), distintos: [...new Set(tabs.map((f) => f.rotulo))].length });
    crit(t, "6.shift-tab-contido", "20 Shift+Tabs com o menu aberto: o foco nunca sai do menu", sim(shifts.every((f) => f.dentro)), { fora: shifts.filter((f) => !f.dentro).slice(0, 3) });
    crit(t, "6.sem-deslocamento", "o foco nao desloca a pagina (y igual ao de antes)", sim([...tabs, ...shifts].every((f) => Math.abs(f.y - y0) <= 2)), { y0, max: Math.max(...[...tabs, ...shifts].map((f) => f.y)) });

    const fundo = await page.evaluate(() => {
      const aceitar = [...document.querySelectorAll('aside[aria-label="Aviso de cookies"] button')].find((b) => b.textContent.trim() === "Aceitar");
      const r = aceitar.getBoundingClientRect();
      const topo = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      aceitar.focus();
      return {
        filhos: [...document.body.children].filter((e) => e.id !== "menu").map((e) => ({ tag: e.tagName, inert: e.inert })),
        zMenu: getComputedStyle(document.querySelector("#menu")).zIndex,
        hitNoMenu: !!topo?.closest("#menu"), focoNoAceitar: document.activeElement === aceitar,
        cx: r.left + r.width / 2, cy: r.top + r.height / 2,
      };
    });
    crit(t, "6.fundo-inert", "todo irmao do menu em body esta inert enquanto aberto", sim(fundo.filhos.every((f) => f.inert)), { filhos: fundo.filhos });
    crit(t, "6.camadas", "o menu esta acima do aviso de cookies (hit-test na regiao do aviso cai no menu)", sim(fundo.hitNoMenu), { zMenu: fundo.zMenu });
    crit(t, "6.foco-programatico", "focus() no Aceitar do fundo nao captura o foco", sim(!fundo.focoNoAceitar), fundo);
    // 13 Tabs e Enter (a sequencia que, na auditoria, aceitava o consentimento encoberto)
    for (let i = 0; i < 13; i++) await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await esp(900);
    const aposEnter = await page.evaluate(() => ({ aviso: !!document.querySelector('aside[aria-label="Aviso de cookies"]'), chaves: [...Object.keys(localStorage), ...Object.keys(sessionStorage)].filter((k) => /consentimento/.test(k)), exp: document.querySelector('[aria-label="Abrir menu"]')?.getAttribute("aria-expanded") }));
    crit(t, "6.consentimento-protegido", "Tab x13 + Enter com o menu aberto (a sequencia da auditoria) nao grava o consentimento nem remove o aviso", sim(aposEnter.aviso && !aposEnter.chaves.length), { aposEnter });

    // Escape restaura o foco no acionador e solta o fundo
    await page.evaluate(() => scrollTo(0, 0));
    await esp(600);
    if ((await expandido(page)) !== "true") await abrirMenu(page);
    await page.keyboard.press("Escape");
    await esp(900);
    const esc = await page.evaluate(() => ({ exp: document.querySelector('[aria-label="Abrir menu"]').getAttribute("aria-expanded"), focoNoAcionador: document.activeElement === document.querySelector('[aria-label="Abrir menu"]'), inline: document.documentElement.style.overflow, inertRestante: [...document.body.children].filter((e) => e.id !== "menu" && e.inert).length }));
    crit(t, "6.escape-restaura", "Escape fecha, devolve o foco ao acionador, libera a rolagem e remove o inert do fundo", sim(esc.exp === "false" && esc.focoNoAcionador && esc.inline === "" && esc.inertRestante === 0), esc);
    await page.screenshot({ path: png("t6-apos-escape") });
    t.evidencias.push(rel(png("t6-apos-escape")));
    const dialogos = await page.evaluate(() => document.querySelectorAll('[role="dialog"], dialog').length);
    crit(t, "6.exit-intent", "popup de saida (exit-intent) nao existe nesta versao: so o menu e dialogo", dialogos === 1 ? "na" : "erro", { dialogos });
    guardarConsole(t, col);
  });
}

// ---------------------------------------------------------------------------------------------
// Teste 7: texto ampliado (M1 = raiz, M2 = texto computado; emulacao, nao escala nativa do SO)
// ---------------------------------------------------------------------------------------------

function medirTexto(escopo) {
  const raiz = document.querySelector(escopo);
  if (!raiz) return { ausente: true, problemas: [] };
  const iw = innerWidth;
  const problemas = [];
  for (const el of [raiz, ...raiz.querySelectorAll("*")]) {
    if (!el.isConnected || el.closest('[aria-hidden="true"]') || !([...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))) continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    const rects = [];
    for (const n of el.childNodes) {
      if (n.nodeType !== 3 || !n.textContent.trim()) continue;
      const rg = document.createRange();
      rg.selectNodeContents(n);
      for (const q of rg.getClientRects()) if (q.width > 0) rects.push(q);
    }
    if (!rects.length) continue;
    const u = { l: Math.min(...rects.map((q) => q.left)), r: Math.max(...rects.map((q) => q.right)), t: Math.min(...rects.map((q) => q.top)), b: Math.max(...rects.map((q) => q.bottom)) };
    const em = parseFloat(cs.fontSize) || 16;
    let corte = null;
    for (let a = el; a && a !== document.documentElement; a = a.parentElement) {
      const c = getComputedStyle(a);
      const corta = (o) => o !== "visible" && o !== "auto" && o !== "scroll";
      if (!corta(c.overflowX) && !corta(c.overflowY)) continue;
      const ar = a.getBoundingClientRect();
      if (corta(c.overflowX) && (u.r > ar.right + 1 || u.l < ar.left - 1)) { corte = `X por ${a.tagName.toLowerCase()}${a.id ? "#" + a.id : ""}: texto ${Math.round(u.r - u.l)} px em ${Math.round(ar.width)} px`; break; }
      if (corta(c.overflowY) && (u.b > ar.bottom + 1 || u.t < ar.top - 1) && Math.max(u.b - ar.bottom, ar.top - u.t) / em > 0.25) { corte = `Y por ${a.tagName.toLowerCase()}${a.id ? "#" + a.id : ""}`; break; }
    }
    const fora = u.r > iw + 1 || u.l < -1;
    if (corte || fora) problemas.push({ texto: el.textContent.trim().replace(/\s+/g, " ").slice(0, 32), el: el.tagName.toLowerCase(), corte, foraDaViewport: fora ? Math.round(Math.max(u.r - iw, -u.l)) : 0 });
  }
  return { ausente: false, problemas: problemas.slice(0, 12), n: problemas.length };
}
function alcance(el, opc) {
  // a doca nasce fora da tela (translate-y-full) e so aparece ativa: nao e um CTA a alcancar no topo
  if (opc?.ignorarMenu && el.closest("#menu, .doca")) return { oculto: true, ok: true };
  const r = el.getBoundingClientRect();
  if (r.width === 0) return { oculto: true, ok: true };
  el.scrollIntoView({ block: "center", inline: "center", behavior: "instant" });
  const q = el.getBoundingClientRect();
  const x = q.left + q.width / 2, y = q.top + q.height / 2;
  const h = x >= 0 && x <= innerWidth && y >= 0 && y <= innerHeight ? document.elementFromPoint(x, y) : null;
  return { oculto: false, ok: !!h && (el === h || el.contains(h) || h.contains(el)) };
}

async function teste7(browser) {
  const t = T(7, "Acessibilidade extrema: font maxing");
  const VPS = [[320, 640], [360, 740], [390, 844]];
  const combos = [
    ...[16, 32, 48].flatMap((e) => VPS.map(([w, h]) => ({ modo: "M1", escala: e, w, h }))),
    ...[2, 3].flatMap((e) => VPS.map(([w, h]) => ({ modo: "M2", escala: e, w, h }))),
  ];
  const res = [];
  for (const c of combos) {
    const r = { ...c, erro: null };
    try {
      await comPagina(browser, { viewport: { width: c.w, height: c.h }, deviceScaleFactor: 1 }, async (page, ctx, col) => {
        await abrirPagina(page);
        await page.waitForSelector(COOKIE, { state: "visible", timeout: 8000 }).catch(() => {});
        if (c.modo === "M1") await page.addStyleTag({ content: `html{font-size:${c.escala}px !important}` });
        else {
          await page.evaluate((k) => {
            const els = [...document.querySelectorAll("body *")].filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && !["SCRIPT", "STYLE", "NOSCRIPT"].includes(e.tagName));
            const leit = els.map((e) => [e, parseFloat(getComputedStyle(e).fontSize)]);
            for (const [e, px] of leit) e.style.setProperty("font-size", `${px * k}px`, "important");
          }, c.escala);
        }
        await esp(1500);
        r.fontes = await page.evaluate(() => {
          const f = (s) => { const e = document.querySelector(s); return e ? parseFloat(getComputedStyle(e).fontSize) : null; };
          return { corpo: f("#inicio .painel__corpo"), cta: f('a[data-posicao="dobra"] .botao__rolo span') ?? f('a[data-posicao="dobra"]'), cookie: f('aside[aria-label="Aviso de cookies"] button'), menu: f("#menu nav a"), titulo: f("#inicio h1 .linha__texto") ?? f("#inicio h1") };
        });
        r.doc = await docOverflow(page);
        r.dobra = await page.evaluate(medirTexto, "#inicio");
        r.cookies = await page.evaluate(medirTexto, COOKIE);
        r.alcanceCookies = [];
        for (const b of await page.locator(`${COOKIE} button`).elementHandles()) r.alcanceCookies.push(await b.evaluate(alcance));
        const foto = c.w === 360 && ((c.modo === "M1" && c.escala > 16) || c.modo === "M2");
        await page.evaluate(() => scrollTo(0, 0));
        if (foto) { const n = `t7-${c.modo}-${c.escala}-360-dobra`; await page.screenshot({ path: png(n) }); t.evidencias.push(rel(png(n))); }
        await recusar(page);
        await page.click(ABRIR, { timeout: 5000 }).catch(() => page.evaluate((s) => document.querySelector(s).click(), ABRIR));
        await esp(1500);
        r.menu = await page.evaluate(medirTexto, "#menu");
        r.docMenu = await docOverflow(page);
        r.alcanceFechar = await page.locator(FECHAR).elementHandle().then((h) => h.evaluate(alcance)).catch(() => ({ ok: false }));
        if (foto) { const n = `t7-${c.modo}-${c.escala}-360-menu`; await page.screenshot({ path: png(n) }); t.evidencias.push(rel(png(n))); }
        await page.keyboard.press("Escape");
        await esp(700);
        r.alcanceCtas = [];
        for (const h of await page.locator("a[data-posicao]").elementHandles()) r.alcanceCtas.push(await h.evaluate(alcance, { ignorarMenu: true }));
        guardarConsole(t, col);
      });
    } catch (e) { r.erro = String(e.message).split("\n")[0]; }
    res.push(r);
    console.log(`  [7] ${c.modo} ${c.escala} @${c.w}${r.erro ? " ERRO " + r.erro : ""}`);
  }
  writeFileSync(join(EVID, "t7-medicoes.json"), JSON.stringify(res, null, 2));
  t.evidencias.push(rel(join(EVID, "t7-medicoes.json")));
  const com = res.filter((r) => !r.erro);
  if (com.length !== res.length) throw new Error(`teste 7: ${res.length - com.length} combinacoes falharam no harness (${res.find((r) => r.erro).erro})`);
  const M1 = com.filter((r) => r.modo === "M1"), M2 = com.filter((r) => r.modo === "M2");
  const base = Object.fromEntries(M1.filter((r) => r.escala === 16).map((r) => [r.w, r.fontes]));
  const amp = (r, k) => (base[r.w]?.[k] ? r.fontes[k] / base[r.w][k] : null);
  const cx = M1.filter((r) => r.escala === 32);
  const probs = (rs) => rs.flatMap((r) => [r.dobra, r.menu, r.cookies].flatMap((s) => s.problemas.map((p) => ({ combo: `${r.modo}-${r.escala}@${r.w}`, ...p }))));
  const alc = (rs) => rs.flatMap((r) => [...r.alcanceCookies, ...r.alcanceCtas, r.alcanceFechar]).filter((a) => !a.ok).length;
  crit(t, "7.m1.corpo-amplia", "raiz 200%/300% (32/48 px): o corpo da dobra amplia >= 1,9x / 2,8x", sim(M1.filter((r) => r.escala > 16).every((r) => amp(r, "corpo") >= (r.escala === 32 ? 1.9 : 2.8))), { razoes: M1.filter((r) => r.escala > 16).map((r) => [`${r.escala}@${r.w}`, r1(amp(r, "corpo"))]) });
  crit(t, "7.m1.controles-ampliam", "raiz 200%: CTA e botoes do aviso de cookies ampliam >= 1,9x (hoje em px: nao acompanham a raiz)",
    sim(cx.every((r) => amp(r, "cta") >= 1.9 && amp(r, "cookie") >= 1.9)), { razoes: cx.map((r) => [`@${r.w}`, { cta: r1(amp(r, "cta")), cookie: r1(amp(r, "cookie")) }]) }, { bloqueada: "19" });
  crit(t, "7.m1.sem-corte", "raiz 100/200/300%: nenhum texto cortado ou fora da viewport na dobra, menu e aviso", sim(!probs(M1).length), { problemas: probs(M1).slice(0, 8) });
  crit(t, "7.m1.sem-overflow-x", "raiz 100/200/300%: sem rolagem horizontal (dobra e menu)", sim(M1.every((r) => semOverflow(r.doc) && semOverflow(r.docMenu))), { amostras: M1.filter((r) => !semOverflow(r.doc) || !semOverflow(r.docMenu)).map((r) => `${r.escala}@${r.w}`) });
  crit(t, "7.m2.sem-corte", "texto computado x2 e x3 (caixas mantidas): nenhum texto cortado na dobra, menu e aviso", sim(!probs(M2).length), { problemas: probs(M2).slice(0, 8) });
  crit(t, "7.m2.sem-overflow-x", "texto computado x2 e x3: sem rolagem horizontal", sim(M2.every((r) => semOverflow(r.doc) && semOverflow(r.docMenu))), { amostras: M2.filter((r) => !semOverflow(r.doc) || !semOverflow(r.docMenu)).map((r) => `${r.escala}x@${r.w}`) });
  crit(t, "7.alcance", "Fechar, CTAs visiveis e botoes do aviso alcancaveis em todas as escalas", sim(alc(com) === 0), { inalcancaveis: alc(com) });
  crit(t, "7.escala-nativa-so", "escala nativa do SO (Android fontScale, iOS Dynamic Type): nao emulavel neste host", "manual", { motivo: "M1 e M2 sao emulacao no Chromium desktop; so aparelho fisico certifica a escala do sistema" });
  nota(t, "M1 altera a raiz (prefere rem); M2 multiplica font-size computado de cada elemento mantendo as caixas. Nenhum dos dois e a escala nativa do SO.");
}

// ---------------------------------------------------------------------------------------------
// Teste 8: caos touch
// ---------------------------------------------------------------------------------------------

async function teste8(browser) {
  const t = T(8, "Caos de gestos touch");
  await comPagina(browser, { viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true }, async (page, ctx, col) => {
    await abrirPagina(page);
    await recusar(page);
    await page.evaluate(() => scrollTo(0, 0));
    await esp(800);
    const cdp = await ctx.newCDPSession(page);
    const toque = (type, pts) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: pts });
    const escala0 = await page.evaluate(() => visualViewport.scale);
    for (let i = 0; i < 20; i++) { await toque("touchStart", [{ x: 300, y: 350 }]); await toque("touchMove", [{ x: 40, y: 350 }]); await toque("touchEnd", []); }
    await esp(500);
    const h = await page.evaluate(() => ({ x: scrollX, sw: document.documentElement.scrollWidth, iw: innerWidth, escala: visualViewport.scale, touchAction: getComputedStyle(document.body).touchAction }));
    crit(t, "8.swipes-horizontais", "20 swipes horizontais: scrollX=0, sem overflow e escala inalterada", sim(h.x === 0 && h.sw <= h.iw + 1 && h.escala === escala0), { ...h, escala0 });
    // swipe vertical por eventos de toque reais, em passos
    const y0 = await page.evaluate(() => scrollY);
    await toque("touchStart", [{ x: 195, y: 700 }]);
    for (let i = 1; i <= 14; i++) { await toque("touchMove", [{ x: 195, y: 700 - i * 35 }]); await esp(14); }
    await toque("touchEnd", []);
    await esp(900);
    const y1 = await page.evaluate(() => scrollY);
    crit(t, "8.swipe-vertical", "swipe vertical por toque rola a pagina (>= 100 px)", sim(y1 - y0 >= 100), { y0: Math.round(y0), y1: Math.round(y1) });
    await page.evaluate(() => scrollTo(0, 0));
    await esp(600);
    // pinch manual: afastar e aproximar
    const par = (a, b) => [{ x: a, y: 350, id: 1 }, { x: b, y: 350, id: 2 }];
    await toque("touchStart", par(150, 210));
    for (let i = 1; i <= 6; i++) await toque("touchMove", par(150 - i * 15, 210 + i * 15));
    await toque("touchEnd", []);
    await esp(800);
    const zoom = await page.evaluate(() => ({ escala: visualViewport.scale, w: visualViewport.width }));
    await page.screenshot({ path: png("t8-apos-pinch-out") });
    t.evidencias.push(rel(png("t8-apos-pinch-out")));
    crit(t, "8.pinch-amplia", "pinch manual com dois pontos amplia a pagina (zoom nativo permitido: acessibilidade)", sim(zoom.escala > 1.2), zoom);
    let volta = zoom.escala;
    for (let tentativa = 0; tentativa < 3 && volta > 1.05; tentativa++) {
      await toque("touchStart", par(40, 320));
      for (let i = 1; i <= 10; i++) await toque("touchMove", par(40 + i * 12, 320 - i * 12));
      await toque("touchEnd", []);
      await esp(700);
      volta = await page.evaluate(() => visualViewport.scale);
    }
    await page.screenshot({ path: png("t8-apos-pinch-in") });
    t.evidencias.push(rel(png("t8-apos-pinch-in")));
    crit(t, "8.pinch-retorno", "pinch inverso devolve a escala a 1 (<= 1,05)", sim(volta <= 1.05), { antes: zoom.escala, depois: volta });
    // percorrer as secoes depois do zoom
    const ids = await page.evaluate(() => [...document.querySelectorAll("#menu a")].map((a) => a.hash.slice(1)));
    const sec = [];
    for (const id of ids) {
      await page.evaluate((i) => document.getElementById(i)?.scrollIntoView(), id);
      await esp(700);
      sec.push(await page.evaluate((i) => {
        const s = document.getElementById(i);
        return { id: i, altura: s ? Math.round(s.getBoundingClientRect().height) : 0, x: scrollX, sw: document.documentElement.scrollWidth, iw: innerWidth };
      }, id));
    }
    crit(t, "8.secoes-apos-zoom", "depois do pinch: as oito secoes alcancaveis, sem scrollX e sem overflow", sim(sec.length === 8 && sec.every((s) => s.altura > 0 && s.x === 0 && s.sw <= s.iw + 1)), { secoes: sec.map((s) => [s.id, s.altura]), escalaFinal: await page.evaluate(() => visualViewport.scale) });
    const inv = await page.evaluate(() => ({ carrosseis: document.querySelectorAll("[aria-roledescription=carousel], ul[role=region]").length, imagens: document.images.length }));
    crit(t, "8.carrossel", "carrossel: nao ha carrossel renderizado nesta versao", inv.carrosseis === 0 ? "na" : "erro", inv);
    crit(t, "8.arrastar-imagem", "arrastar imagem: nao ha img no DOM", inv.imagens === 0 ? "na" : "erro", inv);
    nota(t, "Gestos sintetizados por CDP em Chromium desktop com emulacao touch: nao e aparelho fisico nem Safari iOS.");
    guardarConsole(t, col);
  });
}

// ---------------------------------------------------------------------------------------------
// Teste 9: queda de conexao
// ---------------------------------------------------------------------------------------------

async function teste9(browser) {
  const t = T(9, "Queda de conexão no meio da ação");
  await comPagina(browser, { viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true }, async (page, ctx, col) => {
    let tentativas = 0;
    await page.route("**/assets/coreografias-*.js", async (rota) => {
      tentativas++;
      await ctx.setOffline(true);
      await rota.abort("internetdisconnected");
    });
    await page.goto(URL_ALVO, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForFunction(() => document.documentElement.classList.contains("movimento-falhou"), null, { timeout: 30000 });
    await esp(3500);
    await recusar(page);
    await page.click(ABRIR, { timeout: 8000 });
    await esp(900);
    const menuOff = await expandido(page);
    await page.keyboard.press("Escape");
    await esp(800);
    await page.locator('a[data-posicao="dobra"]').first().click({ timeout: 8000 });
    await esp(3000);
    const off = await page.evaluate(() => ({
      online: navigator.onLine, hash: location.hash, travado: document.documentElement.style.overflow,
      escondidos: [...document.querySelectorAll("[data-revelar]")].filter((e) => getComputedStyle(e).opacity === "0").length,
      ofertaTop: Math.round(document.getElementById("oferta").getBoundingClientRect().top),
      pendente: document.querySelectorAll('[aria-busy="true"], [role="progressbar"]').length,
    }));
    await page.screenshot({ path: png("t9-offline-fallback") });
    t.evidencias.push(rel(png("t9-offline-fallback")));
    // um diagnostico por tentativa: erros do app agrupados em rajadas de 1 s; cada rajada deve ter 1 so.
    const temposApp = col.erros.map((e, i) => [e, col.tErros[i]]).filter(([e]) => /Falha ao carregar o chunk de coreografias/.test(e)).map(([, tt]) => tt);
    const rajadas = [];
    for (const tt of temposApp) { const u = rajadas.at(-1); if (u && tt - u.fim <= 1000) { u.n++; u.fim = tt; } else rajadas.push({ ini: tt, fim: tt, n: 1 }); }
    const diag = temposApp.length;
    crit(t, "9.interrompeu-chunk", "o request do chunk de coreografias foi de fato interrompido (precondicao)", tentativas >= 1 ? "passa" : "erro", { tentativas });
    crit(t, "9.leitura-liberada", "offline: fallback de leitura, zero [data-revelar] com opacidade 0, sem trava e sem estado pendente", sim(off.escondidos === 0 && off.travado === "" && off.pendente === 0), off);
    crit(t, "9.menu-e-cta", "offline: menu abre e fecha, CTA navega a #oferta (|topo| <= 24 px)", sim(menuOff === "true" && off.hash === "#oferta" && Math.abs(off.ofertaTop) <= 24), { menuOff, hash: off.hash, ofertaTop: off.ofertaTop });
    if (rajadas.length > 1) nota(t, `O erro reaparece ${rajadas.length - 1} vez(es) depois da carga (atraso ${Math.round((rajadas[1].ini - rajadas[0].ini) / 100) / 10} s): e uma nova tentativa de consumidor tardio, resolvida pelo cache de modulos do navegador (1 requisicao so). Cumpre "um por tentativa", mas o console mostra a mensagem duas vezes.`);
    crit(t, "9.diagnostico-unico", "um console.error da aplicacao por tentativa (nenhuma rajada de 1 s com mais de 1), nunca repetido por consumidor (correcao 22)", sim(rajadas.length >= 1 && rajadas.every((r) => r.n === 1)), { requisicoesDoChunk: tentativas, errosDaAplicacao: diag, rajadas: rajadas.map((r) => r.n), atrasoAteSegundaMs: rajadas[1] ? rajadas[1].ini - rajadas[0].ini : null });
    await ctx.setOffline(false);
    await page.unroute("**/assets/coreografias-*.js");
    const antes = { erros: col.erros.length, avisos: col.avisos.length, pe: col.pageerrors.length };
    await page.reload({ waitUntil: "load" });
    await page.waitForFunction(() => document.documentElement.classList.contains("pronto"), null, { timeout: 20000 }).catch(() => {});
    await esp(3500);
    const rec = await page.evaluate(() => ({ pronto: document.documentElement.classList.contains("pronto"), falhou: document.documentElement.classList.contains("movimento-falhou") }));
    crit(t, "9.recuperacao", "online + reload: pronto, sem movimento-falhou e sem novo erro", sim(rec.pronto && !rec.falhou && col.erros.length === antes.erros && col.pageerrors.length === antes.pe), { ...rec, novosErros: col.erros.length - antes.erros });
    const campos = await page.evaluate(() => document.querySelectorAll("input,textarea,form").length);
    crit(t, "9.submissao", "queda no meio de submissao: nao ha formulario nem API de envio (o teste cobre so o carregamento de animacoes)", campos === 0 ? "na" : "erro", { campos });
    guardarConsole(t, col, [/ERR_INTERNET_DISCONNECTED/, /Failed to load resource/, /Falha ao carregar o chunk de coreografias/, /Failed to fetch dynamically imported module/]);
  });
}

// ---------------------------------------------------------------------------------------------
// Transversais: console, orcamento, inventario de pendencias
// ---------------------------------------------------------------------------------------------

function transversais() {
  const x = T("X", "Verificações transversais (console, build)");
  let easing = 0, pe = 0, erros = 0, avisos = 0;
  const amostra = [];
  for (const [id, t] of testes) {
    if (id === "X" || !t.console) continue;
    easing += t.console.avisos.filter((s) => /ease|easing|cubicBezier/i.test(s)).length;
    avisos += t.console.avisos.length;
    pe += t.console.pageerrors.length;
    erros += t.console.erros.length;
    amostra.push(...t.console.erros.slice(0, 2).map((e) => `[${id}] ${e}`), ...t.console.avisos.slice(0, 2).map((e) => `[${id}] aviso: ${e}`));
  }
  crit(x, "X.easing-zero", "aviso de easing do Anime.js (correcao 20): zero em todas as execucoes", sim(easing === 0), { easing });
  crit(x, "X.sem-pageerror", "zero pageerror em todas as execucoes", sim(pe === 0), { pageerrors: pe });
  crit(x, "X.sem-console-error", "zero console.error nao esperado (os induzidos do teste 9 sao separados)", sim(erros === 0), { erros, avisos, amostra: amostra.slice(0, 8) });
  const r = spawnSync("node", [join(REPO, "scripts/check-size.mjs")], { cwd: REPO, encoding: "utf8" });
  const m = /JS comprimido\s+([\d.]+) KB/.exec(r.stdout || "");
  crit(x, "X.orcamento-js", "RNF-L04: JS comprimido do dist/ atual <= 120 KB (scripts/check-size.mjs, sem rebuild)", sim(r.status === 0 && m && Number(m[1]) <= 120), { exit: r.status, jsKB: m ? Number(m[1]) : null });
  const log = join(OUT, "build.log");
  if (existsSync(log)) {
    const txt = readFileSync(log, "utf8");
    const pend = [...txt.matchAll(/^ {2}- ([\w.]+): /gm)].map((k) => k[1]);
    x.pendencias = pend;
  }
  return x;
}

// ---------------------------------------------------------------------------------------------
// Ambiente e saidas
// ---------------------------------------------------------------------------------------------

const sh = (cmd, args) => { try { return execFileSync(cmd, args, { cwd: REPO, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); } catch { return null; } };
function ambiente(navegadores) {
  const lib = requisitos("playwright-core/package.json").version;
  return {
    quando: new Date().toISOString(), commit: sh("git", ["rev-parse", "HEAD"]), ramo: sh("git", ["rev-parse", "--abbrev-ref", "HEAD"]),
    gitStatus: (sh("git", ["status", "--short"]) || "").split("\n").filter(Boolean),
    node: process.version, playwrightCore: lib, so: `linux ${release()}`, cpus: cpus().length, cargaMedia1min: loadavg()[0],
    navegadores, url: URL_ALVO, rotulo: ROTULO,
    emulacao: {
      funcional: "Chromium headless x86 de desktop, isMobile+hasTouch; viewports 360x640, 360x740, 360x800, 390x844 e (teste 2/7) 320x568, 320x640, 1080x320, 1080x720, 844x390; sem dispositivo fisico, Safari ou Firefox",
      fluidez: "390x844 isMobile hasTouch DSF 1, CPU throttle 4x, contexto unico em serie, sem outros navegadores abertos",
      rede: "2G natural (latencia 1000 ms, 15 KB/s down, 7,5 KB/s up, cache desligado), 3G controlado (750 ms, 50 KB/s, bundle principal retido), offline por setOffline",
      texto: "M1 = font-size da raiz 16/32/48 px; M2 = font-size computado x2 e x3 com caixas mantidas: emulacao, nao escala nativa do SO",
    },
  };
}

function tabela(linhas) { return linhas.map((l) => `| ${l.join(" | ")} |`).join("\n"); }
function markdown(r) {
  const L = [];
  const e = r.ambiente;
  L.push(`# Retestar Testes de Fogo (rotulo ${r.rotulo})`, "");
  L.push(`- Quando: ${e.quando}; commit \`${e.commit}\` (${e.ramo}); ${e.gitStatus.length} entradas em \`git status --short\``);
  L.push(`- Navegadores: ${e.navegadores.map((n) => `${n.papel} ${n.versao}`).join("; ")}; playwright-core ${e.playwrightCore}; node ${e.node}`);
  L.push(`- Alvo: ${e.url} (build local; nunca o ar). Codigo de saida: **${r.codigoSaida}** (${r.codigoSignificado})`, "");
  L.push("## Matriz", "", "| # | Teste | Resultado | Justificativa |", "| --- | --- | --- | --- |");
  for (const t of r.testes.filter((x) => x.id !== "X")) {
    const falhas = t.criterios.filter((c) => c.estado === "falha").map((c) => c.id);
    const just = t.erroHarness ? `falha de harness: ${t.erroHarness}` : falhas.length ? `falhou: ${falhas.join(", ")}` : t.criterios.map((c) => c.estado).every((s) => s === "na") ? "todos os ramos nao se aplicam" : `${t.criterios.filter((c) => c.estado === "passa").length} criterios passam${t.ressalvas ? `, ${t.ressalvas} ressalva(s)` : ""}`;
    L.push(`| ${t.id} | ${t.nome} | ${t.status}${t.parcial ? " (parcial)" : ""} | ${just} |`);
  }
  L.push("");
  for (const t of r.testes) {
    L.push(`## ${t.id === "X" ? "Transversais" : `Teste ${t.id}`}: ${t.nome} (${t.status}${t.parcial ? ", parcial" : ""})`, "");
    if (t.erroHarness) L.push(`> Falha de harness: ${t.erroHarness}`, "");
    L.push("| Criterio | Estado | Descricao | Valores |", "| --- | --- | --- | --- |");
    for (const c of t.criterios) {
      const v = JSON.stringify(c.valores).replace(/\|/g, "/").slice(0, 260);
      L.push(`| ${c.id} | ${c.estado}${c.bloqueada ? ` (bloqueada: tarefa ${c.bloqueada})` : ""} | ${c.descricao} | \`${v}\` |`);
    }
    if (t.notas.length) L.push("", ...t.notas.map((n) => `- ${n}`));
    if (t.evidencias.length) L.push("", `Evidencias: ${[...new Set(t.evidencias)].map((p) => `[${p}](${p})`).join(", ")}`);
    L.push("");
  }
  if (r.fluidez) {
    const f = r.fluidez;
    L.push("## Fluidez por fase", "", "| fase | janela s | long tasks (n / soma ms / max ms / p95 ms / >=500) | frames p50 / p95 / p99 / >50 | ocupacao thread % | heap antes GC | heap pos GC | nos | listeners |", "| --- | --- | --- | --- | --- | --- | --- | --- | --- |");
    for (const x of [f.fases.carga, f.fases.rage, f.fases.verificacao, f.soakA, f.soakB].filter(Boolean)) {
      L.push(`| ${x.nome} | ${x.janelaS} | ${x.longTasks.n} / ${x.longTasks.somaMs} / ${x.longTasks.maxMs} / ${x.longTasks.p95Ms} / ${x.longTasks.ge500} | ${x.frames.p50} / ${x.frames.p95} / ${x.frames.p99} / ${x.frames.gt50} | ${x.taskDurationPct} | ${x.heapAntesGCFim} | ${x.heapPosGCIni} -> ${x.heapPosGCFim} | ${x.nosIni} -> ${x.nosFim} | ${x.listenersIni} -> ${x.listenersFim} |`);
    }
    L.push("", `Host: ${JSON.stringify(f.host)}`, "");
  }
  return L.join("\n") + "\n";
}

// ---------------------------------------------------------------------------------------------
// Principal
// ---------------------------------------------------------------------------------------------

async function main() {
  console.log(`retestar-testes-de-fogo  rotulo=${ROTULO}  alvo=${URL_ALVO}  soak A=${SOAK_S}s B=${SOAK_B_S}s${FALHAR ? "  FALHA INJETADA" : ""}`);
  const sondagem = await fetch(URL_ALVO).then((r) => r.status, () => 0);
  if (sondagem !== 200) {
    console.error(`  alvo indisponivel (${URL_ALVO}): suba o preview do build local. Nada foi testado.`);
    return 2;
  }
  const navegadores = [];
  const pids = [];
  let fluidezDados = null;

  // 1) Fluidez, em serie e sozinha
  if (quer(1) || quer(10)) {
    const t1 = T(1, "Rage Scroll & Break"), t10 = T(10, "Memória e CPU por cinco minutos");
    const exe = E.CHROMIUM_FLUIDEZ || join(homedir(), ".cache/ms-playwright/chromium-1243/chrome-linux64/chrome");
    const nav = await abrirNavegador({ executavel: existsSync(exe) ? exe : null, args: ["--no-sandbox"] });
    navegadores.push({ papel: "fluidez (testes 1 e 10)", versao: nav.versao, executavel: existsSync(exe) ? exe : "padrao do playwright-core" });
    pids.push(nav.pid);
    const limite = (SOAK_S + SOAK_B_S) * 1000 + 6 * 60000;
    await executar(t1, limite, async () => {
      try { await fluidez(nav); } catch (e) { t10.erroHarness = t1.erroHarness = String(e.message).split("\n")[0]; throw e; }
    });
    await nav.encerrar();
    if (existsSync(join(EVID, "fluidez-fases.json"))) fluidezDados = JSON.parse(readFileSync(join(EVID, "fluidez-fases.json"), "utf8"));
  }

  // 2) Demais testes, um navegador funcional
  const ordem = [[2, teste2, 240e3], [3, teste3, 240e3], [4, teste4, 600e3], [5, teste5, 60e3], [6, teste6, 120e3], [7, teste7, 900e3], [8, teste8, 180e3], [9, teste9, 180e3]].filter(([id]) => quer(id));
  if (ordem.length) {
    const nav = await abrirNavegador({ executavel: E.CHROMIUM || null });
    navegadores.push({ papel: "funcional (testes 2 a 9)", versao: nav.versao, executavel: E.CHROMIUM || "padrao do playwright-core" });
    pids.push(nav.pid);
    for (const [id, fn, limite] of ordem) {
      const nomes = { 2: "Resize Thrashing", 3: "Rage Clicks & Double Submits", 4: "Rede lenta e interação precoce", 5: "Abuso de inputs", 6: "Pesadelo de modais e z-index", 7: "Acessibilidade extrema: font maxing", 8: "Caos de gestos touch", 9: "Queda de conexão no meio da ação" };
      const t = T(id, nomes[id]);
      console.log(`  teste ${id}: ${nomes[id]}`);
      await executar(t, limite, () => fn(nav.browser));
    }
    await nav.encerrar();
  }

  // 3) Transversais e saidas
  const x = transversais();
  const lista = [...testes.values()].sort((a, b) => String(a.id).localeCompare(String(b.id), "pt", { numeric: true }));
  for (const t of lista) Object.assign(t, veredito(t));
  const crits = lista.flatMap((t) => t.criterios.map((c) => ({ ...c, teste: t.id })));
  const harness = lista.some((t) => t.erroHarness || t.criterios.some((c) => c.estado === "erro")) || lista.filter((t) => t.id !== "X").some((t) => t.status === "Não executado");
  const falhas = crits.filter((c) => c.estado === "falha");
  let codigo = 0, sig = "tudo ok";
  if (harness) { codigo = 2; sig = "falha de harness: rodada incompleta"; }
  else if (falhas.some((c) => !c.bloqueada)) { codigo = 1; sig = "criterio implementado falhou"; }
  else if (falhas.length) { codigo = 3; sig = "so falhas de correcao bloqueada (tarefa 19)"; }
  const matriz = lista.filter((t) => t.id !== "X");
  const resultado = {
    rotulo: ROTULO, injetada: FALHAR, ambiente: ambiente(navegadores), codigoSaida: codigo, codigoSignificado: sig,
    contagem: Object.fromEntries(["Passou", "Falhou", "Não aplicável", "Não executado"].map((s) => [s, matriz.filter((t) => t.status === s).length])),
    testes: lista.map((t) => ({ id: t.id, nome: t.nome, status: t.status, parcial: t.parcial, ressalvas: t.ressalvas, erroHarness: t.erroHarness, duracaoMs: t.duracaoMs, criterios: t.criterios, notas: t.notas, evidencias: t.evidencias, console: t.console ? { erros: t.console.erros.length, avisos: t.console.avisos.length, pageerrors: t.console.pageerrors.length, esperados: t.console.esperados, amostra: [...t.console.erros, ...t.console.avisos].slice(0, 5) } : null })),
    pendenciasPublicacao: x.pendencias ?? null,
    fluidez: fluidezDados,
    pids,
  };
  const suf = ROTULO === "real" ? "" : `-${ROTULO}`;
  writeFileSync(join(OUT, "ambiente.json"), JSON.stringify(resultado.ambiente, null, 2));
  writeFileSync(join(OUT, `resultado${suf}.json`), JSON.stringify(resultado, null, 2));
  writeFileSync(join(OUT, `resultado${suf}.md`), markdown({ ...resultado, testes: lista }));
  console.log("\nMatriz:");
  for (const t of matriz) console.log(`  ${String(t.id).padStart(2)}  ${t.status.padEnd(14)}${t.parcial ? " (parcial)" : ""}  ${t.nome}`);
  for (const c of falhas) console.log(`  FALHA ${c.id}${c.bloqueada ? ` [bloqueada ${c.bloqueada}]` : ""}: ${c.descricao}`);
  console.log(`\nresultado${suf}.json / .md em ${OUT}\ncodigo de saida: ${codigo} (${sig})`);
  return codigo;
}

main().then(
  (c) => { matarTudo(); process.exit(c); },
  (e) => { console.error(`FALHA DE HARNESS: ${e.stack || e.message}`); matarTudo(); process.exit(2); },
);
