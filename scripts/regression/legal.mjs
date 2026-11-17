// Uso: node scripts/regression/legal.mjs <rotulo> [build]
// Faz: captura das paginas de privacidade e termos, em 3 larguras x 2 modos, com o campo escondido.
// Escreve em <raiz>/.regressao/l/<rotulo>/ e le <raiz>/.regressao/b/<build>/dist (gerado por build.sh).
// Exige playwright-core do projeto (devDependencies, resolvido a partir da raiz do repositorio).
// Variaveis: CHROMIUM (executavel do Chromium; padrao ~/.cache/ms-playwright/chromium-1117/chrome-linux/chrome) e CABECALHOS=1 (aplica public/_headers, como a borda da Cloudflare).
// node legal.mjs <rotulo> [build]: privacidade e termos, 3 larguras x 2 modos, pagina inteira com o campo escondido
import fs from "node:fs"; import path from "node:path"; import { chromium, CHROME, servir, SAIDA, } from "./lib.mjs";
const DIR = SAIDA; const [rot, buildArg] = process.argv.slice(2); const build = buildArg ?? rot;
const { s, url } = await servir(path.join(DIR, "b", build, "dist"));
const nav = await chromium.launch({ executablePath: CHROME, headless: true });
for (const pag of ["privacy", "terms"]) for (const tam of ["360x640", "768x1024", "1440x900"]) for (const modo of ["normal", "reduzido"]) {
  const [w, h] = tam.split("x").map(Number); const pasta = path.join(DIR, "l", rot, `${pag}-${tam}-${modo}`); fs.rmSync(pasta, { recursive: true, force: true }); fs.mkdirSync(pasta, { recursive: true });
  const ctx = await nav.newContext({ viewport: { width: w, height: h }, reducedMotion: modo === "reduzido" ? "reduce" : "no-preference", deviceScaleFactor: 1, colorScheme: "dark" });
  const p = await ctx.newPage(); const erros = []; p.on("pageerror", (e) => erros.push(String(e).slice(0, 200)));
  await p.goto(url + pag + ".html", { waitUntil: "load" }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(600);
  await p.addStyleTag({ content: "canvas{visibility:hidden!important}*,*::before,*::after{animation:none!important;caret-color:transparent!important}" }); await p.waitForTimeout(200);
  await p.screenshot({ path: path.join(pasta, "000.png"), fullPage: true });
  fs.writeFileSync(path.join(pasta, "estilo.json"), JSON.stringify({ erros }));
  await ctx.close();
}
await nav.close(); s.close(); console.log(rot, "legais ok");
