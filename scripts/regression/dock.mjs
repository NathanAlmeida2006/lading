// Uso: node scripts/regression/dock.mjs <build>
// Faz: janela da doca (data-ativa) a cada 120 px de rolagem, em 390x844 e 1440x900, normal e reduzido.
// Le <raiz>/.regressao/b/<build>/dist (gerado por build.sh). Escreve em <raiz>/.regressao/doca-<build>.json.
// Exige playwright-core do projeto e o Chromium em CHROMIUM (padrao ~/.cache/ms-playwright/chromium-1117/chrome-linux/chrome). Abre navegador: rode so pelo orquestrador.
// Variaveis: CHROMIUM (executavel do Chromium).
import fs from "node:fs"; import path from "node:path";
import { chromium, CHROME, servir, esperar, SAIDA } from "./lib.mjs";
const [build] = process.argv.slice(2);
const { s, url } = await servir(path.join(SAIDA, "b", build, "dist"));
const nav = await chromium.launch({ executablePath: CHROME, headless: true });
const saida = {};
for (const [w, h] of [[390, 844], [1440, 900]]) for (const modo of ["normal", "reduzido"]) {
  const ctx = await nav.newContext({ viewport: { width: w, height: h }, reducedMotion: modo === "reduzido" ? "reduce" : "no-preference" });
  await ctx.addInitScript(() => { try { localStorage.setItem("promocao-fim", "1893456000000"); } catch {} });
  const p = await ctx.newPage(); const erros = []; p.on("pageerror", (e) => erros.push(String(e).slice(0, 160)));
  await p.goto(url, { waitUntil: "load" });
  await esperar(p, () => document.documentElement.classList.contains("movimento-pronto") || document.documentElement.classList.contains("movimento-falhou"), 20000);
  await p.waitForTimeout(modo === "normal" ? 3600 : 600);
  await p.click("text=Aceitar").catch(() => {}); await p.waitForTimeout(300);
  const total = await p.evaluate(() => document.documentElement.scrollHeight);
  const seq = [];
  for (let y = 0; y <= total; y += 120) { await p.evaluate((v) => scrollTo({ top: v, behavior: "instant" }), y); await p.waitForTimeout(140); seq.push(await p.evaluate(() => (document.querySelector(".doca")?.hasAttribute("data-ativa") ? 1 : 0))); }
  const chave = `${w}x${h}-${modo}`; saida[chave] = { total, seq: seq.join(""), erros };
  const trocas = seq.reduce((n, v, i) => n + (i && v !== seq[i - 1] ? 1 : 0), 0);
  console.log(`${build} ${chave}: ${seq.length} posicoes, ${seq.filter(Boolean).length} com doca, ${trocas} trocas, erros ${erros.length}`);
  await ctx.close();
}
fs.writeFileSync(path.join(SAIDA, `doca-${build}.json`), JSON.stringify(saida));
await nav.close(); s.close();
