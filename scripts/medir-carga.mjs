/**
 * Regua de carga reprodutivel da landing (cartao 29).
 *
 * Laboratorio nao prova campo nem conversao. Esta regua compara a pagina com ela mesma, no mesmo
 * build e na mesma maquina; nao diz o que o visitante real sente.
 *
 *   npm run medir                                  tres perfis, 7 rodadas, sobre o dist/ atual
 *   npm run medir -- --perfis 4g-lento --rodadas 3
 *   npm run medir -- --seco                        so valida configuracao e imprime o plano
 *
 * Opcoes: --perfis a,b  --rodadas N (7)  --saida DIR  --sem-build (padrao, nao constroi)  --seco
 *         --variantes com-cortina,sem-cortina,movimento-reduzido (padrao: com-cortina)
 * Saida: relatorio-AAAA-MM-DD-HHMM.json e resumo-AAAA-MM-DD-HHMM.txt na pasta da rodada.
 * Codigo: 0 ok (avisos permitidos), 1 reprovacao vigente, 2 falha de harness, marco nulo ou erro da pagina.
 *
 * Precisa de playwright-core e de um Chromium (CHROMIUM=/caminho/para/chrome, como em verificar.mjs).
 * Evolui do harness de 13/10/2026 (output/playwright/desempenho-carga-2026-10-13/), que e so leitura.
 */
import http from "node:http";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, join, normalize, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { brotliCompressSync, constants as Z } from "node:zlib";

const ARQUIVO = fileURLToPath(import.meta.url);
const RAIZ = resolve(dirname(ARQUIVO), "..");
const DIST = join(RAIZ, "dist");
const CAMINHO_LIMITES = join(RAIZ, "scripts", "medir-carga.limites.json");

// ---------------------------------------------------------------------------------------------
// Configuracao
// ---------------------------------------------------------------------------------------------

/**
 * Perfis de rede. `rtt` e o RTT nominal, usado so para o atraso estimado de DNS/TCP/TLS.
 * 4g-lento e o "Slow 4G" do Lighthouse no metodo devtools: o CDP recebe a latencia JA multiplicada.
 * O fator do Lighthouse e 3,75 (150 ms -> 562,5 ms), nao 3: foi o que o harness de 13/10 usou e
 * o que reproduz a linha de base. A vazao tambem ja leva o fator 0,9 (1,6 Mbps -> 1474,56 Kbit/s).
 */
const PERFIS = {
  "4g-bom": {
    descricao: "9 Mbps, 170 ms (perfil da meta)",
    rtt: 170,
    cdp: { latency: 170, downloadKbit: 9000, uploadKbit: 9000 },
  },
  "4g-lento": {
    descricao: "Slow 4G do Lighthouse, metodo devtools: 1,6 Mbps down, 750 Kbps up, 150 ms de RTT",
    rtt: 150,
    cdp: { latency: 150 * 3.75, downloadKbit: 1.6 * 1024 * 0.9, uploadKbit: 750 * 0.9 },
    multiplicadorLatencia: 3.75,
  },
  "sem-limite": { descricao: "diagnostico: sem limite de rede", rtt: 0, cdp: null },
};
const VARIANTES = ["com-cortina", "sem-cortina", "movimento-reduzido"];
const MARCOS = ["fcp", "lcp", "headlineLegivel", "ctaVisivel", "rolagemLivre", "hidratado"];
const METRICAS = ["fcp", "lcp", "headlineLegivel", "ctaVisivel", "rolagemLivre", "cls", "tbt", "hidratado"];
const EXTRAS = ["ttfb", "load", "maiorTarefa"];
const CPU = 4;
const VIEWPORT = { width: 360, height: 740 };
const SELETOR_CTA = "#inicio a[data-posicao]";
const TIMEOUT_NAVEGACAO_MS = 60_000;
const TIMEOUT_MARCOS_MS = 45_000;
const QUIETO_MS = 1000; // sem tarefa longa, LCP, CLS ou marco novo por este tempo
const UA =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36";
const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};
const COMPRIMIVEIS = new Set([".html", ".js", ".mjs", ".css", ".svg", ".json", ".txt"]);
const CACHE_PADRAO = "public, max-age=0, must-revalidate"; // padrao dos assets de Worker da Cloudflare

class Falha extends Error {}

// ---------------------------------------------------------------------------------------------
// Argumentos e limites
// ---------------------------------------------------------------------------------------------

