// Uso: node scripts/regression/csp.mjs <build>
// Faz: serve <raiz>/.regressao/b/<build>/dist aplicando public/_headers, percorre a página e conta violações de CSP e erros de cabeçalho.
// Escreve só no console. Exige playwright-core do projeto (devDependencies, resolvido a partir da raiz do repositório).
// Variáveis: CHROMIUM (executável do Chromium; padrão ~/.cache/ms-playwright/chromium-1117/chrome-linux/chrome).
// node csp.mjs <build> : serve dist APLICANDO public/_headers (como a borda), percorre a página e conta violações de CSP e cabeçalhos
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { extname, join } from "node:path";
import { chromium, CHROME, SAIDA } from "./lib.mjs";
const DIR = SAIDA;
const [build] = process.argv.slice(2);
const dist = path.join(DIR, "b", build, "dist");
const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".mp3": "audio/mpeg",
  ".glb": "model/gltf-binary",
  ".woff2": "font/woff2",
};
// parser mínimo do _headers (Cloudflare): linha sem recuo = padrão de URL (* = qualquer coisa); recuadas = "Nome: valor"; "! Nome" remove
const regras = [];
let atual = null;
for (const l of (fs.existsSync(join(dist, "_headers"))
  ? fs.readFileSync(join(dist, "_headers"), "utf8")
  : ""
).split("\n")) {
  if (!l.trim() || l.trim().startsWith("#")) continue;
  if (!/^\s/.test(l)) {
    atual = {
      re: new RegExp(
        "^" +
          l
            .trim()
            .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
            .replace(/\*/g, ".*") +
          "$",
      ),
      h: [],
    };
    regras.push(atual);
    continue;
  }
  const m = l.trim().match(/^([^:]+):\s*(.*)$/);
  if (m && atual) atual.h.push([m[1].trim(), m[2].trim()]);
}
const cabecalhos = (p) => {
  const o = {};
  for (const r of regras)
    if (r.re.test(p))
      for (const [k, v] of r.h)
        o[k.toLowerCase()] = o[k.toLowerCase()] ? o[k.toLowerCase()] + ", " + v : v;
  return o;
};
const s = await new Promise((ok) => {
  const sv = http
    .createServer((q, r) => {
      let p = decodeURIComponent(q.url.split("?")[0]);
      if (p.endsWith("/")) p += "index.html";
      const f = join(dist, p);
      if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) {
        r.writeHead(404);
        r.end();
        return;
      }
      r.writeHead(200, {
        "content-type": MIME[extname(f)] ?? "application/octet-stream",
        ...cabecalhos(p),
      });
      fs.createReadStream(f).pipe(r);
    })
    .listen(0, "127.0.0.1", () => ok(sv));
});
const url = `http://127.0.0.1:${s.address().port}/`;
console.log("cabecalhos de / :", JSON.stringify(cabecalhos("/index.html")));
const nav = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--autoplay-policy=no-user-gesture-required", "--mute-audio"],
});
let total = 0;
for (const modo of ["normal", "reduzido"])
  for (const pag of ["", "privacy.html", "terms.html"]) {
    const ctx = await nav.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: modo === "reduzido" ? "reduce" : "no-preference",
    });
    await ctx.addInitScript(() => {
      window.__v = [];
      document.addEventListener("securitypolicyviolation", (e) =>
        window.__v.push(`${e.violatedDirective} ${e.blockedURI} ${e.sourceFile}:${e.lineNumber}`),
      );
    });
    const p = await ctx.newPage();
    const cons = [];
    p.on("console", (m) => {
      if (/Content Security Policy|Refused to/i.test(m.text())) cons.push(m.text().slice(0, 240));
    });
    p.on("pageerror", (e) => cons.push("pageerror " + String(e).slice(0, 200)));
    await p.goto(url + pag, { waitUntil: "load" });
    await p.waitForTimeout(1500);
    if (!pag) {
      await p.click('text="Aceitar"').catch(() => {});
      const h = await p.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < h; y += 700) {
        await p.evaluate((v) => scrollTo(0, v), y);
        await p.waitForTimeout(120);
      }
      await p.evaluate(() => document.querySelector("#video")?.scrollIntoView());
      await p.waitForTimeout(1500);
      await p.click('button[aria-label="Reproduzir vídeo"]').catch(() => cons.push("sem play"));
      await p.waitForTimeout(modo === "normal" ? 14000 : 6000);
      await p.evaluate(() => scrollTo(0, 0));
      await p.waitForTimeout(800);
      await p.click('a[aria-label="Abrir menu"]').catch(() => {});
      await p.waitForTimeout(900);
      await p.keyboard.press("Escape");
      await p.waitForTimeout(400);
      await p.evaluate(() => document.querySelector("#objecoes")?.scrollIntoView());
      await p.waitForTimeout(800);
      await p.click("#objecoes button[aria-expanded]").catch(() => {});
      await p.waitForTimeout(900);
    } else {
      await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
      await p.waitForTimeout(1200);
    }
    const v = await p.evaluate(() => window.__v);
    total += v.length + cons.length;
    console.log(
      `${modo} /${pag}: violacoes=${v.length} console=${cons.length}` +
        (v.length || cons.length ? "\n  " + [...v, ...cons].slice(0, 8).join("\n  ") : ""),
    );
    await ctx.close();
  }
await nav.close();
s.close();
console.log("TOTAL", total);
