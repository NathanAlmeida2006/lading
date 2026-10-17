/**
 * Verificacao automatizada dos requisitos nao funcionais que dao para medir.
 *
 * Cobre RNF-L09 (contraste), RNF-L11 (foco), RNF-L12 (reflow em 320, 360,
 * 1024 e 1280px), RNF-L13 (movimento reduzido), RNF-L16 (legivel sem
 * JavaScript), RNF-L35 (nada preso invisivel), o manifesto, a regua das
 * semanas, a pilha do espelho e a doca. Os dois temas (Sigilo e
 * Cartaz) estao na mesma pagina, e uma leitura cobre os dois.
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
import { conteudo } from "../src/conteudo.js";
import { secoesPorId } from "../src/secoes.js";

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
const ALVO = process.argv[2] ?? "http://localhost:4173/";
const nav = await chromium.launch(EXEC ? { executablePath: EXEC, headless: true } : { headless: true });
// Execução local de qualidade: nenhum contexto envia tráfego para terceiros.
const criarContexto = nav.newContext.bind(nav);
nav.newContext = async (...args) => {
  const ctx = await criarContexto(...args);
  await ctx.route("**/*", (rota) => {
    const url = new URL(rota.request().url());
    return url.origin === new URL(ALVO).origin || ["data:", "blob:"].includes(url.protocol)
      ? rota.continue() : rota.abort();
  });
  return ctx;
};
let falhou = false;
const linha = (id, ok, nota) => {
  if (!ok) falhou = true;
  console.log(`  ${id}  ${ok ? "ok      " : "FALHOU  "} ${nota}`);
};