function lerArgs(argv) {
  const a = { perfis: null, rodadas: 7, saida: null, seco: false, variantes: ["com-cortina"] };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    const valor = () => {
      if (i + 1 >= argv.length) throw new Falha(`${k} pede um valor`);
      return argv[++i];
    };
    if (k === "--perfis") a.perfis = valor().split(",").map((s) => s.trim()).filter(Boolean);
    else if (k === "--rodadas") a.rodadas = Number(valor());
    else if (k === "--saida") a.saida = valor();
    else if (k === "--variantes") a.variantes = valor().split(",").map((s) => s.trim()).filter(Boolean);
    else if (k === "--sem-build") continue; // ja e o padrao: a regua nunca constroi
    else if (k === "--seco") a.seco = true;
    else throw new Falha(`opcao desconhecida: ${k}`);
  }
  if (!Number.isInteger(a.rodadas) || a.rodadas < 1) throw new Falha("--rodadas pede inteiro >= 1");
  for (const p of a.perfis ?? []) if (!(p in PERFIS)) throw new Falha(`perfil desconhecido: ${p} (use ${Object.keys(PERFIS).join(", ")})`);
  if (a.perfis?.length === 0) throw new Falha("--perfis vazio");
  for (const v of a.variantes) if (!VARIANTES.includes(v)) throw new Falha(`variante desconhecida: ${v} (use ${VARIANTES.join(", ")})`);
  if (a.variantes.length === 0) throw new Falha("--variantes vazio");
  return a;
}

function validarLimites(l) {
  const erro = (m) => {
    throw new Falha(`medir-carga.limites.json: ${m}`);
  };
  const num = (x) => typeof x === "number" && Number.isFinite(x);
  if (!num(l.toleranciaP75) || l.toleranciaP75 < 0) erro("toleranciaP75 deve ser numero >= 0");
  if (typeof l.perfis !== "object" || l.perfis === null) erro("perfis ausente");
  for (const [perfil, metricas] of Object.entries(l.perfis)) {
    if (!(perfil in PERFIS)) erro(`perfil desconhecido: ${perfil}`);
    for (const [nome, c] of Object.entries(metricas)) {
      if (!METRICAS.includes(nome)) erro(`${perfil}: metrica desconhecida: ${nome}`);
      if (!["aviso", "vigente"].includes(c.modo)) erro(`${perfil}.${nome}: modo deve ser "aviso" ou "vigente"`);
      if (nome === "tbt") {
        if (!num(c.linhaBase) || !num(c.subidaMaxima)) erro(`${perfil}.tbt: linhaBase e subidaMaxima numericos`);
      } else if (c.regra !== undefined) {
        if (c.regra !== "<= fcp" || nome !== "rolagemLivre") erro(`${perfil}.${nome}: regra aceita e so "<= fcp" em rolagemLivre`);
      } else if (!num(c.teto)) erro(`${perfil}.${nome}: teto numerico ou regra`);
    }
  }
  return l;
}

// ---------------------------------------------------------------------------------------------
// Servidor estatico: Brotli, _headers, ETag forte, 304, atraso de 3 RTT no documento
// ---------------------------------------------------------------------------------------------

function lerHeaders(texto) {
  const regras = [];
  let atual = null;
  for (const bruta of texto.split(/\r?\n/)) {
    const l = bruta.trimEnd();
    if (!l.trim() || l.trim().startsWith("#")) continue;
    if (!/^\s/.test(l)) {
      atual = { padrao: l.trim(), cab: {} };
      regras.push(atual);
      continue;
    }
    const i = l.indexOf(":");
    if (i < 0 || !atual) continue;
    atual.cab[l.slice(0, i).trim().toLowerCase()] = l.slice(i + 1).trim();
  }
  return regras;
}
const casa = (padrao, rota) => (padrao.endsWith("*") ? rota.startsWith(padrao.slice(0, -1)) : padrao === rota);

async function listar(pasta) {
  const saida = [];
  for (const d of await readdir(pasta, { withFileTypes: true })) {
    const c = join(pasta, d.name);
    if (d.isDirectory()) saida.push(...(await listar(c)));
    else saida.push(c);
  }
  return saida;
}

