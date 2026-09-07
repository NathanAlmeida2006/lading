/**
 * Verificacao automatizada dos requisitos nao funcionais que dao para medir.
 *
 * Cobre RNF-L09 (contraste), RNF-L11 (foco), RNF-L12 (zoom a 200%),
 * RNF-L13 (movimento reduzido), RNF-L16 (legivel sem JavaScript), RNF-L35
 * (nada preso invisivel), o manifesto, o odometro e a doca, nos DOIS temas,
 * porque o RNF-L18 nao admite componente que so existe no escuro.
 *
 * O que ele NAO cobre continua sendo trabalho de olho: os 16 testes de
 * rejeicao de `extracao-pontos-negativos.md` §8 e a prova visual em tamanho
 * real do RNF-L22. Passar aqui nao aprova a peca; reprovar aqui reprova.
 *
 *   npm run build && npx vite preview --port 4173 &
 *   npm run verificar
 *
 * Precisa de `playwright-core` e de um Chromium. Nao entra em dependencies
 * porque nao vai para o build: e ferramenta de conferencia, nao da pagina.
 */
let chromium;
try {
  ({ chromium } = await import("playwright-core"));
} catch {
  console.error(
    "\n  verificar  precisa de playwright-core e de um Chromium.\n" +
      "             npm i -D playwright-core\n" +
      "             CHROMIUM=/caminho/para/chrome npm run verificar\n",
  );
  process.exit(2);
}
const EXEC = process.env.CHROMIUM ?? null;
const URL = process.argv[2] ?? "http://localhost:4173/";
const nav = await chromium.launch(EXEC ? { executablePath: EXEC, headless: true } : { headless: true });
let falhou = false;
const linha = (id, ok, nota) => {
  if (!ok) falhou = true;
  console.log(`  ${id}  ${ok ? "ok      " : "FALHOU  "} ${nota}`);
};

// --- RNF-L16: legivel sem JavaScript ---------------------------------------
{
  const ctx = await nav.newContext({ javaScriptEnabled: false, viewport: { width: 360, height: 640 } });
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: "load" });
  const r = await p.evaluate(() => ({
    texto: document.body.innerText.replace(/\s+/g, " ").trim().length,
    h1: document.querySelectorAll("h1").length,
    ctas: [...document.querySelectorAll("a.botao")].map((a) => a.getAttribute("href")).filter(Boolean).length,
    escondido: [...document.querySelectorAll("[data-revelar]")].filter((e) => parseFloat(getComputedStyle(e).opacity) < 0.99).length,
  }));
  linha("RNF-L16", r.texto > 2000 && r.h1 === 1 && r.ctas >= 3 && r.escondido === 0,
    `${r.texto} caracteres de texto, ${r.ctas} CTAs com href, ${r.escondido} elementos escondidos`);
  await ctx.close();
}