// --- RNF-L16: legivel sem JavaScript ---------------------------------------
{
  const ctx = await nav.newContext({ javaScriptEnabled: false, viewport: { width: 360, height: 640 } });
  const p = await ctx.newPage();
  await p.goto(ALVO, { waitUntil: "load" });
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

// --- Contraste (RNF-L09) ---------------------------------------------------
// Uma passada so: a pagina NAO segue o tema do sistema (ver o comentario do index.html), e os dois
// modos, Sigilo e Cartaz, estao na mesma pagina, entao uma leitura cobre os dois.
//
// ACEITOS: excecoes de contraste aceitas pelo usuario porque trocar a cor mudaria o desenho. Os dois
// termos aceitos em 02/10/2026 ("Regra do 12", "portao da fase 3") sairam da pagina. Entra aqui so o
// que o usuario aceitar de novo.
const ACEITOS = [];
{
  const ctx = await nav.newContext({ viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.goto(ALVO, { waitUntil: "networkidle" });
  await p.click("text=Aceitar").catch(() => {});
  await p.waitForTimeout(400);

  const { ruins: contraste, aceitos } = await p.evaluate((liberados) => {
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
    const aceitos = [];
    for (const el of document.querySelectorAll("p,li,h1,h2,h3,span,a,button,figcaption,strong,b,s,dt,dd")) {
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
        if (el.tagName === "STRONG" && liberados.includes(proprio)) {
          aceitos.push(proprio);
          continue;
        }
        ruins.push(`${proprio.slice(0, 26)} ${razao.toFixed(2)}:1 < ${exigido} · ${cor} sobre ${fundoDe(el)} · ${tam}px/${peso} · <${el.tagName.toLowerCase()} class="${el.className}">`);
      }
    }
    return { ruins, aceitos };
  }, ACEITOS);
  linha("RNF-L09", contraste.length === 0,
    `${contraste.length} pares abaixo do minimo` + (aceitos.length ? ` (mais ${aceitos.length} aceitos: ${aceitos.join(", ")})` : ""));
  contraste.forEach((c) => console.log("            " + c));
  await ctx.close();
}

// --- RNF-L12: reflow, sem quebra de layout ---------------------------------
// A pagina e toda em px, entao mudar o `font-size` do <html> nao mexe em nada (era o que este teste
// fazia, e ele passava sempre). O que mexe e a LARGURA da janela: 320px e o piso do WCAG 1.4.10
// (400% de zoom em 1280px), e 1024 e 1280 sao onde as colunas da oferta e do rodape mais estreitam.
{
  const quebras = [];
  for (const [w, h] of [[320, 568], [360, 640], [1024, 768], [1280, 720]]) {
    const ctx = await nav.newContext({ viewport: { width: w, height: h }, isMobile: w < 640, hasTouch: w < 640 });
    const p = await ctx.newPage();
    await p.goto(ALVO, { waitUntil: "networkidle" });
    await p.click("text=Aceitar").catch(() => {});
    await p.waitForTimeout(400);
    const r = await p.evaluate(() => {
      const botoes = [...document.querySelectorAll(".botao")];
      const dono = (b) => b.dataset.posicao;
      return {
        estouro: document.documentElement.scrollWidth - window.innerWidth,
        // O botao sangra para fora da coluna em que mora.
        sangrando: botoes.filter((b) => b.getBoundingClientRect().right > b.parentElement.getBoundingClientRect().right + 1).map(dono),
        // O rotulo quebra de linha e o recorte de 1em corta a segunda.
        cortados: botoes
          .filter((b) => {
            const rolo = b.querySelector(".botao__rolo");
            return rolo.firstElementChild.getBoundingClientRect().height > rolo.getBoundingClientRect().height * 1.5;
          })
          .map(dono),
      };
    });
    if (r.estouro > 1) quebras.push(`${w}px: estouro horizontal de ${r.estouro}px`);
    if (r.sangrando.length) quebras.push(`${w}px: botao fora da coluna (${r.sangrando.join(", ")})`);
    if (r.cortados.length) quebras.push(`${w}px: rotulo cortado (${r.cortados.join(", ")})`);
    await ctx.close();
  }
  linha("RNF-L12", quebras.length === 0,
    quebras.length ? quebras.join("; ") : "320, 360, 1024 e 1280px: sem estouro, sem botao fora da coluna, sem rotulo cortado");
}

// --- RNF-L13: prefers-reduced-motion ---------------------------------------
{
  const ctx = await nav.newContext({ viewport: { width: 360, height: 640 }, reducedMotion: "reduce", isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.goto(ALVO, { waitUntil: "networkidle" });
  await p.click("text=Aceitar").catch(() => {});
  // O chunk instala o estado inicial de revelação após a hidratação.
  // Varrer antes dessa instalação pode medir uma ordem de eventos diferente.
  await p.evaluate(() => document.fonts.ready);
  await p.waitForFunction(() => document.documentElement.classList.contains("pronto") &&
    (document.documentElement.classList.contains("movimento-pronto") || document.documentElement.classList.contains("movimento-falhou")), null, { timeout: 5000 });
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
  await p.goto(ALVO, { waitUntil: "networkidle" });
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
  await p.goto(ALVO, { waitUntil: "networkidle" });
  await p.click("text=Aceitar").catch(() => {});
  const altura = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < altura; y += 300) {
    await p.evaluate((v) => window.scrollTo({ top: v, behavior: "instant" }), y);
    await p.waitForTimeout(70);
  }
  await p.waitForTimeout(1200);
  // Uma revelação pode interromper quando sai da viewport. Só é presa se
  // continuar invisível ao revisitar seu conteúdo; não medir resíduo fora dela.
  const candidatos = await p.evaluate(() => [...document.querySelectorAll("[data-revelar]")]
    .flatMap((e, indice) => parseFloat(getComputedStyle(e).opacity) < 0.99 ? [indice] : []));
  const presosRevisitados = [];
  for (const indice of candidatos) {
    const elemento = p.locator("[data-revelar]").nth(indice);
    await elemento.evaluate((e) => window.scrollTo({ top: e.getBoundingClientRect().top + scrollY - innerHeight / 2, behavior: "instant" }));
    try {
      await p.waitForFunction((indice) => parseFloat(getComputedStyle(document.querySelectorAll("[data-revelar]")[indice]).opacity) >= 0.99,
        indice, { timeout: 2500 });
    } catch {
      presosRevisitados.push(indice);
    }
  }
  const preso = await p.evaluate(() => ({
    opacos: [...document.querySelectorAll("[data-revelar]")]
      .filter((e) => parseFloat(getComputedStyle(e).opacity) < 0.99).length,
    quais: [...document.querySelectorAll("[data-revelar]")]
      .filter((e) => parseFloat(getComputedStyle(e).opacity) < 0.99).slice(0, 6).map((e) => {
        const r = e.getBoundingClientRect();
        return JSON.stringify({ seletor: `${e.tagName.toLowerCase()}.${e.className.split(" ")[0]}`,
          secao: e.closest("section")?.id, top: r.top, bottom: r.bottom,
          opacity: getComputedStyle(e).opacity, texto: e.textContent.trim().slice(0, 120) });
      }),
    // Titulo com mascara falha de outro jeito: o pai fica em `opacity: 1` e
    // sao as LINHAS que ficam paradas fora do recorte, invisiveis. Olhar so a
    // opacidade do pai relata "tudo bem" com o titulo sumido, e foi assim que
    // um seletor errado na rede do RNF-L35 passou despercebido.
    linhas: [...document.querySelectorAll("[data-line]")].filter((e) => {
      const t = getComputedStyle(e).transform;
      return t && t !== "none" && !t.endsWith(", 0)");
    }).length,
  }));
  linha("RNF-L35", presosRevisitados.length === 0 && preso.linhas === 0,
    `${candidatos.length} candidatos fora da tela; ${presosRevisitados.length} elementos presos ao revisitar e ${preso.linhas} linhas de titulo presas`);
  if (preso.quais.length) console.log("            " + preso.quais.join(", "));
  await ctx.close();
}

// --- RNF-L11: foco visivel por teclado -------------------------------------
{
  const ctx = await nav.newContext({ viewport: { width: 1024, height: 800 } });
  const p = await ctx.newPage();
  await p.goto(ALVO, { waitUntil: "networkidle" });
  await p.waitForFunction(() => document.documentElement.classList.contains("pronto"));
  await p.getByRole("button", { name: "Recusar", exact: true }).click();
  const semAnel = { total: 0, ruins: [], menu: 0 };
  let abriu = false, fechou = false;
  for (let passo = 0; passo < 70; passo++) {
    await p.keyboard.press("Tab");
    const foco = await p.evaluate(() => {
      const el = document.activeElement, e = getComputedStyle(el);
      const sombra = e.boxShadow.replace(/rgba?\([^)]*\)/g, "").trim().split(/\s+/).map(parseFloat);
      const anelSombra = !e.boxShadow.includes("inset") && sombra.length === 4 &&
        sombra[0] === 0 && sombra[1] === 0 && sombra[2] === 0 && sombra[3] >= 2;
      return { tag: el.tagName, nome: el.getAttribute("aria-label") || el.textContent.trim().slice(0, 32),
        menu: !!el.closest("#menu"), link: el.tagName === "A",
        anel: (e.outlineStyle !== "none" && parseFloat(e.outlineWidth) >= 2) || anelSombra };
    });
    if (foco.tag === "BODY") break;
    semAnel.total++;
    if (!foco.anel) semAnel.ruins.push(foco.nome || foco.tag);
    if (!abriu && foco.nome === "Abrir menu") {
      await p.keyboard.press("Enter");
      await p.waitForFunction(() => !document.getElementById("menu").inert);
      abriu = true;
    } else if (foco.menu && foco.link) {
      semAnel.menu++;
      const esperado = await p.locator("#menu a").count();
      if (semAnel.menu === esperado) {
        await p.keyboard.press("Escape");
        await p.waitForFunction(() => document.getElementById("menu").inert);
        fechou = true;
      }
    }
  }
  linha("RNF-L11", semAnel.ruins.length === 0 && abriu && fechou && semAnel.menu > 0,
    `${semAnel.total} focos via Tab, ${semAnel.menu} links de menu aberto, ${semAnel.ruins.length} sem anel de 2px`);
  semAnel.ruins.forEach((texto) => console.log("            " + texto));
  await ctx.close();
}

// --- MAN-01 e SEM-01: manifesto e regua do mapa ------------------------------
// Os dois efeitos ligados a rolagem. O que se mede e o ESTADO FINAL, que e o
// unico que nao pode falhar: palavra que nao acendeu e texto invisivel, e
// regua que nao chegou ao fim e progresso medido errado (RF-L11b).
{
  const ctx = await nav.newContext({ viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.goto(ALVO, { waitUntil: "networkidle" });
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
    acesas: document.querySelectorAll(".regua12__semana[data-acesa]").length,
    semanas: document.querySelectorAll(".regua12__semana").length,
    slides: document.querySelectorAll(".slide").length,
    linhas: [...document.querySelectorAll(".semanas__titulo .linha__texto")].filter((e) => {
      const t = getComputedStyle(e).transform;
      return t && t !== "none" && !t.endsWith(", 0)");
    }).length,
    apagadas: [...document.querySelectorAll("#reconhecimento .palavra")].filter((e) => !e.hasAttribute("data-acesa")).length,
  }));

  linha("MAN-01", r.apagadas === 0, `${r.apagadas} palavras do manifesto ainda apagadas depois de passar por ele`);
  const passos = conteudo.mapa.estados.length;
  linha("SEM-01", r.acesas === passos && r.semanas === passos && r.slides === passos && r.linhas === 0,
    `${r.acesas} de ${r.semanas} passos acesos, ${r.slides} cards (esperados ${passos}), ${r.linhas} linhas de titulo presas`);
  await ctx.close();
}

// --- PRV-01: a prova acende; ornamento não aprova a decisão TR-03 ----------
// Conteúdo deve permanecer legível inclusive com fallback sem campo.
{
  const ctx = await nav.newContext({ viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.goto(ALVO, { waitUntil: "networkidle" });
  await p.click("text=Aceitar").catch(() => {});
  const alvo = await p.evaluate(() => {
    const s = document.getElementById("prova");
    return s ? s.offsetTop + s.offsetHeight - window.innerHeight : null;
  });
  if (alvo === null && !secoesPorId.prova.presente && secoesPorId.prova.justificativaAusencia) {
    console.log("  PRV-01  n/a      seção prova ausente por contrato (secoes.js, com justificativa)");
  } else if (alvo === null) {
    linha("PRV-01", false, "seção prova ausente do DOM, mas presente (ou sem justificativa) em secoes.js");
  } else {
  for (let y = 0; y <= alvo; y += 240) {
    await p.evaluate((v) => window.scrollTo({ top: v, behavior: "instant" }), y);
    await p.waitForTimeout(40);
  }
  await p.evaluate((v) => window.scrollTo({ top: v, behavior: "instant" }), alvo);
  await p.waitForTimeout(1200);
  const r = await p.evaluate(() => {
    // O campo e fatiado em ladrilhos (`canvas.campo`, dentro de `.campos`); so os que estao a ate uma
    // tela da janela tem buffer, entao "pintou" e: algum ladrilho com area. A cobertura se mede na raiz.
    const campo = document.querySelector("#prova .campo");
    const secao = document.getElementById("prova");
    const cr = document.querySelector("#prova .campos")?.getBoundingClientRect();
    const sr = secao.getBoundingClientRect();
    return {
      palavras: document.querySelectorAll("#prova .palavra").length,
      apagadas: [...document.querySelectorAll("#prova .palavra")].filter((e) => !e.hasAttribute("data-acesa")).length,
      campo: !!campo,
      cobre: cr && Math.abs(cr.width - sr.width) < 2,
      inerte: campo ? getComputedStyle(campo).pointerEvents === "none" : false,
      pintou: [...document.querySelectorAll("#prova .campo")].some((c) => c.width > 0 && c.height > 0),
    };
  });
  linha("PRV-01", r.palavras > 0 && r.apagadas === 0 && (!r.campo || r.inerte),
    `${r.apagadas} de ${r.palavras} palavras apagadas; campo presente: ${r.campo}, cobrindo: ${r.cobre}, inerte: ${r.inerte}, com area: ${r.pintou}`);
  }
  await ctx.close();
}

// TR-03 continua pendente. arquitetura-de-secoes.md:74 estabelece fallback
// sem animar pontos; presença de canvas não concede aprovação estética.
{
  const ctx = await nav.newContext({ viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.addInitScript(() => {
    window.__pinturasCampo = 0;
    const limpar = CanvasRenderingContext2D.prototype.clearRect;
    CanvasRenderingContext2D.prototype.clearRect = function (...args) {
      if (this.canvas.classList.contains("campo")) window.__pinturasCampo += 1;
      return limpar.apply(this, args);
    };
  });
  await p.goto(ALVO, { waitUntil: "networkidle" });
  await p.getByRole("button", { name: "Recusar", exact: true }).click();
  const campos = await p.locator("canvas.campo").count();
  await p.evaluate(() => { const campo = document.querySelector("canvas.campo"); if (campo) window.scrollTo({ top: campo.closest("section").offsetTop + 400, behavior: "instant" }); });
  await p.waitForTimeout(1200); // término da entrada, antes da janela de medição
  const antes = await p.evaluate(() => window.__pinturasCampo);
  await p.waitForTimeout(500); // amostra finita, sem retries, para detectar animação contínua
  const depois = await p.evaluate(() => window.__pinturasCampo);
  linha("TR-03-FALLBACK", campos === 0 || depois === antes,
    `${campos} canvases presentes; ${depois - antes} pinturas do campo em 500ms; decisão §6 pendente exige fallback sem pontos animados`);
  await ctx.close();
}

// --- DOC-01: a doca entra depois da dobra e sai no fechamento --------------
{
  const ctx = await nav.newContext({ viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.goto(ALVO, { waitUntil: "networkidle" });
  await p.click("text=Aceitar").catch(() => {});
  const noTopo = await p.evaluate(() => document.querySelector(".doca")?.hasAttribute("data-ativa"));
  await p.evaluate(() => window.scrollTo({ top: document.getElementById("oferta").offsetTop, behavior: "instant" }));
  await p.waitForTimeout(400);
  const noMeio = await p.evaluate(() => document.querySelector(".doca")?.hasAttribute("data-ativa"));
  await p.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
  await p.waitForTimeout(400);
  const noFim = await p.evaluate(() => document.querySelector(".doca")?.hasAttribute("data-ativa"));
  linha("DOC-01", noTopo === false && noMeio === true && noFim === false,
    `doca no topo: ${noTopo}, na oferta: ${noMeio}, no fechamento: ${noFim}`);
  await ctx.close();
}

// --- ESP-01: fluxo legível, CTA único e ordem preservada em telas baixas/zoom ---
// O contrato permite fluxo simples: não exige data-solta nem pilhas em alturas fixas.
{
  const quebras = [];
  for (const [w, h, zoom] of [[360, 640, false], [1024, 768, false], [320, 568, false], [740, 360, false], [360, 560, true]]) {
    const ctx = await nav.newContext({ viewport: { width: w, height: h }, reducedMotion: "reduce" });
    const p = await ctx.newPage();
    await p.goto(ALVO, { waitUntil: "networkidle" });
    if (zoom) await p.evaluate(() => {
      for (const el of document.querySelectorAll("#espelho *")) {
        if ([...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) el.style.fontSize = `${parseFloat(getComputedStyle(el).fontSize) * 2}px`;
      }
    });
    const r = await p.evaluate(() => {
      const s = document.querySelector("#espelho"), cards = [...s.querySelectorAll(".carta")];
      const boxes = cards.map(el => el.getBoundingClientRect());
      const head = s.querySelector("header").getBoundingClientRect();
      const ctas = [...s.querySelectorAll("a.botao")];
      const cta = ctas[0]?.getBoundingClientRect();
      const overlap = (a, b) => a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1;
      const ids = [...document.querySelectorAll("main section[id]")].map(el => el.id);
      return {
        cards: cards.length,
        ctas: ctas.length,
        overlap: boxes.some((box, i) => overlap(box, head) || boxes.slice(i + 1).some(other => overlap(box, other)) || (cta && overlap(box, cta))),
        overflow: s.scrollWidth > s.clientWidth + 1,
        ordem: ids.indexOf("reconhecimento") < ids.indexOf("espelho") && ids.indexOf("espelho") < ids.indexOf("o-que-e") && ids.indexOf("o-que-e") < ids.indexOf("mapa"),
        ctaDepois: cta && cta.top >= boxes.at(-1).bottom - 1,
      };
    });
    if (r.cards !== conteudo.espelho.cartas.length || r.ctas !== 1 || r.overlap || r.overflow || !r.ordem || !r.ctaDepois) quebras.push(`${w}x${h}, texto200=${zoom}: ${JSON.stringify(r)}`);
    await ctx.close();
  }
  linha("ESP-01", quebras.length === 0,
    quebras.length ? quebras.join("; ") : `${conteudo.espelho.cartas.length} cards sem sobreposição, CTA único após a lista, ordem preservada; telas baixas e texto 200%`);
}

// --- INT-01: a cortina de introducao -----------------------------------------
// A cortina tem que estar na tela na primeira pintura, sumir sozinha em menos
// de 4 s, e VOLTAR na recarga (toda carga tem cortina). Sob movimento reduzido
// ela nao pode existir.
{
  const ctx = await nav.newContext({ viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.goto(ALVO, { waitUntil: "commit" });
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
  await p2.goto(ALVO, { waitUntil: "commit" });
  await p2.waitForTimeout(150);
  const reduzido = await p2.evaluate(() => getComputedStyle(document.querySelector(".intro")).display === "none");
  await ctx2.close();
  linha("INT-01", naEntrada && depois && naRecarga && reduzido,
    `cortina na entrada: ${naEntrada}, sumiu em 4 s: ${depois}, presente na recarga: ${naRecarga}, ausente com movimento reduzido: ${reduzido}`);
}

await nav.close();
if (falhou) process.exit(1);