async function iniciarServidor() {
  const cabecalhos = join(DIST, "_headers");
  const regras = existsSync(cabecalhos) ? lerHeaders(await readFile(cabecalhos, "utf8")) : [];
  // Cache em memoria por arquivo, aquecido antes da primeira rodada: o Brotli nao disputa CPU com o Chromium.
  const cache = new Map();
  for (const arq of await listar(DIST)) {
    const raw = await readFile(arq);
    const ext = extname(arq);
    cache.set(arq, {
      raw,
      tipo: TIPOS[ext] ?? "application/octet-stream",
      comprime: COMPRIMIVEIS.has(ext),
      br: COMPRIMIVEIS.has(ext)
        ? brotliCompressSync(raw, { params: { [Z.BROTLI_PARAM_QUALITY]: 11, [Z.BROTLI_PARAM_SIZE_HINT]: raw.length } })
        : null,
      hash: createHash("sha1").update(raw).digest("hex").slice(0, 20),
    });
  }
  const estado = { atrasoDocumentoMs: 0, contagem: {} };
  const dormir = (ms) => new Promise((ok) => setTimeout(ok, ms));

  const servidor = http.createServer(async (req, res) => {
    const conta = (s) => (estado.contagem[s] = (estado.contagem[s] ?? 0) + 1);
    try {
      const rota = decodeURIComponent(new URL(req.url, "http://x").pathname);
      const arq = normalize(join(DIST, rota.endsWith("/") ? `${rota}index.html` : rota));
      const item = arq.startsWith(DIST + sep) ? cache.get(arq) : null;
      if (!item) {
        conta(404);
        res.writeHead(404).end();
        return;
      }
      if (extname(arq) === ".html" && estado.atrasoDocumentoMs > 0) await dormir(estado.atrasoDocumentoMs);
      const br = item.comprime && /\bbr\b/.test(req.headers["accept-encoding"] ?? "");
      const etag = `"${item.hash}${br ? "-br" : ""}"`;
      const cab = { "content-type": item.tipo, "cache-control": CACHE_PADRAO, etag };
      if (item.comprime) cab.vary = "Accept-Encoding";
      if (br) cab["content-encoding"] = "br";
      for (const r of regras) if (casa(r.padrao, rota)) Object.assign(cab, r.cab);
      const inm = (req.headers["if-none-match"] ?? "").split(",").map((s) => s.trim().replace(/^W\//, ""));
      if (inm.includes(etag) || inm.includes("*")) {
        conta(304);
        res.writeHead(304, cab).end();
        return;
      }
      const corpo = br ? item.br : item.raw;
      cab["content-length"] = corpo.length;
      conta(200);
      res.writeHead(200, cab).end(corpo);
    } catch {
      conta(500);
      res.writeHead(500).end();
    }
  });
  await new Promise((ok) => servidor.listen(0, "127.0.0.1", ok));
  return {
    alvo: `http://127.0.0.1:${servidor.address().port}/`,
    estado,
    regras: regras.length,
    arquivos: cache.size,
    fechar: () => new Promise((ok) => servidor.close(ok)),
  };
}

// ---------------------------------------------------------------------------------------------
// Microbenchmark de CPU
// ---------------------------------------------------------------------------------------------

function microbenchmark() {
  const trabalho = (n) => {
    let h = 2166136261 | 0;
    for (let i = 0; i < n; i++) h = Math.imul(h ^ (i & 255), 16777619);
    return h;
  };
  let dt = 0;
  for (let i = 0; i < 3; i++) {
    const t = performance.now();
    trabalho(2_000_000);
    dt = performance.now() - t;
  }
  const n = Math.round((2_000_000 * 200) / Math.max(dt, 0.1)); // ~200 ms de trabalho, fixo nas 5 repeticoes
  const ms = [];
  for (let i = 0; i < 5; i++) {
    const t = performance.now();
    trabalho(n);
    ms.push(performance.now() - t);
  }
  const media = ms.reduce((a, b) => a + b, 0) / ms.length;
  const dp = Math.sqrt(ms.reduce((a, b) => a + (b - media) ** 2, 0) / ms.length);
  const cv = dp / media;
  return {
    iteracoes: n,
    repeticoesMs: ms.map((x) => +x.toFixed(1)),
    mediaMs: +media.toFixed(1),
    coeficienteVariacao: +cv.toFixed(4),
    maquinaRuidosa: cv > 0.15, // so aviso: nao muda o codigo de saida
  };
}

// ---------------------------------------------------------------------------------------------
// Sonda dentro da pagina (addInitScript). Nada aqui depende de classes de markup, exceto o que
// esta dito no comentario do marco.
// ---------------------------------------------------------------------------------------------

function sonda(seletorCta) {
  const m = (window.__m = { marcos: {}, fcp: null, lcp: null, longas: [], cls: 0, ultimo: 0, headline: null });
  const toque = () => {
    m.ultimo = performance.now();
  };
  const marcar = (k) => {
    if (k in m.marcos) return;
    m.marcos[k] = Math.round(performance.now());
    toque();
  };
  const observar = (type, f) =>
    new PerformanceObserver((l) => {
      l.getEntries().forEach(f);
      toque();
    }).observe({ type, buffered: true });
  observar("paint", (e) => {
    if (e.name === "first-contentful-paint") m.fcp = Math.round(e.startTime);
  });
  observar("largest-contentful-paint", (e) => {
    m.lcp = {
      t: Math.round(e.startTime),
      area: e.size,
      el: e.element ? `${e.element.tagName.toLowerCase()}.${String(e.element.className).split(" ")[0]}` : null,
      texto: e.element?.textContent?.trim().slice(0, 32) ?? null,
    };
  });
  observar("longtask", (e) => m.longas.push([Math.round(e.startTime), Math.round(e.duration)]));
  observar("layout-shift", (e) => {
    if (!e.hadRecentInput) m.cls += e.value;
  });

  const cadeia = (el) => {
    const r = [];
    for (let n = el; n; n = n.parentElement) {
      r.push(n);
      if (n === document.body) break;
    }
    return r;
  };
  const opaco = (el) => cadeia(el).every((n) => parseFloat(getComputedStyle(n).opacity) >= 0.99);
  const identidade = (el) => {
    const t = getComputedStyle(el).transform;
    if (t === "none") return true;
    const v = t.match(/^matrix(3d)?\(([^)]+)\)$/);
    if (!v) return false;
    const x = v[2].split(",").map(Number);
    return v[1]
      ? Math.abs(x[12]) < 0.5 && Math.abs(x[13]) < 0.5 && Math.abs(x[0] - 1) < 0.01 && Math.abs(x[5] - 1) < 0.01
      : Math.abs(x[4]) < 0.5 && Math.abs(x[5]) < 0.5 && Math.abs(x[0] - 1) < 0.01 && Math.abs(x[3] - 1) < 0.01;
  };
  const dentro = (r) => r.width > 0 && r.height > 0 && r.top >= -1 && r.left >= -1 && r.bottom <= innerHeight + 1 && r.right <= innerWidth + 1;
  const descoberto = (el, r) => {
    const x = Math.min(innerWidth - 1, Math.max(0, r.left + r.width / 2));
    const y = Math.min(innerHeight - 1, Math.max(0, r.top + r.height / 2));
    const topo = document.elementFromPoint(x, y);
    // So ancestrais do proprio elemento (ou ele) podem estar no topo: cortina e irma, nunca ancestral.
    // elementFromPoint ignora pointer-events: none, entao a cortina tambem e conferida pela classe.
    // Classe renomeada: o guarda extra some, o resto do marco continua valendo.
    const cortina = document.querySelector(".intro");
    const cs = cortina && getComputedStyle(cortina);
    const cobreCortina = cs && cs.display !== "none" && cs.visibility !== "hidden" && cortina.getBoundingClientRect().bottom > r.top + 1;
    return !!topo && (el.contains(topo) || topo.contains(el)) && !cobreCortina;
  };
  const caracteres = (h1) => {
    const w = document.createTreeWalker(h1, NodeFilter.SHOW_TEXT);
    const rg = document.createRange();
    let total = 0;
    let legiveis = 0;
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      const s = n.nodeValue.replace(/\s/g, "").length;
      if (!s) continue;
      total += s;
      const el = n.parentElement;
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden" || !opaco(el)) continue;
      rg.selectNodeContents(n);
      if (dentro(rg.getBoundingClientRect())) legiveis += s;
    }
    return { total, legiveis };
  };

  const laco = () => {
    const d = document.documentElement;
    const b = document.body;
    if (d && b) {
      // headlineLegivel: h1 (sem classes): opaco ele e ancestrais ate body, transform assentado em
      // ele, ancestrais e descendentes, retangulo dentro da viewport, descoberto, todo caractere legivel.
      const h1 = document.querySelector("h1");
      if (h1 && !("headlineLegivel" in m.marcos)) {
        const r = h1.getBoundingClientRect();
        const c = caracteres(h1);
        m.headline = c;
        const assentado = [...cadeia(h1), ...h1.querySelectorAll("*")].every(identidade);
        if (c.total > 0 && c.legiveis === c.total && opaco(h1) && assentado && dentro(r) && descoberto(h1, r)) marcar("headlineLegivel");
      }
      const cta = document.querySelector(seletorCta);
      if (cta && !("ctaVisivel" in m.marcos)) {
        const r = cta.getBoundingClientRect();
        if (dentro(r) && opaco(cta) && cadeia(cta).every(identidade) && descoberto(cta, r)) marcar("ctaVisivel");
      }
      // rolagemLivre: sem a trava `intro-pendente` (index.html) nem overflow hidden/clip em html e body.
      const trava = (el) => /hidden|clip/.test(getComputedStyle(el).overflowY);
      if (!d.classList.contains("intro-pendente") && !d.classList.contains("lenis-stopped") && !trava(d) && !trava(b)) marcar("rolagemLivre");
      if (d.classList.contains("pronto")) marcar("hidratado");
    }
    requestAnimationFrame(laco);
  };
  requestAnimationFrame(laco);
}

