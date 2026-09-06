/**
 * Verificacao automatizada dos requisitos nao funcionais que dao para medir.
 *
 * Cobre RNF-L09 (contraste), RNF-L11 (foco), RNF-L12 (zoom a 200%),
 * RNF-L13 (movimento reduzido) e RNF-L16 (legivel sem JavaScript), nos DOIS
 * temas, porque o RNF-L18 nao admite componente que so existe no escuro.
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
  linha("RNF-L16", r.texto > 2000 && r.h1 === 1 && r.ctas === 3 && r.escondido === 0,
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
      const a = lum(e.color), b = lum(fundoDe(el));
      const razao = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      const exigido = grande ? 3 : 4.5;
      if (razao < exigido) {
        ruins.push(`${proprio.slice(0, 26)} ${razao.toFixed(2)}:1 < ${exigido} · ${e.color} sobre ${fundoDe(el)} · ${tam}px/${peso} · <${el.tagName.toLowerCase()} class="${el.className}">`);
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
    transformados: [...document.querySelectorAll("[data-revelar]")].filter((e) => {
      const t = getComputedStyle(e).transform;
      return t && t !== "none" && !t.includes("1, 0, 0, 1, 0, 0");
    }).length,
  }));
  linha("RNF-L13", r.escondido === 0 && r.transformados === 0,
    `${r.escondido} escondidos, ${r.transformados} ainda com transform residual`);
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
  await ctx.close();
}

// --- RNF-L11: foco visivel por teclado -------------------------------------
{
  const ctx = await nav.newContext({ viewport: { width: 1024, height: 800 } });
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: "networkidle" });
  const semAnel = await p.evaluate(async () => {
    const foco = [...document.querySelectorAll("a[href],button")];
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

// --- CAP-01 e CAP-02: capitulos travados -----------------------------------
// A mecanica se le da GEOMETRIA, nunca de classe, em duas propriedades:
//
//   1. O CONTRATO DE GRUDE (deterministico, lido do estilo computado, sem
//      depender de instante de rolagem): um painel grudado num topo nao
//      negativo tem que caber entre esse topo e a dobra. Se nao cabe, ele tem
//      que ter topo negativo - ou seja, ser mais alto que a tela e grudar pelo
//      rodape em vez de pelo topo. Painel alto grudado por topo nao negativo
//      esconde o proprio rodape, que e o defeito que o RNF-L16 proibe. Medir
//      isto no FIM do trilho nao serve: la o painel alto ja desgrudou, e a
//      posicao dele passa a ser ditada pelo bloco de contencao, nao pelo
//      `top` - um `top` quebrado e um `top` certo dao o mesmo numero nesse
//      instante.
//   2. A PERMANENCIA NA JANELA no fim do trilho: e o que distingue acumulo de
//      substituicao. Um painel substituido rolou inteiro para fora, e o
//      rodape dele (`bottom`) esta acima do topo da janela, ou o topo
//      (`top`) esta abaixo da base dela. Topo negativo sozinho NAO e sinal de
//      falha - e o comportamento correto de painel mais alto que a tela.
//
// E a caixa nunca apaga: quem recua e o conteudo (RNF-L35).
{
  const ctx = await nav.newContext({ viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: "networkidle" });
  await p.click("text=Aceitar").catch(() => {});

  const ids = await p.evaluate(() =>
    [...document.querySelectorAll("[data-capitulo]")].map((s) => s.id),
  );

  const falhas = [];
  for (const id of ids) {
    // O contrato de grude, lido do estilo computado. E deterministico e nao
    // depende de instante de rolagem, ao contrario da geometria no fim do
    // trilho: la o painel alto JA DESGRUDOU, e a posicao dele passa a ser
    // ditada pelo bloco de contencao. Medir so ali da o mesmo numero para o
    // CSS certo e para o errado.
    const contrato = await p.evaluate((alvo) => {
      const secao = document.getElementById(alvo);
      return [...secao.querySelectorAll(".painel-cap")].map((el, i) => {
        const top = parseFloat(getComputedStyle(el).top) || 0;
        const alto = el.offsetHeight;
        // Cabe entre o proprio topo e a dobra, OU e mais alto que a tela e
        // gruda pelo rodape (topo negativo). Painel alto grudado por topo nao
        // negativo esconde o proprio rodape, que e o defeito que o RNF-L16
        // proibe.
        const ok = top + alto <= window.innerHeight + 1 || (top < 0 && alto > window.innerHeight);
        return { i, top: Math.round(top), alto, ok };
      });
    }, id);
    for (const c of contrato) {
      if (!c.ok) falhas.push(`${id}: painel ${c.i} grudaria em top ${c.top} com ${c.alto}px de altura, escondendo o proprio rodape`);
    }

    // Rolar ate o FIM do trilho do capitulo: e la que o acumulo esta completo.
    await p.evaluate((alvo) => {
      const secao = document.getElementById(alvo);
      window.scrollTo({ top: secao.offsetTop + secao.offsetHeight - window.innerHeight - 8, behavior: "instant" });
    }, id);
    await p.waitForTimeout(500);

    const r = await p.evaluate((alvo) => {
      const secao = document.getElementById(alvo);
      const paineis = [...secao.querySelectorAll(".painel-cap")];
      return {
        total: paineis.length,
        foraDaJanela: paineis.filter((el) => {
          const rect = el.getBoundingClientRect();
          // Acumular e CONTINUAR NA TELA no fim do trilho. Um painel
          // SUBSTITUIDO teria rolado inteiro para fora, e o rodape dele estaria
          // acima do topo da janela. Painel mais alto que a tela gruda pelo
          // rodape e tem topo negativo de proposito: medir o topo reprovaria o
          // caso certo.
          return rect.bottom <= 0 || rect.top >= window.innerHeight;
        }).length,
        caixaApagada: paineis.filter((el) => {
          const caixa = el.querySelector(".painel-cap__caixa");
          return caixa && parseFloat(getComputedStyle(caixa).opacity) < 0.99;
        }).length,
      };
    }, id);

    if (r.total < 2) falhas.push(`${id}: ${r.total} paineis, minimo 2`);
    if (r.foraDaJanela > 0) falhas.push(`${id}: ${r.foraDaJanela} paineis sairam da janela (substituiu em vez de acumular)`);
    if (r.caixaApagada > 0) falhas.push(`${id}: ${r.caixaApagada} caixas apagadas (o recuo vai no conteudo, nao na caixa)`);
  }

  linha("CAP-01", ids.length > 0 && falhas.length === 0,
    `${ids.length} capitulos, ${falhas.length} falhas de mecanica`);
  falhas.slice(0, 4).forEach((f) => console.log("            " + f));

  const esperados = ["o-que-e", "mapa", "prova"];
  const faltando = esperados.filter((e) => !ids.includes(e));
  linha("CAP-02", faltando.length === 0,
    faltando.length ? `faltam: ${faltando.join(", ")}` : "os tres capitulos da etapa E1 estao no ar");
  await ctx.close();
}

await nav.close();
if (falhou) process.exit(1);
