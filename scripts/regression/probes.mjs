// Uso: node scripts/regression/probes.mjs <build>
// Faz: duas sondas: (1) chunk de coreografias abortado, a leitura tem de abrir com um erro so; (2) movimento normal, sequencia de maskImage inline e estado das animacoes de .app-registro. Abre janela de navegador (headless: false).
// Le <raiz>/.regressao/b/<build>/dist (gerado por build.sh). Escreve em <raiz>/.regressao/sondas-<build>.json.
// Exige playwright-core do projeto e o Chromium em CHROMIUM (padrao ~/.cache/ms-playwright/chromium-1117/chrome-linux/chrome). Abre navegador: rode so pelo orquestrador.
// Variaveis: CHROMIUM (executavel do Chromium).
import fs from "node:fs"; import path from "node:path";
import { chromium, CHROME, servir, esperar, SAIDA } from "./lib.mjs";
const [build] = process.argv.slice(2);
const { s, url } = await servir(path.join(SAIDA, "b", build, "dist"));
const nav = await chromium.launch({ executablePath: CHROME, headless: false, args: ["--headless=new", "--enable-gpu", "--use-angle=gl", "--autoplay-policy=no-user-gesture-required", "--mute-audio"] });
const saida = {};

{ // (1) falha do chunk
  const ctx = await nav.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(() => { try { localStorage.setItem("promocao-fim", "1893456000000"); } catch {} });
  const p = await ctx.newPage(); const erros = []; p.on("pageerror", (e) => erros.push("pageerror: " + String(e).slice(0, 160))); p.on("console", (m) => { if (m.type() === "error") erros.push(m.text().slice(0, 160)); });
  await p.route(/choreographies-[^/]*\.js/, (r) => r.abort());
  await p.goto(url, { waitUntil: "load" });
  await esperar(p, () => document.documentElement.classList.contains("movimento-falhou"), 10000);
  await p.waitForTimeout(800);
  saida.chunk = await p.evaluate(() => {
    const h = document.documentElement.classList;
    const leitura = [...document.querySelectorAll("[data-revelar], [data-line], .linha__texto")];
    const presos = leitura.filter((el) => { const c = getComputedStyle(el); return c.opacity !== "1" || c.transform !== "none"; }).length;
    const apagadas = [...document.querySelectorAll(".palavra, .regua__passo")].filter((el) => !el.hasAttribute("data-acesa")).length;
    return { falhou: h.contains("movimento-falhou"), pronto: h.contains("movimento-pronto"), leitura: leitura.length, presos, apagadas };
  });
  saida.chunk.erros = erros.map((e) => e.replace(/choreographies-[\w-]+\.js/g, "choreographies-X.js").replace(/:\d+:\d+/g, ""));
  console.log(build, "chunk:", JSON.stringify(saida.chunk));
  await ctx.close();
}

{ // (2) sequencia da mascara no corte, em movimento normal
  const ctx = await nav.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await ctx.addInitScript(() => {
    try { localStorage.setItem("promocao-fim", "1893456000000"); } catch {}
    window.__mascara = [];
    new MutationObserver((lista) => {
      for (const m of lista) {
        const el = m.target; if (!(el instanceof HTMLElement) || !el.classList.contains("app-registro")) continue;
        const mi = el.style.maskImage || el.style.webkitMaskImage || "";
        window.__mascara.push({ t: performance.now(), mi: mi.replace(/url\("?[^)"]*"?\)/g, "url(X)"), ms: el.style.maskSize, anim: el.getAnimations().map((a) => a.playState).join(",") });
      }
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ["style"] });
  });
  const p = await ctx.newPage(); const erros = []; p.on("pageerror", (e) => erros.push(String(e).slice(0, 160))); p.on("console", (m) => { if (m.type() === "error") erros.push(m.text().slice(0, 160)); });
  await p.goto(url, { waitUntil: "load" }); await p.evaluate(() => document.fonts.ready);
  await esperar(p, () => document.documentElement.classList.contains("movimento-pronto"), 30000);
  await p.click("text=Aceitar").catch(() => {});
  await p.evaluate(() => document.querySelector("#video").scrollIntoView({ block: "start", behavior: "instant" })); await p.waitForTimeout(2500);
  await p.click('button[aria-label="Reproduzir vídeo"]'); const t0 = await p.evaluate(() => performance.now());
  await p.waitForTimeout(22000);
  const reg = await p.evaluate(() => window.__mascara);
  // sequencia sem tempo (valor de maskImage e estado das animacoes, colapsando repeticoes) e o intervalo da montagem ate a troca para so a logo
  const seq = []; for (const r of reg) { const k = `${r.mi} | ${r.anim}`; if (seq.at(-1) !== k) seq.push(k); }
  const montagem = reg.find((r) => r.mi.includes("linear-gradient")), troca = reg.find((r) => montagem && r.t > montagem.t && !r.mi.includes("linear-gradient") && r.mi);
  saida.mascara = { registros: reg.length, seq, montagem_ms: montagem ? Math.round(montagem.t - t0) : null, ate_troca_ms: montagem && troca ? Math.round(troca.t - montagem.t) : null, erros };
  console.log(build, "mascara:", reg.length, "registros;", seq.length, "estados;", "montagem", saida.mascara.montagem_ms, "ms apos o clique; troca", saida.mascara.ate_troca_ms, "ms depois; erros", erros.length);
  await ctx.close();
}
fs.writeFileSync(path.join(SAIDA, `sondas-${build}.json`), JSON.stringify(saida, null, 1));
await nav.close(); s.close();