// sai quando o cartao 30 fechar
// Diagnostico "sem cortina": a primeira consulta de movimento reduzido (a do script inline do
// index.html) responde `true`, a classe intro-pendente nao nasce e o resto do movimento segue igual.
function semCortina() {
  const original = window.matchMedia.bind(window);
  let primeira = true;
  window.matchMedia = (q) => {
    if (primeira && /prefers-reduced-motion/.test(q)) {
      primeira = false;
      return { matches: true, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} };
    }
    return original(q);
  };
}

// ---------------------------------------------------------------------------------------------
// Rodada
// ---------------------------------------------------------------------------------------------

function esperaMarcos({ marcos, quieto }) {
  const m = window.__m;
  return !!m && m.fcp !== null && m.lcp !== null && marcos.every((k) => k === "fcp" || k === "lcp" || k in m.marcos) && performance.now() - m.ultimo >= quieto;
}
function faltando(marcos) {
  const m = window.__m;
  if (!m) return ["sonda ausente"];
  return marcos.filter((k) => (k === "fcp" ? m.fcp === null : k === "lcp" ? m.lcp === null : !(k in m.marcos)));
}
function coletar() {
  const n = performance.getEntriesByType("navigation")[0];
  const recursos = performance.getEntriesByType("resource").map((e) => ({
    nome: e.name.replace(location.origin, ""),
    inicio: Math.round(e.startTime),
    fim: Math.round(e.responseEnd),
    transferido: e.transferSize,
    corpo: e.encodedBodySize,
  }));
  const { marcos, fcp, lcp, longas, cls, headline } = window.__m;
  return {
    ttfb: Math.round(n.responseStart),
    htmlFim: Math.round(n.responseEnd),
    dcl: Math.round(n.domContentLoadedEventEnd),
    load: Math.round(n.loadEventEnd),
    fcp,
    lcp: lcp ? lcp.t : null,
    lcpElemento: lcp ? `${lcp.el} "${lcp.texto}"` : null,
    cls: +cls.toFixed(4),
    tbt: longas.reduce((a, [, d]) => a + Math.max(0, d - 50), 0),
    maiorTarefa: Math.max(0, ...longas.map(([, d]) => d)),
    longas,
    headlineCaracteres: headline,
    ...marcos,
    recursos,
  };
}

