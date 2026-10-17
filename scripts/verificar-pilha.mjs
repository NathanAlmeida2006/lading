/**
 * Verificacao comportamental da secao #pilha-de-valor (PilhaDeValor.jsx).
 *
 * Nao corrige nada: mede e reporta. Cobre as medidas de tamanho e de preco, movimento reduzido,
 * JavaScript desligado, hidratacao, menu e indice, doca, acento, teclado, contraste e cortina.
 *
 *   npx vite preview --port 4181 &
 *   CHROMIUM=/caminho/chrome node scripts/verificar-pilha.mjs [url]
 *
 * Evidencias em output/playwright/pilha/. Precisa de playwright-core e de um Chromium.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { config } from "../src/config.js";
let chromium;
try {
  ({ chromium } = await import("playwright-core"));
} catch {
  console.error("verificar-pilha precisa de playwright-core e de um Chromium.");
  process.exit(2);
}

const EXEC = process.env.CHROMIUM ?? null;
const ALVO = process.argv[2] ?? "http://localhost:4181/";
const origem = new URL(ALVO).origin;
const OUT = fileURLToPath(new URL("../output/playwright/pilha", import.meta.url));
mkdirSync(OUT, { recursive: true });
const nav = await chromium.launch(EXEC ? { executablePath: EXEC, headless: true } : { headless: true });

const resultados = [];
const registrar = (id, ok, nota, medidas) => {
  resultados.push({ id, ok, nota, medidas });
  console.log(`${id}  ${ok ? "ok      " : "FALHOU  "} ${nota}`);
};
const harness = (t) => /Failed to load resource|ERR_FAILED/i.test(t);

const abrirCtx = async (opts = {}) => {
  const ctx = await nav.newContext({ viewport: { width: 390, height: 844 }, ...opts });
  // Execucao local: so a origem do preview responde (como em verificar.mjs).
  await ctx.route("**/*", (r) => {
    const u = new URL(r.request().url());
    return u.origin === origem || ["data:", "blob:"].includes(u.protocol) ? r.continue() : r.abort();
  });
  return ctx;
};

async function pagina(ctxOpts = {}, consentimento = "aceitar") {
  const ctx = await abrirCtx(ctxOpts);
  const p = await ctx.newPage();
  const erros = [];
  p.on("console", (m) => erros.push({ tipo: m.type(), texto: m.text() }));
  p.on("pageerror", (e) => erros.push({ tipo: "pageerror", texto: String(e.message ?? e) }));
  await p.goto(ALVO, { waitUntil: "networkidle" });
  if (consentimento !== "nao") {
    const rotulo = consentimento === "aceitar" ? "Aceitar" : "Recusar";
    await p.click(`[aria-label="Aviso de cookies"] button:text-is("${rotulo}")`, { timeout: 3000 }).catch(() => {});
  }
  await p.waitForFunction(() => {
    const i = document.querySelector(".intro");
    return !i || getComputedStyle(i).display === "none";
  }, null, { timeout: 8000 }).catch(() => {});
  // O ponteiro fica onde o clique de consentimento deixou: ao rolar, ele pousa sobre um CTA e o
  // `hover:bg-transparent` apaga o acento medido. Tirar o ponteiro da janela antes de medir.
  await p.mouse.move(-10, -10).catch(() => {});
  await p.waitForTimeout(300);
  return { ctx, p, erros };
}

async function irPara(p, seletor = "#pilha-de-valor", bloco = "center") {
  await p.evaluate(([s, b]) => document.querySelector(s).scrollIntoView({ block: b, behavior: "instant" }), [seletor, bloco]);
  await p.waitForTimeout(1200);
}

// Cor computada (pode ser oklch) convertida para sRGB pelo canvas: [r, g, b, a].
const CONVERSAO = `
  const __cv = document.createElement("canvas"); __cv.width = __cv.height = 1;
  const __g = __cv.getContext("2d", { willReadFrequently: true });
  const rgbDe = (c) => { __g.clearRect(0, 0, 1, 1); __g.fillStyle = "#000000"; __g.fillStyle = c; __g.fillRect(0, 0, 1, 1);
    const d = __g.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], +(d[3] / 255).toFixed(3)]; };
`;

const lum = ([r, g, b]) => {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const contraste = (a, b) => {
  const x = lum(a), y = lum(b);
  return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2);
};

