// Consentimento, assinantes e registro do checkout (src/infra/instrumentation.js). Cada cenario usa um import fresco (?c=n), com estado proprio.
import { test } from "node:test";
import assert from "node:assert/strict";
import { CONFIG } from "../../src/infra/config.js";

const href = new URL("../../src/infra/instrumentation.js", import.meta.url).href;
let cenario = 0;
const fresco = () => import(`${href}?c=${++cenario}`);

test("readConsent comeca null sem window (sessionStorage falha calado)", async () => {
  const m = await fresco();
  assert.equal(m.readConsent(), null);
});

test("answerConsent(true) faz readConsent devolver true", async () => {
  const m = await fresco();
  m.answerConsent(true);
  assert.equal(m.readConsent(), true);
});

test("answerConsent(false) faz readConsent devolver false", async () => {
  const m = await fresco();
  m.answerConsent(false);
  assert.equal(m.readConsent(), false);
});

test("valor nao booleano (sim) conta como recusa: devolve false", async () => {
  const m = await fresco();
  m.answerConsent("sim");
  assert.equal(m.readConsent(), false);
});

test("assinantes sao chamados na resposta, uma vez cada", async () => {
  const m = await fresco();
  let a = 0;
  let b = 0;
  m.subscribeToConsent(() => a++);
  m.subscribeToConsent(() => b++);
  m.answerConsent(true);
  assert.equal(a, 1);
  assert.equal(b, 1);
});

test("o cancelamento devolvido por subscribeToConsent impede a chamada", async () => {
  const m = await fresco();
  let chamadas = 0;
  const cancelar = m.subscribeToConsent(() => chamadas++);
  cancelar();
  m.answerConsent(true);
  assert.equal(chamadas, 0);
});

test("assinante que lanca nao derruba os outros: o erro vai para console.error e o seguinte roda", async () => {
  const m = await fresco();
  const original = console.error;
  const erros = [];
  let seguinte = 0;
  console.error = (erro) => erros.push(erro);
  try {
    m.subscribeToConsent(() => { throw new Error("falha do assinante"); });
    m.subscribeToConsent(() => seguinte++);
    m.answerConsent(true);
  } finally {
    console.error = original;
  }
  assert.equal(erros.length, 1);
  assert.equal(seguinte, 1);
});

test("trackCheckoutStart nao lanca em Node (sem window, sem Pixel), com urlConfirmada true ou false", async () => {
  const m = await fresco();
  const original = CONFIG.checkout.urlConfirmada;
  try {
    for (const urlConfirmada of [true, false]) {
      CONFIG.checkout.urlConfirmada = urlConfirmada;
      assert.doesNotThrow(() => m.trackCheckoutStart("topo"), `urlConfirmada=${urlConfirmada}`);
    }
  } finally {
    CONFIG.checkout.urlConfirmada = original;
  }
});

// Stubs minimos de window, document e IntersectionObserver para o pixel de mentira: o InitiateCheckout so pode sair com URL confirmada.
test("sem URL confirmada o InitiateCheckout nao sai; com URL confirmada, sai uma vez", async () => {
  const antes = {
    window: globalThis.window,
    document: globalThis.document,
    IntersectionObserver: globalThis.IntersectionObserver,
    checkout: { ...CONFIG.checkout },
    pixel: CONFIG.pixel.id,
  };
  const armazem = new Map();
  globalThis.window = { sessionStorage: { getItem: (k) => armazem.get(k) ?? null, setItem: (k, v) => armazem.set(k, v) } };
  globalThis.document = { createElement: () => ({}), head: { appendChild() {} } };
  globalThis.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
  try {
    CONFIG.pixel.id = "123";
    const m = await fresco();
    m.answerConsent(true);
    m.startMeasurement({});
    const enviados = () => globalThis.window.fbq.queue.filter((args) => args[1] === "InitiateCheckout");
    CONFIG.checkout.urlConfirmada = false;
    m.trackCheckoutStart("topo");
    assert.equal(enviados().length, 0);
    CONFIG.checkout.urlConfirmada = true;
    m.trackCheckoutStart("topo");
    assert.equal(enviados().length, 1);
  } finally {
    for (const [nome, valor] of [["window", antes.window], ["document", antes.document], ["IntersectionObserver", antes.IntersectionObserver]]) {
      if (valor === undefined) delete globalThis[nome];
      else globalThis[nome] = valor;
    }
    Object.assign(CONFIG.checkout, antes.checkout);
    CONFIG.pixel.id = antes.pixel;
  }
});