// --- Contraste (RNF-L09) e zoom (RNF-L12) ----------------------------------
for (const tema of ["dark", "light"]) {
  const ctx = await nav.newContext({ viewport: { width: 360, height: 640 }, colorScheme: tema, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: "networkidle" });
  await p.click("text=Aceitar").catch(() => {});
  await p.waitForTimeout(400);

  const contraste = await p.evaluate(() => {
    const lum = (c) => {
      const [r, g, b] = c.match(/\d+(\.\d+)?/g).slice(0, 3).map((v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const fundoDe = (el) => {
      for (let n = el; n; n = n.parentElement) {
        const c = getComputedStyle(n).backgroundColor;
        if (c && !c.includes("rgba(0, 0, 0, 0)")) return c;
      }
      return getComputedStyle(document.body).backgroundColor;
    };
    const ruins = [];
    for (const el of document.querySelectorAll("p,li,h1,h2,h3,span,a,button,figcaption")) {
      const proprio = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join("").trim();
      if (!proprio) continue;
      const e = getComputedStyle(el);
      if (parseFloat(e.opacity) < 0.99) continue;
      if (el.closest('[aria-hidden="true"]')) continue;
      const tam = parseFloat(e.fontSize);
      const peso = parseInt(e.fontWeight, 10) || 400;
      const grande = tam >= 24 || (tam >= 18.66 && peso >= 700);
      // Texto em contorno (`-webkit-text-stroke`) nao tem preenchimento: o que
      // se ve e o traco, e e o traco que se mede.
      const cor = parseFloat(e.getPropertyValue("-webkit-text-stroke-width")) > 0 ? e.getPropertyValue("-webkit-text-stroke-color") : e.color;
      const a = lum(cor), b = lum(fundoDe(el));
      const razao = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      const exigido = grande ? 3 : 4.5;
      if (razao < exigido) {
        ruins.push(`${proprio.slice(0, 26)} ${razao.toFixed(2)}:1 < ${exigido} · ${cor} sobre ${fundoDe(el)} · ${tam}px/${peso} · <${el.tagName.toLowerCase()} class="${el.className}">`);
      }
    }
    return ruins;
  });
  linha("RNF-L09", contraste.length === 0, `tema ${tema}: ${contraste.length} pares abaixo do minimo`);
  contraste.slice(0, 4).forEach((c) => console.log("            " + c));

  // Zoom de texto a 200% sem quebra de layout.
  await p.evaluate(() => { document.documentElement.style.fontSize = "32px"; });
  await p.waitForTimeout(300);
  const zoom = await p.evaluate(() => ({
    estouro: document.documentElement.scrollWidth - window.innerWidth,
    cortados: [...document.querySelectorAll(".botao, .objecao__botao")]
      .filter((e) => e.scrollWidth > e.clientWidth + 2).length,
  }));
  linha("RNF-L12", zoom.estouro <= 1 && zoom.cortados === 0,
    `tema ${tema}: estouro horizontal ${zoom.estouro}px, ${zoom.cortados} controles cortados`);
  await ctx.close();
}

// --- RNF-L13: prefers-reduced-motion ---------------------------------------
{
  const ctx = await nav.newContext({ viewport: { width: 360, height: 640 }, reducedMotion: "reduce", isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: "networkidle" });
  await p.click("text=Aceitar").catch(() => {});
  const h = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 300) { await p.evaluate((v) => window.scrollTo({ top: v, behavior: "instant" }), y); await p.waitForTimeout(70); }
  await p.waitForTimeout(900);
  const r = await p.evaluate(() => ({
    escondido: [...document.querySelectorAll("[data-revelar]")].filter((e) => parseFloat(getComputedStyle(e).opacity) < 0.99).length,
    quais: [...document.querySelectorAll("[data-revelar]")].filter((e) => parseFloat(getComputedStyle(e).opacity) < 0.99).slice(0, 6).map((e) => `${e.tagName.toLowerCase()}.${e.className.split(" ")[0]}`),
    transformados: [...document.querySelectorAll("[data-revelar]")].filter((e) => {
      const t = getComputedStyle(e).transform;
      return t && t !== "none" && !t.includes("1, 0, 0, 1, 0, 0");
    }).length,
  }));
  linha("RNF-L13", r.escondido === 0 && r.transformados === 0,
    `${r.escondido} escondidos, ${r.transformados} ainda com transform residual`);
  if (r.quais.length) console.log("            " + r.quais.join(", "));
  await ctx.close();
}

// --- RNF-L01 e RNF-L02: LCP e CLS -----------------------------------------
{
  const ctx = await nav.newContext({ viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.addInitScript(() => {
    window.__cls = 0;
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
    window.__lcp = 0;
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) window.__lcp = e.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
  });
  await p.goto(URL, { waitUntil: "networkidle" });
  await p.waitForTimeout(2200);
  const r = await p.evaluate(() => ({ cls: window.__cls, lcp: Math.round(window.__lcp) }));
  linha("RNF-L02", r.cls <= 0.1, `CLS ${r.cls.toFixed(4)} (teto 0,1)`);
  // O LCP aqui e local, sem rede lenta: serve de vigia de regressao, nao de
  // aprovacao. O numero do RNF-L01 sai do Lighthouse em 4G simulado.
  console.log(
    r.lcp > 0
      ? `  RNF-L01  medida    LCP local ${r.lcp} ms (o teto de 2,5 s vale em 4G simulado)`
      : "  RNF-L01  medida    LCP nao capturado nesta execucao (medir no Lighthouse)",
  );
  await ctx.close();
}

// --- RNF-L35: nenhum elemento preso invisivel ------------------------------
{
  const ctx = await nav.newContext({ viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: "networkidle" });
  await p.click("text=Aceitar").catch(() => {});
  const altura = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < altura; y += 300) {
    await p.evaluate((v) => window.scrollTo({ top: v, behavior: "instant" }), y);
    await p.waitForTimeout(70);
  }
  await p.waitForTimeout(1200);
  const preso = await p.evaluate(() => ({
    opacos: [...document.querySelectorAll("[data-revelar]")]
      .filter((e) => parseFloat(getComputedStyle(e).opacity) < 0.99).length,
    quais: [...document.querySelectorAll("[data-revelar]")]
      .filter((e) => parseFloat(getComputedStyle(e).opacity) < 0.99).slice(0, 6).map((e) => `${e.tagName.toLowerCase()}.${e.className.split(" ")[0]}`),
    // Titulo com mascara falha de outro jeito: o pai fica em `opacity: 1` e
    // sao as LINHAS que ficam paradas fora do recorte, invisiveis. Olhar so a
    // opacidade do pai relata "tudo bem" com o titulo sumido, e foi assim que
    // um seletor errado na rede do RNF-L35 passou despercebido.
    linhas: [...document.querySelectorAll("[data-line]")].filter((e) => {
      const t = getComputedStyle(e).transform;
      return t && t !== "none" && !t.endsWith(", 0)");
    }).length,
  }));
  linha("RNF-L35", preso.opacos === 0 && preso.linhas === 0,
    `${preso.opacos} elementos e ${preso.linhas} linhas de titulo presos apos rolagem completa`);
  if (preso.quais.length) console.log("            " + preso.quais.join(", "));
  await ctx.close();
}

// --- RNF-L11: foco visivel por teclado -------------------------------------
{
  const ctx = await nav.newContext({ viewport: { width: 1024, height: 800 } });
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: "networkidle" });
  const semAnel = await p.evaluate(async () => {
    // So o que esta na tela: a doca fora de cena e `display: none` e nao
    // recebe foco, entao medir o anel dela e medir o nada.
    const foco = [...document.querySelectorAll("a[href],button")].filter((el) => el.offsetParent !== null);
    const ruins = [];
    for (const el of foco) {
      el.focus();
      const e = getComputedStyle(el);
      const temAnel = (e.outlineStyle !== "none" && parseFloat(e.outlineWidth) >= 1) || e.boxShadow !== "none";
      if (!temAnel) ruins.push(el.textContent.trim().slice(0, 24) || el.tagName);
    }
    return { total: foco.length, ruins };
  });
  linha("RNF-L11", semAnel.ruins.length === 0, `${semAnel.total} elementos focaveis, ${semAnel.ruins.length} sem anel`);
  await ctx.close();
}

