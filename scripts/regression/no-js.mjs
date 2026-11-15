// Uso: node scripts/regression/no-js.mjs <rotulo> [build]
// Faz: captura da pagina com JavaScript desligado, com as imagens carregadas antes da captura, em 4 larguras x 2 modos.
// Escreve em <raiz>/.regressao/n/<rotulo>/ e le <raiz>/.regressao/b/<build>/dist (gerado por build.sh).
// Exige playwright-core do projeto (devDependencies, resolvido a partir da raiz do repositorio).
// Variaveis: CHROMIUM (executavel do Chromium; padrao ~/.cache/ms-playwright/chromium-1117/chrome-linux/chrome) e CABECALHOS=1 (aplica public/_headers, como a borda da Cloudflare).
// node no-js.mjs <rotulo> [build]: pagina sem JS, com as imagens carregadas antes da captura.
import fs from "node:fs"; import path from "node:path"; import { chromium, CHROME, servir, SAIDA, } from "./lib.mjs";
const DIR = SAIDA; const [rot, buildArg] = process.argv.slice(2); const build = buildArg ?? rot; const { s, url } = await servir(path.join(DIR, "b", build, "dist"));
for (const tam of ["360x640", "768x1024", "1024x768", "1440x900"]) for (const modo of ["normal", "reduzido"]) {
  const [w, h] = tam.split("x").map(Number); const pasta = path.join(DIR, "n", rot, `${tam}-${modo}`); fs.rmSync(pasta, { recursive: true, force: true }); fs.mkdirSync(pasta, { recursive: true });
  const nav = await chromium.launch({ executablePath: CHROME, headless: true }); const ctx = await nav.newContext({ viewport: { width: w, height: h }, reducedMotion: modo === "reduzido" ? "reduce" : "no-preference", deviceScaleFactor: 1, colorScheme: "dark", javaScriptEnabled: false }); const p = await ctx.newPage();
  await p.route(url, async (r) => { const resp = await r.fetch(); const corpo = (await resp.text()).replace("</head>", "<style>*,*::before,*::after{animation:none!important;transition:none!important}</style></head>").replaceAll('loading="lazy"', 'loading="eager"').replaceAll('decoding="async"', 'decoding="sync"'); await r.fulfill({ response: resp, body: corpo }); });
  await p.goto(url, { waitUntil: "networkidle" }); await p.waitForTimeout(1500); await p.screenshot({ path: path.join(pasta, "sem-js.png"), fullPage: true }); await nav.close(); console.log(rot, tam, modo);
}
s.close();