async function navegar(pagina, alvo, erros, estado) {
  estado.contagem = {};
  try {
    await pagina.goto(alvo, { waitUntil: "load", timeout: TIMEOUT_NAVEGACAO_MS });
  } catch (e) {
    throw new Falha(`navegacao falhou: ${e.message.split("\n")[0]}`);
  }
  try {
    await pagina.waitForFunction(esperaMarcos, { marcos: MARCOS, quieto: QUIETO_MS }, { timeout: TIMEOUT_MARCOS_MS, polling: "raf" });
  } catch {
    const nulos = await pagina.evaluate(faltando, MARCOS).catch(() => ["pagina inacessivel"]);
    throw new Falha(`marco nulo ou timeout (${TIMEOUT_MARCOS_MS} ms): ${nulos.join(", ") || "nenhum marco faltando, pagina nao ficou quieta"}`);
  }
  const r = await pagina.evaluate(coletar);
  if (erros.length) throw new Falha(`erro da pagina: ${erros.join(" | ")}`);
  for (const k of [...MARCOS, "cls", "tbt"]) if (typeof r[k] !== "number") throw new Falha(`marco nulo: ${k}`);
  return { ...r, respostas: { ...estado.contagem } };
}

async function rodada(nav, servidor, perfil, variante) {
  const P = PERFIS[perfil];
  const contexto = await nav.newContext({ viewport: VIEWPORT, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: UA });
  try {
    const pagina = await contexto.newPage();
    const erros = [];
    pagina.on("console", (msg) => msg.type() === "error" && erros.push(`console.error: ${msg.text()}`));
    pagina.on("pageerror", (e) => erros.push(`pageerror: ${e.message}`));
    pagina.on("requestfailed", (r) => {
      const t = r.failure()?.errorText ?? "";
      if (!/ERR_ABORTED/.test(t)) erros.push(`requestfailed: ${r.url()} ${t}`);
    });
    if (variante === "sem-cortina") await pagina.addInitScript(semCortina);
    await pagina.addInitScript(sonda, SELETOR_CTA);
    if (variante === "movimento-reduzido") await pagina.emulateMedia({ reducedMotion: "reduce" });
    const cdp = await contexto.newCDPSession(pagina);
    await cdp.send("Network.enable");
    if (P.cdp) {
      await cdp.send("Network.emulateNetworkConditions", {
        offline: false,
        latency: P.cdp.latency,
        downloadThroughput: (P.cdp.downloadKbit * 1024) / 8,
        uploadThroughput: (P.cdp.uploadKbit * 1024) / 8,
      });
    }
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU });
    servidor.estado.atrasoDocumentoMs = 3 * P.rtt; // ESTIMATIVA de DNS, TCP e TLS, so no documento HTML
    const frio = await navegar(pagina, servidor.alvo, erros, servidor.estado);
    erros.length = 0;
    // Volta: segunda navegacao no MESMO contexto, cache quente, revalidacao com 304 do servidor.
    const volta = await navegar(pagina, servidor.alvo, erros, servidor.estado);
    if (!volta.respostas[304]) throw new Falha("cenario de volta sem nenhum 304 do servidor: o cache quente nao foi exercitado");
    return { frio, volta };
  } finally {
    await contexto.close();
  }
}

// ---------------------------------------------------------------------------------------------
// Estatistica e veredito
// ---------------------------------------------------------------------------------------------

const arred = (x) => (Math.abs(x) < 1 ? +x.toFixed(4) : +x.toFixed(1));
function estatistica(xs) {
  const v = xs.filter((x) => typeof x === "number").sort((a, b) => a - b);
  if (!v.length) return { mediana: null, p75: null, min: null, max: null, n: 0 };
  const meio = v.length >> 1;
  const mediana = v.length % 2 ? v[meio] : (v[meio - 1] + v[meio]) / 2;
  return { mediana: arred(mediana), p75: arred(v[Math.ceil(0.75 * v.length) - 1]), min: arred(v[0]), max: arred(v[v.length - 1]), n: v.length };
}

