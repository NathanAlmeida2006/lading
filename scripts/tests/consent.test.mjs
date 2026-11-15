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