// --- MAN-01 e SEM-01: manifesto e regua das doze semanas -------------------
// Os dois efeitos ligados a rolagem. O que se mede e o ESTADO FINAL, que e o
// unico que nao pode falhar: palavra que nao acendeu e texto invisivel, e
// regua que nao chegou a 12 e progresso medido errado (RF-L11b).
{
  const ctx = await nav.newContext({ viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: "networkidle" });
  await p.click("text=Aceitar").catch(() => {});

  // Rolar ate o FIM da secao do mapa, em passos, para o `onScroll` acompanhar
  // (ele sincroniza por quadro, nao por salto).
  const alvo = await p.evaluate(() => {
    const s = document.getElementById("mapa");
    return s.offsetTop + s.offsetHeight - window.innerHeight;
  });
  for (let y = 0; y <= alvo; y += 240) {
    await p.evaluate((v) => window.scrollTo({ top: v, behavior: "instant" }), y);
    await p.waitForTimeout(40);
  }
  await p.evaluate((v) => window.scrollTo({ top: v, behavior: "instant" }), alvo);
  // 1,5 s, e nao 700 ms: quem chega rolando rapido dispara pela varredura, que
  // acorda 120 ms depois da ultima rolagem, e a subida das linhas leva 820 ms
  // mais o escalonamento. Medir aos 700 ms pega a animacao no meio do voo e
  // relata linha presa onde nao ha nenhuma.
  await p.waitForTimeout(1500);

  const r = await p.evaluate(() => ({
    acesas: document.querySelectorAll(".regua12__semana--acesa").length,
    semanas: document.querySelectorAll(".regua12__semana").length,
    slides: document.querySelectorAll(".slide").length,
    linhas: [...document.querySelectorAll(".semanas__titulo .linha__texto")].filter((e) => {
      const t = getComputedStyle(e).transform;
      return t && t !== "none" && !t.endsWith(", 0)");
    }).length,
    apagadas: [...document.querySelectorAll("#reconhecimento .palavra")].filter((e) => !e.classList.contains("palavra--acesa")).length,
  }));

  linha("MAN-01", r.apagadas === 0, `${r.apagadas} palavras do manifesto ainda apagadas depois de passar por ele`);
  linha("SEM-01", r.acesas === 12 && r.semanas === 12 && r.slides === 5 && r.linhas === 0,
    `${r.acesas} de ${r.semanas} semanas acesas, ${r.slides} cards, ${r.linhas} linhas de titulo presas`);
  await ctx.close();
}

