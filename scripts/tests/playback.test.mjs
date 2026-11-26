// Vigia do vídeo (src/sections/video/playback.js): tocando, o vídeo para fora da tela ou com a pausa das animações.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { setPaused } from "../../src/sensory/pause.js";
import { watchPlayback } from "../../src/sections/video/playback.js";

// O setPaused marca o <html> (toggleAttribute). O observador falso guarda o callback e o alvo, e zera o callback no disconnect.
globalThis.document = { documentElement: { toggleAttribute() {} } };
const observadores = [];
globalThis.IntersectionObserver = class {
  constructor(callback) {
    this.callback = callback;
    observadores.push(this);
  }
  observe(alvo) {
    this.alvo = alvo;
  }
  disconnect() {
    this.callback = null;
  }
};
const entregar = (entradas) => observadores.at(-1).callback?.(entradas);

test("o player saindo inteiro da tela para o video; visivel, nao", () => {
  const player = {};
  let paradas = 0;
  const cancelar = watchPlayback(player, () => {
    paradas++;
  });
  entregar([{ isIntersecting: true }]);
  assert.equal(paradas, 0);
  entregar([{ isIntersecting: false }]);
  assert.equal(paradas, 1);
  assert.equal(observadores.at(-1).alvo, player);
  cancelar();
  setPaused(false);
});

test("ligar a pausa das animacoes para o video; desligar nao toca de novo", () => {
  let paradas = 0;
  const cancelar = watchPlayback({}, () => {
    paradas++;
  });
  setPaused(true);
  assert.equal(paradas, 1);
  setPaused(false);
  assert.equal(paradas, 1);
  cancelar();
  setPaused(false);
});

test("desligada a vigia, nem a tela nem a pausa param mais nada", () => {
  let paradas = 0;
  const cancelar = watchPlayback({}, () => {
    paradas++;
  });
  cancelar();
  entregar([{ isIntersecting: false }]);
  setPaused(true);
  assert.equal(paradas, 0);
  setPaused(false);
});

test("o Video liga a vigia ao tocar, solta a pausa no play, tem o botao Parar e devolve o foco ao play", () => {
  const video = readFileSync(
    new URL("../../src/sections/video/Video.jsx", import.meta.url),
    "utf8",
  );
  for (const trecho of [
    "watchPlayback(player.current, stopFromWatch)",
    "if (isPaused()) setPaused(false);",
    'aria-label="Parar o vídeo"',
    "ref={playButtonRef}",
    "playButtonRef.current?.focus()",
  ]) {
    assert.ok(video.includes(trecho), trecho);
  }
  assert.match(video, /shouldFocusPlay\.current = true;\s*stop\(\);/);
});