// ---------- a) layout, 4 viewports ----------
// Os numeros esperados saem da config (itens, total), nao de valores congelados.
const ITENS = config.pilhaDeValor.itens.length;
const TOTAL = config.pilhaDeValor.totalDeclarado;
const MEDIR_PILHA = () => {
  const s = document.getElementById("pilha-de-valor");
  const r = s.getBoundingClientRect();
  const lista = s.querySelector(".pilha__lista");
  const oferta = s.querySelector(".pilha__oferta");
  const itens = [...s.querySelectorAll(".pilha__itens > li")];
  const num = (t) => parseFloat(t.replace(/[^\d,]/g, "").replace(",", "."));
  // Cada item: icone, nome e o valor riscado (o ultimo paragrafo).
  const dd = itens.map((d) => d.querySelector("p:last-of-type").textContent.trim());
  const ctas = [...document.querySelectorAll('a[data-posicao="pilha"]')];
  const cta = ctas[0];
  const preco = oferta.querySelector("dd");
  const numeral = preco.querySelector(".aberracao");
  const nr = numeral.getBoundingClientRect();
  const cr = oferta.getBoundingClientRect();
  return {
    innerWidth,
    larguraDoc: document.documentElement.scrollWidth,
    itens: itens.length,
    // O fio vai em cima de cada item, menos do primeiro (`not-first:border-t`).
    bordas: itens.slice(1).map((d) => `${getComputedStyle(d).borderTopWidth} ${getComputedStyle(d).borderTopStyle}`),
    dd,
    somaDd: dd.reduce((a, t) => a + num(t), 0),
    tachado: num(s.querySelector("p s").textContent),
    ctas: ctas.length,
    ctaAltura: cta ? +cta.getBoundingClientRect().height.toFixed(1) : null,
    ctaLargura: cta ? +cta.getBoundingClientRect().width.toFixed(1) : null,
    cardScroll: oferta.scrollWidth,
    cardClient: oferta.clientWidth,
    numeral: { texto: preco.textContent, fonte: getComputedStyle(numeral).fontSize, altura: +nr.height.toFixed(1), largura: +nr.width.toFixed(1) },
    numeralDentroDoCard: nr.left >= cr.left - 0.5 && nr.right <= cr.right + 0.5,
    secaoAltura: +r.height.toFixed(0),
  };
};

for (const [w, h] of [[360, 640], [390, 844], [1280, 720], [1440, 900]]) {
  const { ctx, p, erros } = await pagina({ viewport: { width: w, height: h } });
  await irPara(p);
  const m = await p.evaluate(MEDIR_PILHA);
  const ok = m.larguraDoc <= m.innerWidth && m.itens === ITENS && m.bordas.every((b) => parseFloat(b) > 0 && b.includes("solid")) &&
    Math.abs(m.somaDd - TOTAL) < 1e-9 && m.tachado === TOTAL && m.ctas === 1 && m.ctaAltura >= 48 &&
    m.cardScroll <= m.cardClient && m.numeralDentroDoCard;
  registrar(`a-${w}x${h}`, ok, `docW=${m.larguraDoc}/${m.innerWidth}, itens=${m.itens}, soma=${m.somaDd}, tachado=${m.tachado}, CTA=${m.ctas}x${m.ctaAltura}px, card ${m.cardScroll}/${m.cardClient}, numeral ${m.numeral.fonte} ${m.numeral.largura}x${m.numeral.altura}px`, m);
  if (w === 390 || w === 1280) {
    await p.locator("#pilha-de-valor").screenshot({ path: `${OUT}/pilha-${w}.png` });
  }
  await ctx.close();
}

// ---------- b) movimento reduzido ----------
{
  const { ctx, p } = await pagina({ reducedMotion: "reduce" });
  const contar = () => p.evaluate(() => [...document.querySelectorAll("#pilha-de-valor [data-revelar]")]
    .filter((e) => parseFloat(getComputedStyle(e).opacity) < 0.99).length);
  const antes = await contar();
  await irPara(p);
  const depois = await contar();
  registrar("b-reduced-motion", depois === 0, `opacidade<0,99 antes do scroll=${antes}, depois=${depois}`, { antes, depois });
  await ctx.close();
}