// Revogacao (L-1) e autoConfig (L-4): pixel de mentira com cookie, script e fila observaveis.
async function comPixel(corpo) {
  const antes = {
    window: globalThis.window,
    document: globalThis.document,
    IntersectionObserver: globalThis.IntersectionObserver,
    pixel: CONFIG.pixel.id,
  };
  const armazem = new Map();
  const cookies = [];
  const scripts = [];
  globalThis.window = {
    sessionStorage: { getItem: (k) => armazem.get(k) ?? null, setItem: (k, v) => armazem.set(k, v) },
    location: { hostname: "www.exemplo.com.br" },
  };
  globalThis.document = {
    createElement: () => ({}),
    head: { appendChild: (el) => scripts.push(el) },
    set cookie(valor) { cookies.push(valor); },
  };
  globalThis.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
  try {
    CONFIG.pixel.id = "123";
    const m = await fresco();
    m.startMeasurement({});
    const chamadas = () => globalThis.window.fbq.queue.map((args) => [...args]);
    await corpo({ m, cookies, scripts, chamadas });
  } finally {
    for (const [nome, valor] of [["window", antes.window], ["document", antes.document], ["IntersectionObserver", antes.IntersectionObserver]]) {
      if (valor === undefined) delete globalThis[nome];
      else globalThis[nome] = valor;
    }
    CONFIG.pixel.id = antes.pixel;
  }
}

test("checkout nao confirmado: nenhum dos tres registra o clique; confirmado: cada um registra uma vez", async () => {
  await comRastreadores(async () => {
    carga({ sessao: new Map([["fluor:consentimento", "true"]]), local: new Map() });
    const m = await fresco();
    m.startMeasurement({});
    const conta = () => ({
      pixel: globalThis.window.fbq.queue.filter((a) => a[1] === "InitiateCheckout").length,
      clarity: (globalThis.window.clarity.q ?? []).filter((a) => a[0] === "event" && a[1] === "clicou_checkout").length,
      posthog: globalThis.window.posthog.filter((a) => a[0] === "capture" && a[1] === "checkout_started").length,
    });
    const confirmada = CONFIG.checkout.urlConfirmada;
    try {
      CONFIG.checkout.urlConfirmada = false;
      m.trackCheckoutStart("dobra");
      assert.deepEqual(conta(), { pixel: 0, clarity: 0, posthog: 0 });
      CONFIG.checkout.urlConfirmada = true;
      m.trackCheckoutStart("dobra");
      assert.deepEqual(conta(), { pixel: 1, clarity: 1, posthog: 1 });
    } finally {
      CONFIG.checkout.urlConfirmada = confirmada;
    }
  });
});

test("aceitar e depois recusar: revoke, _fbp e _fbc expirados (host e dominio registravel) e eventos param", async () => {
  await comPixel(({ m, cookies, chamadas }) => {
    m.answerConsent(true);
    m.answerConsent(false);
    assert.ok(chamadas().some((a) => a[0] === "consent" && a[1] === "revoke"), "sem fbq(consent, revoke)");
    for (const nome of ["_fbp", "_fbc"]) {
      for (const dominio of [undefined, "www.exemplo.com.br", "exemplo.com.br"]) {
        const esperado = dominio ? `; domain=${dominio}` : "";
        assert.ok(cookies.some((c) => c.startsWith(`${nome}=; expires=Thu, 01 Jan 1970`) && c.endsWith(`path=/${esperado}`)), `${nome} sem expirar em ${dominio ?? "host puro"}`);
      }
    }
    const antes = chamadas().length;
    CONFIG.checkout.urlConfirmada = true;
    try { m.trackCheckoutStart("topo"); } finally { CONFIG.checkout.urlConfirmada = false; }
    assert.equal(chamadas().length, antes, "evento saiu depois da revogacao");
  });
});

