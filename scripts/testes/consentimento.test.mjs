// Consentimento, assinantes e registro do checkout (src/infra/instrumentacao.js). Cada cenario usa um import fresco (?c=n), com estado proprio.
import { test } from "node:test";
import assert from "node:assert/strict";
import { config } from "../../src/infra/config.js";

const href = new URL("../../src/infra/instrumentacao.js", import.meta.url).href;
let cenario = 0;
const fresco = () => import(`${href}?c=${++cenario}`);

test("lerConsentimento comeca null sem window (sessionStorage falha calado)", async () => {
  const m = await fresco();
  assert.equal(m.lerConsentimento(), null);
});

test("responderConsentimento(true) faz lerConsentimento devolver true", async () => {
  const m = await fresco();
  m.responderConsentimento(true);
  assert.equal(m.lerConsentimento(), true);
});

test("responderConsentimento(false) faz lerConsentimento devolver false", async () => {
  const m = await fresco();
  m.responderConsentimento(false);
  assert.equal(m.lerConsentimento(), false);
});

test("valor nao booleano (sim) conta como recusa: devolve false", async () => {
  const m = await fresco();
  m.responderConsentimento("sim");
  assert.equal(m.lerConsentimento(), false);
});

test("assinantes sao chamados na resposta, uma vez cada", async () => {
  const m = await fresco();
  let a = 0;
  let b = 0;
  m.assinarConsentimento(() => a++);
  m.assinarConsentimento(() => b++);
  m.responderConsentimento(true);
  assert.equal(a, 1);
  assert.equal(b, 1);
});

test("o cancelamento devolvido por assinarConsentimento impede a chamada", async () => {
  const m = await fresco();
  let chamadas = 0;
  const cancelar = m.assinarConsentimento(() => chamadas++);
  cancelar();
  m.responderConsentimento(true);
  assert.equal(chamadas, 0);
});

test("assinante que lanca nao derruba os outros: o erro vai para console.error e o seguinte roda", async () => {
  const m = await fresco();
  const original = console.error;
  const erros = [];
  let seguinte = 0;
  console.error = (erro) => erros.push(erro);
  try {
    m.assinarConsentimento(() => { throw new Error("falha do assinante"); });
    m.assinarConsentimento(() => seguinte++);
    m.responderConsentimento(true);
  } finally {
    console.error = original;
  }
  assert.equal(erros.length, 1);
  assert.equal(seguinte, 1);
});

test("registrarInicioCheckout nao lanca em Node (sem window, sem Pixel), com urlConfirmada true ou false", async () => {
  const m = await fresco();
  const original = config.checkout.urlConfirmada;
  try {
    for (const urlConfirmada of [true, false]) {
      config.checkout.urlConfirmada = urlConfirmada;
      assert.doesNotThrow(() => m.registrarInicioCheckout("topo"), `urlConfirmada=${urlConfirmada}`);
    }
  } finally {
    config.checkout.urlConfirmada = original;
  }
});

// Stubs minimos de window, document e IntersectionObserver para o pixel de mentira: o InitiateCheckout so pode sair com URL confirmada.
test("sem URL confirmada o InitiateCheckout nao sai; com URL confirmada, sai uma vez", async () => {
  const antes = {
    window: globalThis.window,
    document: globalThis.document,
    IntersectionObserver: globalThis.IntersectionObserver,
    checkout: { ...config.checkout },
    pixel: config.pixel.id,
  };
  const armazem = new Map();
  globalThis.window = { sessionStorage: { getItem: (k) => armazem.get(k) ?? null, setItem: (k, v) => armazem.set(k, v) } };
  globalThis.document = { createElement: () => ({}), head: { appendChild() {} } };
  globalThis.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
  try {
    config.pixel.id = "123";
    const m = await fresco();
    m.responderConsentimento(true);
    m.iniciarMensuracao({});
    const enviados = () => globalThis.window.fbq.queue.filter((args) => args[1] === "InitiateCheckout");
    config.checkout.urlConfirmada = false;
    m.registrarInicioCheckout("topo");
    assert.equal(enviados().length, 0);
    config.checkout.urlConfirmada = true;
    m.registrarInicioCheckout("topo");
    assert.equal(enviados().length, 1);
  } finally {
    for (const [nome, valor] of [["window", antes.window], ["document", antes.document], ["IntersectionObserver", antes.IntersectionObserver]]) {
      if (valor === undefined) delete globalThis[nome];
      else globalThis[nome] = valor;
    }
    Object.assign(config.checkout, antes.checkout);
    config.pixel.id = antes.pixel;
  }
});
