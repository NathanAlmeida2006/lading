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

test("recusar sem nunca ter aceitado nao carrega script, nao chama fbq e nao mexe em cookie", async () => {
  await comPixel(({ m, cookies, scripts }) => {
    m.answerConsent(false);
    assert.equal(scripts.length, 0);
    assert.equal(globalThis.window.fbq, undefined);
    assert.equal(cookies.length, 0);
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