test("recusar sem nunca ter aceitado nao carrega script nem chama fbq, mas expira _fbp e _fbc de uma visita anterior", async () => {
  await comPixel(({ m, cookies, scripts }) => {
    m.answerConsent(false);
    assert.equal(scripts.length, 0);
    assert.equal(globalThis.window.fbq, undefined);
    for (const nome of ["_fbp", "_fbc"]) {
      assert.ok(cookies.some((c) => c.startsWith(`${nome}=; expires=Thu, 01 Jan 1970`)), nome);
    }
  });
});

test("sem resposta (null) e sem pixel nesta carga: nenhum cookie e tocado", async () => {
  await comPixel(({ scripts, cookies }) => {
    assert.equal(scripts.length, 0);
    assert.equal(cookies.length, 0);
  });
});

const fakeStorage = (map) => ({
  get length() { return map.size; },
  key: (i) => [...map.keys()][i] ?? null,
  getItem: (k) => map.get(k) ?? null,
  setItem: (k, v) => map.set(k, String(v)),
  removeItem: (k) => map.delete(k),
});

// Ids e chave de teste dos três rastreadores; restaura a janela, o document e o CONFIG ao fim.
async function comRastreadores(corpo) {
  const antes = {
    window: globalThis.window,
    document: globalThis.document,
    IntersectionObserver: globalThis.IntersectionObserver,
    pixel: CONFIG.pixel.id,
    clarity: CONFIG.clarity.id,
    posthog: { ...CONFIG.posthog },
  };
  CONFIG.pixel.id = "123";
  CONFIG.clarity.id = "abc123";
  CONFIG.posthog.key = "phc_teste";
  CONFIG.posthog.host = "https://us.i.posthog.com";
  try {
    return await corpo();
  } finally {
    for (const [nome, valor] of [["window", antes.window], ["document", antes.document], ["IntersectionObserver", antes.IntersectionObserver]]) {
      if (valor === undefined) delete globalThis[nome];
      else globalThis[nome] = valor;
    }
    CONFIG.pixel.id = antes.pixel;
    CONFIG.clarity.id = antes.clarity;
    Object.assign(CONFIG.posthog, antes.posthog);
  }
}

// Uma carga de página: sessionStorage e localStorage sobrevivem entre cargas (são os que chegam por parâmetro); janela, scripts e cookies do navegador não.
function carga({ sessao, local, cookie = "", href = "https://www.lithium.app.br/" }) {
  const url = new URL(href);
  const scripts = [];
  const cookies = [];
  const log = [];
  globalThis.window = {
    location: { href, search: url.search, hostname: url.hostname },
    history: { state: null, replaceState: (_s, _t, nova) => log.push(["replaceState", String(nova)]) },
    sessionStorage: fakeStorage(sessao),
    localStorage: fakeStorage(local),
  };
  globalThis.document = {
    createElement: () => ({}),
    head: { appendChild: (el) => { scripts.push(el); log.push(["script", el.src]); } },
    get cookie() { return cookie; },
    set cookie(valor) { cookies.push(valor); },
  };
  globalThis.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
  return { scripts, cookies, log };
}