function julgar(perfil, est, limites) {
  const tol = limites.toleranciaP75;
  const saida = [];
  for (const [nome, c] of Object.entries(limites.perfis[perfil] ?? {})) {
    let estat = "p75";
    let valor = est[nome].p75;
    let limite;
    let regra;
    if (nome === "tbt") {
      estat = "mediana";
      valor = est.tbt.mediana;
      limite = c.linhaBase * (1 + c.subidaMaxima);
      regra = `mediana <= linha de base ${c.linhaBase} ms (ponto medio de ${c.faixaBase?.join(" a ")}) + ${c.subidaMaxima * 100}%`;
    } else if (c.regra) {
      limite = est.fcp.p75 * (1 + tol);
      regra = `p75 <= p75 do fcp (${est.fcp.p75}) + ${tol * 100}%`;
    } else {
      limite = c.teto * (1 + tol);
      regra = `p75 <= teto ${c.teto} + ${tol * 100}%`;
    }
    const passa = typeof valor === "number" && valor <= limite;
    saida.push({
      metrica: nome,
      estatistica: estat,
      valor,
      limite: arred(limite),
      regra,
      modo: c.modo,
      estado: passa ? "ok" : c.modo === "vigente" ? "reprovado" : "aviso",
    });
  }
  return saida;
}

// ---------------------------------------------------------------------------------------------
// Saidas
// ---------------------------------------------------------------------------------------------

