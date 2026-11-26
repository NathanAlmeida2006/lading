// Uso: node scripts/regression/frames.mjs <rotulo> [build=<rotulo>] [tams=390x844,1440x900]
// Faz: o vídeo em movimento reduzido, com o relógio 4x mais lento: cada estágio fica estático e comparável (uma captura por batida, mais estilo da trilha e do registro).
// Lê <raiz>/.regressao/b/<build>/dist (gerado por build.sh). Escreve em <raiz>/.regressao/q/<rotulo>/<tam>/ (compare com node scripts/regression/compare.mjs A B q).
// Exige playwright-core do projeto e o Chromium em CHROMIUM (padrão ~/.cache/ms-playwright/chromium-1117/chrome-linux/chrome). Abre navegador: rode só pelo orquestrador.
// Variáveis: CHROMIUM (executável do Chromium).
import fs from "node:fs";
import path from "node:path";
import { chromium, CHROME, servir, esperar, SAIDA } from "./lib.mjs";
import { coletar } from "./collect.mjs";
const [rot, buildArg, tamsArg] = process.argv.slice(2);
const build = buildArg ?? rot;
const TAMS = (tamsArg ?? "390x844,1440x900").split(",");
const ESCALA = 4;
const BATIDA = 504.2;
const DROP = 3230;
const FIM = 1893456000000;
const AM = [
  -4, 0, 2, 3, 4, 5, 5.5, 6, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20.5, 22, 23, 24, 25, 26,
  28, 30, 32, 34, 37, 40, 44, 46, 47, 48, 49, 50, 51, 52, 56, 68,
];
const { s, url } = await servir(path.join(SAIDA, "b", build, "dist"));
const nav = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--autoplay-policy=no-user-gesture-required", "--mute-audio"],
});
for (const tam of TAMS) {
  const [w, h] = tam.split("x").map(Number);
  const pasta = path.join(SAIDA, "q", rot, tam);
  fs.rmSync(pasta, { recursive: true, force: true });
  fs.mkdirSync(pasta, { recursive: true });
  const ctx = await nav.newContext({
    viewport: { width: w, height: h },
    reducedMotion: "reduce",
    deviceScaleFactor: 1,
    colorScheme: "dark",
  });
  await ctx.addInitScript(
    ({ f, e }) => {
      try {
        localStorage.setItem("promocao-fim", String(f));
      } catch {}
      const st = setTimeout.bind(window);
      const pn = performance.now.bind(performance);
      window.setTimeout = (fn, d, ...a) => st(fn, (d || 0) * e, ...a);
      performance.now = () => pn() / e;
    },
    { f: FIM, e: ESCALA },
  );
  const p = await ctx.newPage();
  const erros = [];
  p.on("pageerror", (e) => erros.push(String(e).slice(0, 200)));
  p.on("console", (m) => {
    if (m.type() === "error") erros.push(m.text().slice(0, 200));
  });
  await p.goto(url, { waitUntil: "load" });
  await p.evaluate(() => document.fonts.ready);
  if (
    !(await esperar(
      p,
      () => document.documentElement.classList.contains("movimento-pronto"),
      30000,
    ))
  )
    erros.push("sem movimento-pronto");
  await p.evaluate((f) => {
    const v = f - 23 * 3600e3;
    Date.now = () => v;
  }, FIM);
  await p.click('text="Aceitar"').catch(() => {});
  await p.mouse.move(0, 0);
  await p.addStyleTag({
    content:
      'canvas.campo,canvas[class*="pixelated"]{visibility:hidden!important}*,*::before,*::after{caret-color:transparent!important}',
  });
  await p.evaluate(() =>
    document.querySelector("#video").scrollIntoView({ block: "start", behavior: "instant" }),
  );
  await p.waitForTimeout(3000);
  await p.mouse.move(0, 0);
  await p.click('button[aria-label="Reproduzir vídeo"]');
  const t0 = Date.now();
  await p.mouse.move(0, 0);
  const estilo = {};
  for (const b of AM) {
    const alvo = t0 + ESCALA * (DROP + (b + 0.5) * BATIDA) - 200;
    const falta = alvo - Date.now();
    if (falta > 0) await p.waitForTimeout(falta);
    const n = String(b).replace(".", "_").padStart(4, "0");
    await p.screenshot({ path: path.join(pasta, `b${n}.png`) });
    if (b === 16) estilo.trilha = await coletar(p, ".app-track").catch(() => null);
    if (b === 20.5) estilo.registro = await coletar(p, ".app-record").catch(() => null);
  }
  fs.writeFileSync(path.join(pasta, "estilo.json"), JSON.stringify({ erros, ...estilo }));
  await ctx.close();
  console.log(`${rot} ${tam}: ${AM.length} quadros, erros ${erros.length} ${erros[0] ?? ""}`);
}
await nav.close();
s.close();