test("PostHog: carrega no F5 sem esperar o aviso, em memory; aceitar faz set_config, e reabrir a escolha volta a memory", async () => {
  await comRastreadores(async () => {
    const sessao = new Map();
    const local = new Map();
    carga({ sessao, local });
    let m = await fresco();
    m.startMeasurement({});
    assert.equal(globalThis.window.posthog._i[0][1].persistence, "memory");
    m.answerConsent(true);
    m.answerConsent(null);
    assert.deepEqual(globalThis.window.posthog.filter((a) => a[0] === "set_config").map((a) => a[1].persistence), ["localStorage+cookie", "memory"]);

    carga({ sessao, local }); // F5: a janela e o SDK somem, o sessionStorage e o localStorage ficam
    m = await fresco();
    m.startMeasurement({});
    assert.equal(globalThis.window.posthog._i.length, 1, "um init so por carga");
    assert.equal(globalThis.window.posthog._i[0][1].persistence, "memory");
    m.answerConsent(true);
    assert.deepEqual(globalThis.window.posthog.filter((a) => a[0] === "set_config").map((a) => a[1].persistence), ["localStorage+cookie"]);
  });
});

test("Clarity e PostHog carregam na largada mesmo sem resposta; o Pixel da Meta so depois do aceite", async () => {
  await comRastreadores(async () => {
    const { scripts } = carga({ sessao: new Map(), local: new Map() });
    const m = await fresco();
    m.startMeasurement({});
    assert.deepEqual(scripts.map((el) => new URL(el.src).hostname).sort(), ["us.i.posthog.com", "www.clarity.ms"]);
    assert.deepEqual([...globalThis.window.clarity.q].map((a) => [...a]), [["consentv2", { ad_Storage: "denied", analytics_Storage: "denied" }]]);
    m.answerConsent(true);
    assert.deepEqual(scripts.map((el) => new URL(el.src).hostname).sort(), ["connect.facebook.net", "us.i.posthog.com", "www.clarity.ms"]);
    assert.deepEqual([...globalThis.window.clarity.q].map((a) => a[0] === "consentv2" && a[1].analytics_Storage), ["denied", "granted"]);
  });
});

test("recusa fria: com false na sessao e cookies de uma visita anterior, a largada apaga os dos tres rastreadores e so o Pixel fica sem script", async () => {
  await comRastreadores(async () => {
    const sessao = new Map([["fluor:consentimento", "false"]]);
    const local = new Map([["ph_phc_teste_posthog", "1"], ["__ph_opt_in_out_phc_teste", "1"]]);
    const { scripts, cookies } = carga({ sessao, local, cookie: "_fbp=1; _clck=2; ph_phc_teste_posthog=3" });
    const m = await fresco();
    m.startMeasurement({});
    assert.deepEqual(scripts.map((el) => new URL(el.src).hostname).sort(), ["us.i.posthog.com", "www.clarity.ms"]);
    assert.equal(globalThis.window.fbq, undefined);
    assert.equal(globalThis.window.posthog._i[0][1].persistence, "memory");
    for (const nome of ["_fbp", "_fbc", "_clck", "_clsk", "ph_phc_teste_posthog"]) {
      assert.ok(cookies.some((c) => c.startsWith(`${nome}=; expires=Thu, 01 Jan 1970`) && c.endsWith("; domain=lithium.app.br")), nome);
    }
    assert.equal(local.size, 0);
  });
});

test("video_started sai uma vez por carga, mesmo com Parar e um play novo", async () => {
  await comRastreadores(async () => {
    carga({ sessao: new Map([["fluor:consentimento", "true"]]), local: new Map() });
    const m = await fresco();
    m.startMeasurement({});
    m.trackVideoStart();
    m.trackVideoStart();
    const fila = globalThis.window.posthog;
    assert.equal(fila.filter((a) => a[0] === "capture" && a[1] === "video_started").length, 1);
    assert.equal(fila.filter((a) => a[0] === "captureLog" && a[1]?.body === "landing video started").length, 1);
  });
});

test("a URL e limpa antes de qualquer rastreador", async () => {
  await comRastreadores(async () => {
    const { log } = carga({
      sessao: new Map([["fluor:consentimento", "true"]]),
      local: new Map(),
      href: "https://www.lithium.app.br/?email=a%40b.com&utm_source=facebook",
    });
    const m = await fresco();
    m.startMeasurement({});
    assert.deepEqual(log[0], ["replaceState", "https://www.lithium.app.br/?utm_source=facebook"]);
    assert.ok(log.length > 1 && log.slice(1).every(([tipo]) => tipo === "script"));
  });
});

