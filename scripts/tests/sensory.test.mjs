// Camada sensorial sem navegador: rede de seguranca dos rotulos (L-5) e refeitura do campo na troca de densidade (L-7).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { openReadingMode, REVEALED_SELECTOR } from "../../src/sensory/reading.js";
import { startField } from "../../src/sensory/field.js";

test("a rede de seguranca de leitura consulta os rotulos (.rotulo), que o reveal esconde", () => {
  const consultas = [];
  globalThis.document = {
    documentElement: { classList: { remove() {}, add() {} } },
    querySelectorAll(seletor) { consultas.push(seletor); return []; },
  };
  openReadingMode();
  assert.ok(REVEALED_SELECTOR.includes(".rotulo"));
  assert.ok(consultas.some((seletor) => seletor.includes(".rotulo")), consultas.join(" | "));
});

test("ensureVisibility usa a mesma lista de seletores da rede de leitura", () => {
  const origem = readFileSync(new URL("../../src/sensory/index.js", import.meta.url), "utf8");
  assert.ok(origem.includes("querySelectorAll(REVEALED_SELECTOR)"));
});

// Ambiente minimo para o campo: observadores que so guardam o callback, e canvas que contam o buffer.
function montarCampo() {
  const observadores = { intersection: [], resize: [] };
  globalThis.IntersectionObserver = class { constructor(cb) { observadores.intersection.push(cb); } observe(alvo) { this.alvo = alvo; } unobserve() {} disconnect() {} };
  globalThis.ResizeObserver = class { constructor(cb) { observadores.resize.push(cb); } observe() {} disconnect() {} };
  const chamadas = [];
  const ctx = new Proxy({ fillRect: (...args) => chamadas.push(args.join(",")) }, { get: (alvo, chave) => alvo[chave] ?? (() => {}), set: (alvo, chave, valor) => ((alvo[chave] = valor), true) });
  const canvases = [];
  globalThis.cancelAnimationFrame = () => {};
  globalThis.window = { devicePixelRatio: 1, addEventListener() {} };
  globalThis.document = { createElement: () => { const canvas = { width: 0, height: 0, style: {}, getContext: () => ctx, remove() {} }; canvases.push(canvas); return canvas; } };
  const parent = { clientWidth: 800, clientHeight: 320 };
  const root = { parentElement: parent, append() {} };
  const stop = startField(root, { variant: "malha", colors: { dot: "#fff", thread: "#333", accent: "#f00" }, isReduced: true, isTouch: false });
  // `section` (o da secao, criado em startField) liga a observacao; `nearObserver` acorda cada ladrilho.
  const [nearObserver, section] = observadores.intersection;
  const medir = () => observadores.resize[0]();
  return { observadores, canvases, chamadas, window: globalThis.window, nearObserver, section, medir, stop };
}

test("trocar so o devicePixelRatio refaz o buffer do campo e repinta no mesmo instante dos outros ladrilhos", () => {
  const { canvases, chamadas, window, nearObserver, section, medir, stop } = montarCampo();
  medir(); // cria o ladrilho
  section([{ isIntersecting: true }]);
  nearObserver([{ target: canvases[0], isIntersecting: true }]); // acorda: buffer 800 x 320, pintado no lastTime (0)
  assert.equal(canvases[0].width, 800);
  const pinturaInicial = chamadas.splice(0).join("|");
  assert.ok(pinturaInicial.length > 0);

  window.devicePixelRatio = 2;
  medir();
  assert.equal(canvases[0].width, 1600);
  assert.equal(canvases[0].height, 640);
  // Mesma largura e altura, mesmo instante (lastTime, e nao performance.now()): o desenho e o mesmo.
  assert.equal(chamadas.splice(0).join("|"), pinturaInicial);
  stop();
});