// ---------- c) JavaScript desligado ----------
{
  const ctx = await abrirCtx({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  await p.goto(ALVO, { waitUntil: "load" });
  const r = await p.evaluate(() => {
    const s = document.getElementById("pilha-de-valor");
    if (!s) return { existe: false };
    const vis = (el) => {
      if (!el) return false;
      for (let n = el; n; n = n.parentElement) {
        const q = getComputedStyle(n);
        if (q.display === "none" || q.visibility === "hidden") return false;
      }
      const rc = el.getBoundingClientRect();
      return rc.width > 0 && rc.height > 0 && parseFloat(getComputedStyle(el).opacity) >= 0.99;
    };
    const itens = [...s.querySelectorAll(".pilha__itens > li")];
    const cta = s.querySelector('a[data-posicao="pilha"]');
    return {
      existe: true,
      cabecalhoVisivel: vis(s.querySelector("h2")),
      itens: itens.length,
      itensVisiveis: itens.filter(vis).length,
      precoVisivel: vis(s.querySelector(".pilha__oferta dd")),
      ctaVisivel: cta ? vis(cta) : false,
      ctaHref: cta ? cta.getAttribute("href") : null,
      opacidadesRevelar: [...s.querySelectorAll("[data-revelar]")].map((e) => getComputedStyle(e).opacity),
    };
  });
  const ok = r.existe && r.cabecalhoVisivel && r.itens === ITENS && r.itensVisiveis === ITENS && r.precoVisivel && r.ctaVisivel && !!r.ctaHref;
  registrar("c-sem-javascript", ok, `cabecalho=${r.cabecalhoVisivel}, itens=${r.itensVisiveis}/${r.itens}, preco=${r.precoVisivel}, CTA=${r.ctaVisivel} href=${r.ctaHref}`, r);
  await ctx.close();
}

// ---------- d) hidratacao e console ----------
{
  const { ctx, erros } = await pagina({});
  const hidratacao = erros.filter((e) => /Minified React error #4(18|23|25)|hydrat/i.test(e.texto));
  const pe = erros.filter((e) => e.tipo === "pageerror");
  const ce = erros.filter((e) => e.tipo === "error" && !harness(e.texto));
  const ceHarness = erros.filter((e) => e.tipo === "error" && harness(e.texto));
  const ok = hidratacao.length === 0 && pe.length === 0 && ce.length === 0;
  registrar("d-hidratacao", ok, `hidratacao=${hidratacao.length}, pageerror=${pe.length}, console.error (fora do harness)=${ce.length}, console.error do harness=${ceHarness.length}`,
    { hidratacao, pageerror: pe, consoleError: ce, consoleErrorHarness: ceHarness.map((e) => e.texto.slice(0, 160)) });
  await ctx.close();
}

// ---------- e) menu e indice ----------
{
  const { ctx, p } = await pagina({});
  const r = await p.evaluate(() => ({
    links: [...document.querySelectorAll('#menu nav a[href^="#"]')].map((a) => a.getAttribute("href")),
    indice: [...document.querySelectorAll('div[aria-hidden="true"]')].map((d) => d.textContent.trim()).find((t) => /\d\d \/ \d\d/.test(t)) ?? null,
  }));
  const ok = r.links.length === 8 && !r.links.includes("#pilha-de-valor") && r.indice !== null && r.indice.endsWith("/ 08");
  registrar("e-menu-e-indice", ok, `menu=${r.links.length} links (${r.links.join(" ")}), indice inicial="${r.indice}"`, r);
  await irPara(p);
  const noPilha = await p.evaluate(() => [...document.querySelectorAll('div[aria-hidden="true"]')].map((d) => d.textContent.trim()).find((t) => /\d\d \/ \d\d/.test(t)));
  console.log(`      indice com a pilha na tela="${noPilha}" (informativo)`);
  await ctx.close();
}

// ---------- f) doca e CTAs simultaneos ----------
const ESTADOS = (s, h) => ({
  entra: `window.scrollTo({top: window.scrollY + s.getBoundingClientRect().top - (${h} - 2), behavior: "instant"})`,
  centro: `window.scrollTo({top: window.scrollY + s.getBoundingClientRect().top + s.offsetHeight / 2 - ${h} / 2, behavior: "instant"})`,
  sai: `window.scrollTo({top: window.scrollY + s.getBoundingClientRect().top + s.offsetHeight - 2, behavior: "instant"})`,
});
const LEIA_DOCA = () => {
  const doca = document.querySelector("aside.doca");
  const rc = doca.getBoundingClientRect();
  const ctas = [...document.querySelectorAll("a[data-posicao]")].filter((a) => {
    if (a.closest("[inert]")) return false;
    const rr = a.getBoundingClientRect();
    const st = getComputedStyle(a);
    return rr.bottom > 0 && rr.top < innerHeight && rr.right > 0 && rr.left < innerWidth &&
      st.visibility !== "hidden" && st.display !== "none";
  }).map((a) => a.dataset.posicao);
  const banner = document.querySelector('[aria-label="Aviso de cookies"]');
  return {
    docaAtiva: doca.hasAttribute("data-ativa"),
    docaInert: doca.hasAttribute("inert"),
    docaNaTela: rc.bottom > 0 && rc.top < innerHeight,
    ctasVisiveis: ctas,
    bannerVisivel: !!banner && getComputedStyle(banner).display !== "none",
  };
};
for (const [w, h] of [[390, 844], [1280, 720]]) {
  const { ctx, p } = await pagina({ viewport: { width: w, height: h } });
  const leituras = {};
  for (const [nome, cmd] of Object.entries(ESTADOS(null, h))) {
    await p.evaluate((c) => { const s = document.getElementById("pilha-de-valor"); eval(c); }, cmd);
    await p.waitForTimeout(900);
    leituras[nome] = await p.evaluate(LEIA_DOCA);
  }
  // Linha de base: sem a pilha (centro de #espelho), para saber se a doca sobe nesta pagina.
  await irPara(p, "#espelho");
  const base = await p.evaluate(LEIA_DOCA);
  const ok = Object.values(leituras).every((l) => !l.docaAtiva && l.ctasVisiveis.length <= 1);
  registrar(`f-doca-${w}x${h}`, ok, Object.entries(leituras).map(([k, l]) => `${k}: doca ativa=${l.docaAtiva}, na tela=${l.docaNaTela}, CTAs visiveis=[${l.ctasVisiveis}]`).join(" | ") + ` | base em #espelho: doca ativa=${base.docaAtiva}`, { leituras, base });
  if (w === 390) {
    await ctx.close();
    // Com o aviso de cookies aberto, a doca tambem nao sobe.
    const c2 = await pagina({ viewport: { width: 390, height: 844 } }, "nao");
    await irPara(c2.p);
    const lc = await c2.p.evaluate(LEIA_DOCA);
    registrar("f-cookies-aberto", !lc.docaAtiva && lc.bannerVisivel, `com aviso aberto na pilha: doca ativa=${lc.docaAtiva}, aviso visivel=${lc.bannerVisivel}, CTAs=[${lc.ctasVisiveis}]`, lc);
    await c2.ctx.close();
  } else {
    await ctx.close();
  }
}

// ---------- g) acento ----------
for (const [w, h] of [[390, 844], [1280, 720]]) {
  const { ctx, p } = await pagina({ viewport: { width: w, height: h } });
  // Centro do CTA: no 1280x720 o centro da seção deixa o botão, que fica no fim do card, abaixo da dobra.
  await irPara(p, '#pilha-de-valor a[data-posicao="pilha"]');
  const r = await p.evaluate(`(() => { ${CONVERSAO}
    const probe = document.createElement("div"); probe.style.backgroundColor = "var(--acento)"; document.body.appendChild(probe);
    const acento = rgbDe(getComputedStyle(probe).backgroundColor); probe.remove();
    // O tema Cartaz redefine --acento (residual.css): o acento do papel e outro valor, medido dentro dele.
    // Sem bloco Cartaz na pagina (hoje nenhum e renderizado), so o acento do Sigilo conta.
    const cartaz = document.querySelector('[data-theme="cartaz"]');
    let acentoCartaz = null;
    if (cartaz) {
      const probeC = document.createElement("div"); probeC.style.backgroundColor = "var(--acento)"; cartaz.appendChild(probeC);
      acentoCartaz = rgbDe(getComputedStyle(probeC).backgroundColor); probeC.remove();
    }
    const igual = (c, a) => !!a && c[3] > 0 && c[0] === a[0] && c[1] === a[1] && c[2] === a[2];
    const achados = [];
    for (const el of document.querySelectorAll("body *")) {
      if (el.closest("#menu, .intro, [inert]")) continue;
      const st = getComputedStyle(el);
      if (st.display === "none" || st.visibility === "hidden" || parseFloat(st.opacity) === 0) continue;
      const rc = el.getBoundingClientRect();
      if (rc.width === 0 || rc.height === 0 || rc.bottom <= 0 || rc.top >= innerHeight || rc.right <= 0 || rc.left >= innerWidth) continue;
      if (st.backgroundColor === "rgba(0, 0, 0, 0)") continue;
      const c = rgbDe(st.backgroundColor);
      const cor = igual(c, acento) ? "sigilo" : igual(c, acentoCartaz) ? "cartaz" : null;
      if (cor) {
        achados.push({ tag: el.tagName.toLowerCase(), tema: cor, classe: String(el.className).slice(0, 60), texto: el.textContent.trim().slice(0, 40), pilha: !!el.closest("#pilha-de-valor") });
      }
    }
    return { acento, acentoCartaz, achados };
  })()`);
  const ok = r.achados.length === 1 && r.achados[0].pilha && r.achados[0].tag === "a";
  registrar(`g-acento-${w}x${h}`, ok, `elementos visiveis com --acento na viewport: ${r.achados.length} ${JSON.stringify(r.achados)} (acento=${r.acento})`, r);
  await ctx.close();
}

// ---------- h) teclado ----------
for (const [w, h] of [[390, 844], [1280, 720]]) {
  const { ctx, p } = await pagina({ viewport: { width: w, height: h } });
  await irPara(p);
  const pre = await p.evaluate(() => {
    const F = [...document.querySelectorAll("a[href],button,input,select,textarea,[tabindex]")].filter((el) => {
      if (el.closest("[inert]") || el.tabIndex < 0) return false;
      const rc = el.getBoundingClientRect();
      const st = getComputedStyle(el);
      return rc.width > 0 && rc.height > 0 && st.visibility !== "hidden" && st.display !== "none";
    });
    const cta = document.querySelector('#pilha-de-valor a[data-posicao="pilha"]');
    const i = F.indexOf(cta);
    const ant = F[i - 1];
    ant?.focus();
    return { i, anterior: ant ? `${ant.tagName} "${ant.textContent.trim().slice(0, 40)}"` : null, focaveis: F.length };
  });
  await p.keyboard.press("Tab");
  const nofoco = await p.evaluate(() => {
    const a = document.activeElement;
    const cta = document.querySelector('#pilha-de-valor a[data-posicao="pilha"]');
    const st = getComputedStyle(a);
    return {
      ativo: a.tagName, noCta: a === cta, focusVisible: a.matches(":focus-visible"),
      contorno: { estilo: st.outlineStyle, largura: st.outlineWidth, cor: st.outlineColor, deslocamento: st.outlineOffset, sombra: st.boxShadow },
      href: cta?.getAttribute("href"),
    };
  });
  const hrefHash = new URL(nofoco.href, ALVO).hash;
  await p.locator('#pilha-de-valor a[data-posicao="pilha"]').screenshot({ path: `${OUT}/foco-cta-${w}.png` });
  await p.keyboard.press("Enter");
  await p.waitForTimeout(800);
  const hash = await p.evaluate(() => location.hash);
  const ok = nofoco.noCta && nofoco.focusVisible && (nofoco.contorno.estilo !== "none" || nofoco.contorno.sombra !== "none") && hash === hrefHash;
  registrar(`h-teclado-${w}x${h}`, ok, `Tab a partir de ${pre.anterior} chegou em CTA=${nofoco.noCta} (focus-visible=${nofoco.focusVisible}, contorno=${nofoco.contorno.estilo} ${nofoco.contorno.largura}, sombra=${nofoco.contorno.sombra}); Enter -> hash="${hash}" (href=${nofoco.href})`, { pre, nofoco, hash });
  await ctx.close();
}

// ---------- i) contraste ----------
{
  const { ctx, p } = await pagina({ viewport: { width: 390, height: 844 } });
  await irPara(p);
  const cores = await p.evaluate(`(() => { ${CONVERSAO}
    const s = document.getElementById("pilha-de-valor");
    const lista = s.querySelector(".pilha__lista");
    const oferta = s.querySelector(".pilha__oferta");
    const cta = s.querySelector('a[data-posicao="pilha"]');
    const fundo = (el) => { for (let n = el; n; n = n.parentElement) { const c = getComputedStyle(n).backgroundColor; if (c !== "rgba(0, 0, 0, 0)") return rgbDe(c); } return rgbDe("#ffffff"); };
    const textoDe = (el) => [...el.querySelectorAll("*")].find((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) ?? el;
    const medir = (nome, el, fundoEl) => { const t = textoDe(el); const st = getComputedStyle(t); return { nome, texto: t.textContent.trim().slice(0, 50), fg: rgbDe(st.color), bg: fundo(fundoEl), tamanho: st.fontSize, peso: Number(st.fontWeight) }; };
    return [
      medir("Total (silver/surface-1)", lista.querySelector(":scope > p"), lista),
      medir("Tachado <s> (acento/surface-1)", lista.querySelector(":scope > p s"), lista),
      medir("Rotulo da oferta (dt)", oferta.querySelector("dt"), oferta),
      medir("Subtexto da oferta", oferta.querySelector(":scope > div:last-child"), oferta),
      medir("Rotulo do CTA", cta, cta),
    ];
  })()`);
  // WCAG AA, como no verificar.mjs: texto grande (>= 24px, ou >= 18,66px em negrito) pede 3:1; o resto, 4,5:1.
  // E a regra do acento no design system (cor.css): so em texto >= 24px.
  const grande = (l) => parseFloat(l.tamanho) >= 24 || (parseFloat(l.tamanho) >= 18.66 && l.peso >= 700);
  const linhas = cores.map((c) => ({ ...c, razao: contraste(c.fg, c.bg), minimo: grande(c) ? 3 : 4.5, alpha: c.fg[3] < 1 || c.bg[3] < 1 }));
  const ok = linhas.every((l) => l.razao >= l.minimo && !l.alpha);
  registrar("i-contraste", ok, linhas.map((l) => `${l.nome}: ${l.razao}:1 (${l.tamanho}, minimo ${l.minimo})`).join(" | "), linhas);
  await ctx.close();
}

// ---------- j) cortina ----------
for (const [w, h] of [[390, 844], [1280, 720]]) {
  const { ctx, p } = await pagina({ viewport: { width: w, height: h } });
  const geo = await p.evaluate(() => {
    const rec = document.getElementById("reconhecimento").getBoundingClientRect();
    const pil = document.getElementById("pilha-de-valor").getBoundingClientRect();
    return { recBase: rec.bottom + scrollY, pilhaTopo: pil.top + scrollY, pilhaAltura: pil.height, recAltura: rec.height };
  });
  const quadros = {};
  for (const [pct, frac] of [["30", 0.3], ["80", 0.8]]) {
    await p.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), geo.pilhaTopo - frac * h);
    await p.waitForTimeout(900);
    const mapa = await p.evaluate(() => {
      const owners = {};
      let vazias = 0, total = 0;
      for (const x of [5, Math.round(innerWidth / 2), innerWidth - 6]) {
        for (let y = 0; y < innerHeight; y += 8) {
          const el = document.elementFromPoint(x, y);
          total++;
          const dono = !el || el === document.documentElement || el === document.body ? "VAZIO" : (el.closest("section")?.id ?? el.tagName);
          if (dono === "VAZIO") vazias++;
          owners[dono] = (owners[dono] ?? 0) + 1;
        }
      }
      const pilha = document.getElementById("pilha-de-valor").getBoundingClientRect();
      return { posicaoPilhaTopo: +(pilha.top / innerHeight).toFixed(3), scrollY: Math.round(scrollY), vazias, total, owners };
    });
    quadros[pct] = mapa;
    await p.screenshot({ path: `${OUT}/cortina-${w}x${h}-pilha${pct}.png` });
  }
  const ok = Object.values(quadros).every((q) => q.vazias === 0);
  registrar(`j-cortina-${w}x${h}`, ok, `gap reconhecimento->pilha=${(geo.pilhaTopo - geo.recBase).toFixed(1)}px; pilha a 30%: topo em ${quadros["30"].posicaoPilhaTopo}, vazios=${quadros["30"].vazias}/${quadros["30"].total}, donos=${JSON.stringify(quadros["30"].owners)}; pilha a 80%: topo em ${quadros["80"].posicaoPilhaTopo}, vazios=${quadros["80"].vazias}/${quadros["80"].total}, donos=${JSON.stringify(quadros["80"].owners)}`, { geo, quadros });
  await ctx.close();
}

await nav.close();
writeFileSync(`${OUT}/resultado.json`, JSON.stringify(resultados, null, 2));
const falhas = resultados.filter((r) => !r.ok).map((r) => r.id);
console.log(`\n${resultados.length - falhas.length}/${resultados.length} ok${falhas.length ? `; falhas: ${falhas.join(", ")}` : ""}`);
process.exit(falhas.length ? 1 : 0);
