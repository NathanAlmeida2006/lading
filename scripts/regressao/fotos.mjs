// Uso: node scripts/regressao/fotos.mjs <rotulo> [build=<rotulo>] [tamanhos] [modos]
// Faz: telas fixas com rolagem completa, em 4 larguras x 2 modos, e o estilo computado de cada elemento.
// Escreve em <raiz>/.regressao/f/<rotulo>/ e le <raiz>/.regressao/b/<build>/dist (gerado por construir.sh).
// Exige playwright-core do projeto (devDependencies, resolvido a partir da raiz do repositorio).
// Variaveis: CHROMIUM (executavel do Chromium; padrao ~/.cache/ms-playwright/chromium-1117/chrome-linux/chrome) e CABECALHOS=1 (aplica public/_headers, como a borda da Cloudflare).
// node fotos.mjs <rotulo> [build=<rotulo>] : telas fixas + estilo computado, 4 larguras x 2 modos. Rotulo = pasta de saida.
import fs from "node:fs"; import path from "node:path";
import { chromium, CHROME, servir, SAIDA, } from "./lib.mjs";
import { esperar } from "./lib.mjs";
const DIR = SAIDA;
const [rot, buildArg, tamsArg, modosArg] = process.argv.slice(2);
const build = buildArg ?? rot;
const TAMS = (tamsArg ?? "360x640,768x1024,1024x768,1440x900").split(",");
const MODOS = (modosArg ?? "normal,reduzido").split(",");
const FIM = 1893456000000;
const { s, url } = await servir(path.join(DIR, "b", build, "dist"));
const PROPS = "display position top right bottom left z-index float flex-direction flex-wrap flex-grow flex-shrink flex-basis align-items align-self align-content justify-content justify-self justify-items order row-gap column-gap grid-template-columns grid-template-rows grid-column-start grid-column-end grid-row-start grid-row-end grid-auto-flow width height min-width min-height max-width max-height aspect-ratio box-sizing margin-top margin-right margin-bottom margin-left padding-top padding-right padding-bottom padding-left border-top-width border-right-width border-bottom-width border-left-width border-top-style border-right-style border-bottom-style border-left-style border-top-color border-right-color border-bottom-color border-left-color border-top-left-radius outline-style outline-width outline-color outline-offset overflow-x overflow-y clip-path isolation mix-blend-mode opacity visibility color background-color background-image background-size background-repeat background-position-x background-position-y background-clip font-family font-size font-weight font-style font-variant-numeric line-height letter-spacing word-spacing text-transform text-align text-indent text-decoration-line text-decoration-style text-decoration-color text-decoration-thickness text-underline-offset text-overflow white-space word-break overflow-wrap vertical-align -webkit-text-stroke-width -webkit-text-stroke-color -webkit-text-fill-color list-style-type cursor pointer-events user-select touch-action transform-origin transition-property transition-duration transition-timing-function transition-delay animation-name animation-duration animation-timing-function animation-delay animation-iteration-count animation-direction animation-fill-mode fill stroke stroke-width object-fit box-shadow text-shadow filter will-change mask-image".split(" ");
const PSEUDO = "content display position top right bottom left width height z-index background-color background-image background-size opacity mix-blend-mode pointer-events color animation-name transition-property".split(" ");
function coletarNaPagina({ props, pseudo, raiz }) {
  const ig = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE"]);
  const base = raiz ? document.querySelector(raiz) : document.body;
  const els = [...base.querySelectorAll("*")].filter((e) => !ig.has(e.tagName) && !e.closest("svg *") );
  return els.map((el) => {
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); const e = {};
    for (const p of props) e[p] = cs.getPropertyValue(p);
    const tf = ["transform", "translate", "rotate", "scale"].map((p) => cs.getPropertyValue(p)).join(" | ");
    const ps = {};
    for (const q of ["::before", "::after"]) { const pc = getComputedStyle(el, q); const c = pc.getPropertyValue("content"); if (c && c !== "none" && c !== "normal") { const o = {}; for (const p of pseudo) o[p] = pc.getPropertyValue(p); ps[q] = o; } }
    const txt = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join("").replace(/\s+/g, " ").trim().slice(0, 60);
    return { tag: el.tagName.toLowerCase(), cls: typeof el.className === "string" ? el.className.split(/\s+/).slice(0, 3).join(".") : "", txt, x: +(r.left + scrollX).toFixed(2), y: +(r.top + scrollY).toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2), tf, e, ps };
  });
}
const coletar = async (p, raiz) => {
  const arg = { props: PROPS, pseudo: PSEUDO, raiz };
  const a = await p.evaluate(coletarNaPagina, arg); await p.waitForTimeout(350); const b = await p.evaluate(coletarNaPagina, arg);
  a.forEach((r, i) => { const q = b[i]; r.v = !q || r.x !== q.x || r.y !== q.y || r.w !== q.w || r.h !== q.h || r.tf !== q.tf || r.e.opacity !== q.e.opacity || r.txt !== q.txt; });
  const doc = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight }));
  return { doc, els: a };
};
const rolarTudo = async (p) => {
  const h = await p.evaluate(() => document.documentElement.scrollHeight); const passo = await p.evaluate(() => Math.round(innerHeight * 0.6));
  for (let y = 0; y <= h; y += passo) { await p.evaluate((v) => scrollTo({ top: v, behavior: "instant" }), y); await p.waitForTimeout(90); }
  await p.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" })); await p.waitForTimeout(4200);
  await p.evaluate(() => scrollTo({ top: 0, behavior: "instant" })); await p.waitForTimeout(1200);
};
for (const tam of TAMS) for (const modo of MODOS) {
  const nav = await chromium.launch({ executablePath: CHROME, headless: true });
  const [w, h] = tam.split("x").map(Number);
  const pasta = path.join(DIR, "f", rot, `${tam}-${modo}`); fs.rmSync(pasta, { recursive: true, force: true }); fs.mkdirSync(pasta, { recursive: true });
  const ctx = await nav.newContext({ viewport: { width: w, height: h }, reducedMotion: modo === "reduzido" ? "reduce" : "no-preference", deviceScaleFactor: 1, colorScheme: "dark" });
  await ctx.addInitScript((f) => { try { localStorage.setItem("promocao-fim", String(f)); } catch {} }, FIM);
  const p = await ctx.newPage(); const erros = [];
  p.on("pageerror", (e) => erros.push(String(e).slice(0, 200))); p.on("console", (m) => { if (m.type() === "error") erros.push(m.text().slice(0, 200)); });
  await p.goto(url, { waitUntil: "load" }); await p.evaluate(() => document.fonts.ready);
  if (!(await esperar(p, () => document.documentElement.classList.contains("movimento-pronto"), 20000))) erros.push("sem movimento-pronto");
  await p.evaluate((f) => { const v = f - 23 * 3600e3; Date.now = () => v; }, FIM);
  await p.waitForTimeout(modo === "normal" ? 4300 : 1500);
  const inicial = await coletar(p);
  const textoInicial = await p.evaluate(() => document.getElementById("raiz").textContent);
  await p.click("text=Aceitar").catch(() => {}); await p.mouse.move(0, 0); await p.waitForTimeout(500);
  await rolarTudo(p);
  const final = await coletar(p);
  const hrefs = await p.evaluate(() => [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")));
  await p.addStyleTag({ content: "canvas{visibility:hidden!important}*,*::before,*::after{animation:none!important;caret-color:transparent!important}" }); await p.waitForTimeout(300);
  const total = await p.evaluate(() => document.documentElement.scrollHeight); let n = 0;
  for (let y = 0; y < total; y += h) { await p.evaluate((v) => scrollTo({ top: v, behavior: "instant" }), y); await p.waitForTimeout(modo === "normal" ? 1100 : 320); await p.screenshot({ path: path.join(pasta, String(n++).padStart(3, "0") + ".png") }); }
  fs.writeFileSync(path.join(pasta, "estilo.json"), JSON.stringify({ inicial, final, erros, textoInicial, hrefs, total }));
  await ctx.close(); await nav.close();
  console.log(`${rot} ${tam} ${modo}: ${n} telas, doc ${total}, erros ${erros.length}`);
}
s.close();
