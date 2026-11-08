// Biblioteca do harness de regressao visual. Nao executar sozinha: os outros scripts de scripts/regressao/ a importam.
// Escreve em <raiz>/.regressao/ (a pasta e criada aqui). Exige playwright-core do projeto (devDependencies, resolvido a partir da raiz do repositorio).
// Variaveis: CHROMIUM (executavel do Chromium; padrao ~/.cache/ms-playwright/chromium-1117/chrome-linux/chrome) e CABECALHOS=1 (aplica public/_headers, como a borda da Cloudflare).
import { createRequire } from "node:module";
import http from "node:http";
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
const require = createRequire(import.meta.dirname + "/../../package.json");
export const { chromium } = require("playwright-core");
export const CHROME = process.env.CHROMIUM ?? (process.env.HOME + "/.cache/ms-playwright/chromium-1117/chrome-linux/chrome");
export const SAIDA = join(import.meta.dirname, "../../.regressao");
mkdirSync(SAIDA, { recursive: true });
const MIME = { ".html":"text/html", ".js":"text/javascript", ".css":"text/css", ".svg":"image/svg+xml", ".webp":"image/webp", ".mp3":"audio/mpeg", ".glb":"model/gltf-binary", ".woff2":"font/woff2" };
// CABECALHOS=1: aplica public/_headers (copiado para dist/) como a borda da Cloudflare: padrao com * e "Nome: valor" recuado.
function regrasDe(dist) {
  const f = join(dist, "_headers"); const regras = []; let atual = null;
  if (process.env.CABECALHOS !== "1" || !existsSync(f)) return regras;
  for (const l of readFileSync(f, "utf8").split("\n")) {
    if (!l.trim() || l.trim().startsWith("#")) continue;
    if (!/^\s/.test(l)) { atual = { re: new RegExp("^" + l.trim().replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$"), h: [] }; regras.push(atual); continue; }
    const m = l.trim().match(/^([^:]+):\s*(.*)$/); if (m && atual) atual.h.push([m[1].trim().toLowerCase(), m[2].trim()]);
  }
  return regras;
}
export function servir(dist) {
  const regras = regrasDe(dist);
  const cab = (p) => { const o = {}; for (const r of regras) if (r.re.test(p)) for (const [k, v] of r.h) o[k] = o[k] ? o[k] + ", " + v : v; delete o["cache-control"]; return o; };
  return new Promise((ok) => {
    const s = http.createServer((q, r) => {
      let p = decodeURIComponent(q.url.split("?")[0]); if (p.endsWith("/")) p += "index.html";
      const f = join(dist, p);
      if (!existsSync(f) || statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
      r.writeHead(200, { "content-type": MIME[extname(f)] ?? "application/octet-stream", "cache-control": "no-store", ...cab(p) });
      createReadStream(f).pipe(r);
    }).listen(0, "127.0.0.1", () => ok({ s, url: `http://127.0.0.1:${s.address().port}/` }));
  });
}
export const PERFIS = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  celular: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true },
};
export const abrir = (args = []) => chromium.launch({ executablePath: CHROME, headless: false, args: ["--headless=new", "--enable-gpu", "--use-angle=gl", "--autoplay-policy=no-user-gesture-required", "--mute-audio", ...args] });

// Espera por evaluate em laco: o waitForFunction do Playwright compila o predicado com eval na pagina, e a CSP o barra.
export async function esperar(p, fn, ms) { const fim = Date.now() + ms; while (Date.now() < fim) { if (await p.evaluate(fn).catch(() => false)) return true; await p.waitForTimeout(100); } return false; }