// --- PRV-01: a prova acende e o campo de pontos existe ---------------------
// O estado final e o unico que nao pode falhar: palavra que nao acendeu e
// texto invisivel. O campo e ornamento, entao o que se mede dele e que ele
// existe, cobre a secao e NAO recebe evento de ponteiro.
{
  const ctx = await nav.newContext({ viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: "networkidle" });
  await p.click("text=Aceitar").catch(() => {});
  const alvo = await p.evaluate(() => {
    const s = document.getElementById("prova");
    return s.offsetTop + s.offsetHeight - window.innerHeight;
  });
  for (let y = 0; y <= alvo; y += 240) {
    await p.evaluate((v) => window.scrollTo({ top: v, behavior: "instant" }), y);
    await p.waitForTimeout(40);
  }
  await p.evaluate((v) => window.scrollTo({ top: v, behavior: "instant" }), alvo);
  await p.waitForTimeout(1200);
  const r = await p.evaluate(() => {
    const campo = document.querySelector(".prova .campo");
    const secao = document.getElementById("prova");
    const cr = campo?.getBoundingClientRect();
    const sr = secao.getBoundingClientRect();
    return {
      apagadas: [...document.querySelectorAll(".prova .palavra")].filter((e) => !e.classList.contains("palavra--acesa")).length,
      campo: !!campo,
      cobre: cr && Math.abs(cr.width - sr.width) < 2,
      inerte: campo ? getComputedStyle(campo).pointerEvents === "none" : false,
      pintou: campo ? campo.width > 0 && campo.height > 0 : false,
    };
  });
  linha("PRV-01", r.apagadas === 0 && r.campo && r.cobre && r.inerte && r.pintou,
    `${r.apagadas} palavras apagadas; campo presente: ${r.campo}, cobrindo: ${r.cobre}, inerte: ${r.inerte}, com area: ${r.pintou}`);
  await ctx.close();
}

// --- DOC-01: a doca entra depois da dobra e sai no fechamento --------------
{
  const ctx = await nav.newContext({ viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: "networkidle" });
  await p.click("text=Aceitar").catch(() => {});
  const noTopo = await p.evaluate(() => document.querySelector(".doca")?.classList.contains("doca--ativa"));
  await p.evaluate(() => window.scrollTo({ top: document.getElementById("oferta").offsetTop, behavior: "instant" }));
  await p.waitForTimeout(400);
  const noMeio = await p.evaluate(() => document.querySelector(".doca")?.classList.contains("doca--ativa"));
  await p.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
  await p.waitForTimeout(400);
  const noFim = await p.evaluate(() => document.querySelector(".doca")?.classList.contains("doca--ativa"));
  linha("DOC-01", noTopo === false && noMeio === true && noFim === false,
    `doca no topo: ${noTopo}, na oferta: ${noMeio}, no fechamento: ${noFim}`);
  await ctx.close();
}

// --- INT-01: a cortina de introducao -----------------------------------------
// A cortina tem que estar na tela na primeira pintura, sumir sozinha em menos
// de 4 s, e VOLTAR na recarga (toda carga tem cortina). Sob movimento reduzido
// ela nao pode existir.
{
  const ctx = await nav.newContext({ viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: "commit" });
  await p.waitForTimeout(150);
  const naEntrada = await p.evaluate(() => getComputedStyle(document.querySelector(".intro")).display !== "none");
  await p.waitForTimeout(3800);
  const depois = await p.evaluate(() => getComputedStyle(document.querySelector(".intro")).display === "none");
  await p.reload({ waitUntil: "commit" });
  await p.waitForTimeout(150);
  const naRecarga = await p.evaluate(() => getComputedStyle(document.querySelector(".intro")).display !== "none");
  await ctx.close();
  const ctx2 = await nav.newContext({ viewport: { width: 360, height: 640 }, reducedMotion: "reduce" });
  const p2 = await ctx2.newPage();
  await p2.goto(URL, { waitUntil: "commit" });
  await p2.waitForTimeout(150);
  const reduzido = await p2.evaluate(() => getComputedStyle(document.querySelector(".intro")).display === "none");
  await ctx2.close();
  linha("INT-01", naEntrada && depois && naRecarga && reduzido,
    `cortina na entrada: ${naEntrada}, sumiu em 4 s: ${depois}, presente na recarga: ${naRecarga}, ausente com movimento reduzido: ${reduzido}`);
}

await nav.close();
if (falhou) process.exit(1);
