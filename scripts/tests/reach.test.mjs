// Alcance (src/infra/reach.js): Pixel e Clarity são portas independentes; o `viu_preco` do Clarity não depende do Pixel.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createReach } from "../../src/infra/reach.js";

function measure({ isPixelOn, isClarityOn }) {
  const before = {
    IntersectionObserver: globalThis.IntersectionObserver,
    document: globalThis.document,
  };
  let deliver = null;
  globalThis.IntersectionObserver = class {
    constructor(cb) {
      deliver = cb;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  globalThis.document = { getElementById: (id) => ({ id }) };
  const clarityEvents = [];
  const pixelEvents = [];
  try {
    const stop = createReach({
      subscribeToConsent: () => () => {},
      pixel: {
        isEligible: () => isPixelOn,
        loadPixel() {},
        sendEvent: (name) => (isPixelOn ? pixelEvents.push(name) > 0 : false),
      },
      clarity: {
        isEligible: () => isClarityOn,
        loadClarity() {},
        sendEvent: (name) => clarityEvents.push(name),
      },
    }).startMeasurement({ oferta: { etapa: 7 } });
    const offer = { isIntersecting: true, target: { id: "oferta" } };
    deliver?.([offer]);
    deliver?.([offer]);
    stop();
    return { hasObserver: deliver !== null, clarityEvents, pixelEvents };
  } finally {
    Object.assign(globalThis, before);
  }
}

test("com o Pixel bloqueado, a oferta ainda manda viu_preco ao Clarity, uma vez", () => {
  const r = measure({ isPixelOn: false, isClarityOn: true });
  assert.deepEqual(r.clarityEvents, ["viu_preco"]);
  assert.deepEqual(r.pixelEvents, []);
});

test("com os dois ligados, sai um ViewContent e um viu_preco", () => {
  const r = measure({ isPixelOn: true, isClarityOn: true });
  assert.deepEqual(r.pixelEvents, ["ViewContent"]);
  assert.deepEqual(r.clarityEvents, ["viu_preco"]);
});

test("o alcance nao carrega nem revoga rastreador: so observa as secoes", () => {
  const before = {
    IntersectionObserver: globalThis.IntersectionObserver,
    document: globalThis.document,
  };
  const chamadas = [];
  globalThis.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  globalThis.document = { getElementById: (id) => ({ id }) };
  try {
    const stop = createReach({
      subscribeToConsent: () => () => {},
      pixel: {
        isEligible: () => true,
        loadPixel: () => chamadas.push("pixel"),
        sendEvent: () => true,
      },
      clarity: {
        isEligible: () => true,
        loadClarity: () => chamadas.push("clarity"),
        sendEvent: () => true,
      },
    }).startMeasurement({ oferta: { etapa: 7 } });
    stop();
    assert.deepEqual(chamadas, []);
  } finally {
    Object.assign(globalThis, before);
  }
});

test("sem nenhum dos dois, nao existe observador", () => {
  assert.equal(measure({ isPixelOn: false, isClarityOn: false }).hasObserver, false);
});