// A ordem das assinaturas: o orquestrador carrega os scripts antes de o alcance decidir se cria o observador.
test("com aceite na largada, ou no aceite depois dela, o alcance ja acha os scripts e observa na mesma resposta", async () => {
  await comRastreadores(async () => {
    CONFIG.clarity.id = null; // so o Pixel depende do aceite: com o Clarity ligado o observador ja existiria antes dele
    for (const inicio of ["true", null]) {
      carga({ sessao: new Map(inicio ? [["fluor:consentimento", inicio]] : []), local: new Map() });
      const observados = [];
      globalThis.IntersectionObserver = class { observe(alvo) { observados.push(alvo.id); } unobserve() {} disconnect() {} };
      globalThis.document.getElementById = (id) => ({ id });
      const m = await fresco();
      m.startMeasurement({ oferta: { etapa: 7 } });
      if (!inicio) {
        assert.deepEqual(observados, [], "sem aceite nao existe observador");
        m.answerConsent(true);
      }
      assert.deepEqual(observados, ["oferta"], `largada com ${inicio}`);
    }
  });
});

test("desligar a medicao cancela o orquestrador: um aceite depois disso nao carrega rastreador", async () => {
  await comRastreadores(async () => {
    const { scripts } = carga({ sessao: new Map(), local: new Map() });
    const m = await fresco();
    const parar = m.startMeasurement({});
    parar();
    m.answerConsent(true);
    assert.equal(scripts.length, 2, "so Clarity e PostHog, carregados na largada");
    assert.ok(scripts.every((el) => !el.src.includes("facebook")), "o Pixel nao carrega depois do desligamento");
  });
});

test("aceitar de novo depois de revogar manda grant, regrava o aceite e nao injeta segundo script", async () => {
  await comPixel(({ m, scripts, chamadas }) => {
    m.answerConsent(true);
    m.answerConsent(false);
    m.answerConsent(true);
    assert.equal(m.readConsent(), true);
    assert.equal(scripts.length, 1);
    assert.equal(chamadas().filter((a) => a[0] === "init").length, 1);
    const nomes = chamadas().filter((a) => a[0] === "consent").map((a) => a[1]);
    assert.deepEqual(nomes, ["revoke", "grant"]);
  });
});

test("answerConsent(null) reabre a pergunta e tambem revoga o pixel carregado", async () => {
  await comPixel(({ m, chamadas }) => {
    m.answerConsent(true);
    m.answerConsent(null);
    assert.equal(m.readConsent(), null);
    assert.ok(chamadas().some((a) => a[0] === "consent" && a[1] === "revoke"));
  });
});

test("autoConfig desligado antes do init, com o id do pixel", async () => {
  await comPixel(({ m, chamadas }) => {
    m.answerConsent(true);
    const ordem = chamadas().map((a) => a[0]);
    assert.deepEqual(chamadas().slice(0, 2), [["set", "autoConfig", false, "123"], ["init", "123"]]);
    assert.ok(ordem.indexOf("set") < ordem.indexOf("init") && ordem.indexOf("init") < ordem.indexOf("track"));
  });
});

// Fronteira: `window.fbq` vem de fora e e `unknown` ate ser funcao. Terceiro que o troca por outra coisa nao derruba a pagina.
test("window.fbq trocado por nao-funcao: nada sai, nada lanca e a revogacao ainda expira os cookies", async () => {
  await comPixel(({ m, cookies }) => {
    m.answerConsent(true);
    globalThis.window.fbq = "lixo";
    CONFIG.checkout.urlConfirmada = true;
    try { assert.doesNotThrow(() => m.trackCheckoutStart("dobra")); } finally { CONFIG.checkout.urlConfirmada = false; }
    assert.doesNotThrow(() => m.answerConsent(false));
    assert.ok(cookies.some((c) => c.startsWith("_fbp=; expires=Thu, 01 Jan 1970")), "cookie nao expirou");
  });
});
