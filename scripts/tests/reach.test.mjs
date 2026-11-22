// Alcance (src/infra/reach.js): Pixel e Clarity sao portas independentes; o `viu_preco` do Clarity nao depende do Pixel.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createReach } from "../../src/infra/reach.js";

function measure({ isPixelOn, isClarityOn }) {
  const before = { IntersectionObserver: globalThis.IntersectionObserver, document: globalThis.document };
  let deliver = null;
  globalThis.IntersectionObserver = class { constructor(cb) { deliver = cb; } observe() {} unobserve() {} disconnect() {} };
  globalThis.document = { getElementById: (id) => ({ id }) };
  const clarityEvents = [], pixelEvents = [];
  try {
    const stop = createReach({
      subscribeToConsent: () => () => {},
      pixel: { isEligible: () => isPixelOn, loadPixel() {}, sendEvent: (name) => (isPixelOn ? pixelEvents.push(name) > 0 : false) },
      clarity: { isEligible: () => isClarityOn, loadClarity() {}, sendEvent: (name) => clarityEvents.push(name) },
    }).startMeasurement({ oferta: { etapa: 7 } });
    const oferta = { isIntersecting: true, target: { id: "oferta" } };
    deliver?.([oferta]);
    deliver?.([oferta]);
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

test("sem nenhum dos dois, nao existe observador", () => {
  assert.equal(measure({ isPixelOn: false, isClarityOn: false }).hasObserver, false);
});