const p2 = (n) => String(n).padStart(2, "0");
function carimbo(d) {
  return { data: `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`, hora: `${p2(d.getHours())}${p2(d.getMinutes())}` };
}
function git(args) {
  try {
    return execFileSync("git", args, { cwd: RAIZ, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}
function arvore() {
  const s = git(["status", "--porcelain"]);
  if (s === null) return { disponivel: false };
  const linhas = s.split("\n").filter(Boolean);
  return {
    disponivel: true,
    limpa: linhas.length === 0,
    alterados: linhas.filter((l) => !l.startsWith("??")).length,
    naoRastreados: linhas.filter((l) => l.startsWith("??")).length,
    amostra: linhas.slice(0, 15),
  };
}

function resumo(r) {
  const L = [];
  L.push("Laboratório não prova campo nem conversão.");
  L.push("");
  L.push(`comando:   ${r.comando}`);
  L.push(`quando:    ${r.quando}`);
  L.push(`commit:    ${r.commit ?? "indisponivel"}  arvore: ${r.arvore.disponivel ? (r.arvore.limpa ? "limpa" : `${r.arvore.alterados} alterados, ${r.arvore.naoRastreados} nao rastreados`) : "indisponivel"}`);
  L.push(`chromium:  ${r.chromium}  (playwright-core ${r.playwrightCore}, node ${r.node})`);
  L.push(`ambiente:  ${r.viewport}, CPU ${r.cpu}x, contexto novo por rodada, rodadas seriais, ${r.rodadas} por cenario`);
  L.push(`servidor:  ${r.servidor?.compressao ?? "nao iniciado"}; _headers: ${r.servidor?.headers ?? "nao lido"}; ETag forte e 304`);
  const mb = r.microbenchmark;
  L.push(`cpu base:  ${mb.mediaMs} ms por repeticao, CV ${(mb.coeficienteVariacao * 100).toFixed(1)}%${mb.maquinaRuidosa ? "  AVISO: maquina ruidosa (CV > 15%), desconfie dos numeros" : ""}`);
  L.push("");
  for (const c of r.cenarios) {
    L.push(`== ${c.perfil} | ${c.variante} | ${c.cenario} | ${c.rodadasBrutas.length} rodadas ==`);
    if (c.cenario === "frio" && c.perfil !== "sem-limite") {
      const p = r.perfis[c.perfil];
      L.push(`   rede efetiva: latencia ${p.cdp.latency} ms, down ${p.cdp.downloadKbit} Kbit/s, up ${p.cdp.uploadKbit} Kbit/s; atraso do documento ${p.atrasoDocumentoMs} ms (ESTIMATIVA de DNS, TCP e TLS, nao medido)`);
    }
    L.push(`   ${"metrica".padEnd(16)}${"mediana".padStart(9)}${"p75".padStart(9)}${"min".padStart(9)}${"max".padStart(9)}${"n".padStart(4)}`);
    for (const k of [...METRICAS, ...EXTRAS]) {
      const e = c.estatisticas[k];
      L.push(`   ${k.padEnd(16)}${String(e.mediana).padStart(9)}${String(e.p75).padStart(9)}${String(e.min).padStart(9)}${String(e.max).padStart(9)}${String(e.n).padStart(4)}`);
    }
    if (c.cenario === "volta") L.push(`   respostas do servidor na volta (primeira rodada): ${JSON.stringify(c.rodadasBrutas[0].respostas)}`);
    if (c.veredito?.length) {
      L.push("   veredito:");
      for (const v of c.veredito) L.push(`     ${v.estado.toUpperCase().padEnd(10)}${v.metrica.padEnd(16)}${v.estatistica}=${v.valor}  limite ${v.limite}  [${v.regra}; modo ${v.modo}]`);
    }
    L.push("");
  }
  L.push(`resultado: ${r.resultado.toUpperCase()}  (ok=${r.contagemVeredito.ok} aviso=${r.contagemVeredito.aviso} reprovado=${r.contagemVeredito.reprovado})`);
  L.push("");
  L.push("Notas de leitura");
  for (const n of r.notas) L.push(`- ${n}`);
  return L.join("\n") + "\n";
}

// ---------------------------------------------------------------------------------------------
// Plano e execucao
// ---------------------------------------------------------------------------------------------

function imprimirPlano(a, perfis, saidaDir, limites, selo) {
  const out = [];
  out.push("Plano da regua de carga (laboratorio nao prova campo nem conversao)");
  out.push(`  perfis:      ${perfis.map((p) => `${p} [${PERFIS[p].descricao}; atraso do documento ${3 * PERFIS[p].rtt} ms]`).join("\n               ")}`);
  out.push(`  variantes:   ${a.variantes.join(", ")}`);
  out.push(`  cenarios:    frio (contexto novo, cache vazio) e volta (2a navegacao no mesmo contexto, 304)`);
  out.push(`  rodadas:     ${a.rodadas} por cenario, seriais, contexto novo por rodada`);
  out.push(`  navegacoes:  ${perfis.length * a.variantes.length * a.rodadas * 2}`);
  out.push(`  ambiente:    ${VIEWPORT.width}x${VIEWPORT.height} @3x, mobile, touch, CPU ${CPU}x`);
  out.push(`  marcos:      ${[...MARCOS, "cls", "tbt"].join(", ")}`);
  out.push(`  dist:        ${DIST}  (index.html ${existsSync(join(DIST, "index.html")) ? "presente" : "AUSENTE: a execucao real falharia com codigo 2"}; _headers ${existsSync(join(DIST, "_headers")) ? "presente" : "ausente"})`);
  out.push(`  limites:     ${CAMINHO_LIMITES}  (${Object.values(limites.perfis).reduce((s, m) => s + Object.keys(m).length, 0)} entradas, tolerancia p75 ${limites.toleranciaP75 * 100}%)`);
  out.push(`  saida:       ${saidaDir}/relatorio-${selo}.json e resumo-${selo}.txt`);
  out.push(`  chromium:    ${process.env.CHROMIUM ?? "o do playwright-core (variavel CHROMIUM nao definida)"}`);
  console.log(out.join("\n"));
}

async function main() {
  const a = lerArgs(process.argv.slice(2));
  const limites = validarLimites(JSON.parse(await readFile(CAMINHO_LIMITES, "utf8")));
  const perfis = a.perfis ?? Object.keys(PERFIS);
  const inicio = new Date();
  const { data, hora } = carimbo(inicio);
  const selo = `${data}-${hora}`;
  const saidaDir = resolve(a.saida ?? join(RAIZ, "output", "playwright", `carga-${data}`));
  imprimirPlano(a, perfis, saidaDir, limites, selo);
  if (a.seco) {
    console.log("\n--seco: configuracao e limites validos; nada foi executado.");
    return 0;
  }
  if (!existsSync(join(DIST, "index.html"))) {
    throw new Falha(`dist/index.html nao existe em ${DIST}. A regua nao constroi: rode \`npm run build\` antes.`);
  }
  let chromium;
  let playwrightCore = "?";
  try {
    const req = createRequire(join(RAIZ, "package.json"));
    ({ chromium } = req("playwright-core"));
    playwrightCore = req("playwright-core/package.json").version;
  } catch {
    throw new Falha("precisa de playwright-core: npm i -D playwright-core (e CHROMIUM=/caminho/para/chrome)");
  }

  const micro = microbenchmark();
  console.log(`\nmicrobenchmark de CPU: ${micro.mediaMs} ms, CV ${(micro.coeficienteVariacao * 100).toFixed(1)}%${micro.maquinaRuidosa ? "  AVISO: maquina ruidosa" : ""}`);

  const relatorio = {
    aviso: "Laboratório não prova campo nem conversão.",
    comando: `node ${relative(process.cwd(), ARQUIVO)} ${process.argv.slice(2).join(" ")}`.trim(),
    quando: inicio.toISOString(),
    commit: git(["rev-parse", "--short", "HEAD"]),
    arvore: arvore(),
    node: process.version,
    playwrightCore,
    chromium: null,
    viewport: `${VIEWPORT.width}x${VIEWPORT.height} @3x, mobile, touch`,
    cpu: CPU,
    rodadas: a.rodadas,
    servidor: null,
    perfis: Object.fromEntries(
      perfis.map((p) => [p, { descricao: PERFIS[p].descricao, cdp: PERFIS[p].cdp, rttNominalMs: PERFIS[p].rtt, atrasoDocumentoMs: 3 * PERFIS[p].rtt, multiplicadorLatencia: PERFIS[p].multiplicadorLatencia ?? null }]),
    ),
    microbenchmark: micro,
    limites,
    cenarios: [],
    resultado: null,
    contagemVeredito: { ok: 0, aviso: 0, reprovado: 0 },
    falha: null,
    notas: [
      "Servidor local com Brotli (qualidade 11) e ETag forte, como a Cloudflare entrega. O harness de 13/10/2026 usava gzip: o JS transferido cai cerca de 14%, o que desloca fcp e lcp para baixo nos perfis lentos. A comparacao com a linha de base nao e identica por isso.",
      "4g-lento: latencia efetiva 562,5 ms (150 ms x 3,75, fator do Lighthouse no metodo devtools, ja embutido) e vazao de 1474,56 Kbit/s (1,6 Mbps x 0,9). O CDP aplica a latencia em cada requisicao.",
      "O atraso de 3 RTT no primeiro byte do documento e ESTIMATIVA de DNS, TCP e TLS, nao medida. Vale para o documento HTML, nos cenarios frio e volta.",
      "tbt segue a definicao do harness de origem: soma de max(0, duracao - 50 ms) de todas as tarefas longas desde o inicio da navegacao. A linha de base (346 a 418 ms) e a faixa de 13/10/2026; o limite usa o ponto medio 382 ms mais 10%.",
      "O cenario volta mostra cache quente com revalidacao (Cache-Control max-age=0, must-revalidate, 304). Nao tem tetos: e so leitura.",
      "As variantes sem-cortina e movimento-reduzido sao diagnostico e nao recebem veredito.",
    ],
  };

  let codigo = 0;
  let servidor = null;
  let nav = null;
  try {
    servidor = await iniciarServidor();
    relatorio.servidor = {
      compressao: "brotli (qualidade 11, cache em memoria por arquivo); sem Accept-Encoding br, entrega sem compressao",
      headers: servidor.regras ? `${servidor.regras} regra(s) aplicada(s) de dist/_headers` : "dist/_headers ausente ou sem regras: Cache-Control padrao de Worker (max-age=0, must-revalidate)",
      arquivosEmCache: servidor.arquivos,
    };
    nav = await chromium.launch({
      headless: true,
      ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}),
      // Nada sai da maquina: so 127.0.0.1 resolve. Pedido externo vira requestfailed e derruba a rodada.
      args: ["--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1"],
    });
    relatorio.chromium = nav.version();
    console.log(`chromium ${relatorio.chromium}, servidor em ${servidor.alvo}\n`);

    for (const perfil of perfis) {
      for (const variante of a.variantes) {
        const frio = [];
        const volta = [];
        for (let i = 1; i <= a.rodadas; i++) {
          let r;
          try {
            r = await rodada(nav, servidor, perfil, variante);
          } catch (e) {
            throw new Falha(`[${perfil} | ${variante} | rodada ${i}/${a.rodadas}] ${e.message}`);
          }
          frio.push({ rodada: i, ...r.frio });
          volta.push({ rodada: i, ...r.volta });
          console.log(`[${perfil} | ${variante} | ${i}/${a.rodadas}] frio fcp=${r.frio.fcp} lcp=${r.frio.lcp} headline=${r.frio.headlineLegivel} cta=${r.frio.ctaVisivel} rolagem=${r.frio.rolagemLivre} tbt=${r.frio.tbt} | volta fcp=${r.volta.fcp} lcp=${r.volta.lcp} 304=${r.volta.respostas[304]}`);
        }
        for (const [cenario, brutas] of [["frio", frio], ["volta", volta]]) {
          const estatisticas = Object.fromEntries([...METRICAS, ...EXTRAS].map((k) => [k, estatistica(brutas.map((x) => x[k]))]));
          // Tetos valem so para a primeira carga real: frio, com cortina, perfis com limites.
          const veredito = cenario === "frio" && variante === "com-cortina" && limites.perfis[perfil] ? julgar(perfil, estatisticas, limites) : null;
          for (const v of veredito ?? []) relatorio.contagemVeredito[v.estado]++;
          relatorio.cenarios.push({ perfil, variante, cenario, estatisticas, veredito, rodadasBrutas: brutas });
        }
      }
    }
    codigo = relatorio.contagemVeredito.reprovado ? 1 : 0;
    relatorio.resultado = codigo ? "reprovado" : relatorio.contagemVeredito.aviso ? "ok com avisos" : "ok";
  } catch (e) {
    codigo = 2;
    relatorio.falha = e.message;
    relatorio.resultado = "falha de harness";
    console.error(`\nFALHA: ${e.message}`);
  } finally {
    await nav?.close().catch(() => {});
    await servidor?.fechar();
  }

  await mkdir(saidaDir, { recursive: true });
  const jsonPath = join(saidaDir, `relatorio-${selo}.json`);
  const txtPath = join(saidaDir, `resumo-${selo}.txt`);
  await writeFile(jsonPath, JSON.stringify(relatorio, null, 2));
  const texto = resumo(relatorio) + (relatorio.falha ? `\nFALHA: ${relatorio.falha}\n` : "");
  await writeFile(txtPath, texto);
  console.log(`\n${texto}\nrelatorio: ${jsonPath}\nresumo:    ${txtPath}`);
  return codigo;
}

main().then(
  (c) => process.exit(c),
  (e) => {
    console.error(`FALHA: ${e.message}`);
    process.exit(2);
  },
);
