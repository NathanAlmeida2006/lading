// createClarity (src/infra/clarity.js): so com aceite e id; um script por carga; tag e evento saem; revogar apaga.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createClarity } from "../../src/infra/clarity.js";
import { CONFIG } from "../../src/infra/config.js";

function ambiente(id = "abc123") {
  const scripts = [];
  globalThis.window = {};
  globalThis.document = { head: { appendChild: (s) => scripts.push(s) }, createElement: () => ({}) };
  const original = CONFIG.clarity.id;
  CONFIG.clarity.id = id;
  return { scripts, restaurar: () => { CONFIG.clarity.id = original; delete globalThis.window; delete globalThis.document; } };
}

test("sem aceite ou sem id valido nada e injetado", () => {
  for (const [consent, id] of [[null, "abc123"], [false, "abc123"], [true, null], [true, "a/../b"]]) {
    const { scripts, restaurar } = ambiente(id);
    try {
      createClarity(() => consent).loadClarity();
      assert.equal(scripts.length, 0);
      assert.equal(window.clarity, undefined);
    } finally { restaurar(); }
  }
});

test("com aceite injeta um script so, grava a tag e envia o evento pela fila", () => {
  const { scripts, restaurar } = ambiente();
  try {
    const clarity = createClarity(() => true, () => ({ criativo: "ad7", vazio: undefined }));
    clarity.loadClarity(); clarity.loadClarity();
    assert.equal(scripts.length, 1);
    assert.equal(scripts[0].src, "https://www.clarity.ms/tag/abc123");
    clarity.sendEvent("viu_preco");
    assert.deepEqual([...window.clarity.q].map((a) => [...a]), [["set", "criativo", "ad7"], ["event", "viu_preco"]]);
  } finally { restaurar(); }
});

test("clarity de outra origem nao e assumido; revogar chama consent falso e para de enviar", () => {
  let aceite = true;
  const { scripts, restaurar } = ambiente();
  try {
    window.clarity = () => {};
    createClarity(() => aceite).loadClarity();
    assert.equal(scripts.length, 0);
    delete window.clarity;
    const clarity = createClarity(() => aceite);
    clarity.loadClarity();
    aceite = false;
    clarity.loadClarity();
    clarity.sendEvent("clicou_checkout");
    assert.deepEqual([...window.clarity.q].map((a) => [...a]), [["consent", false]]);
  } finally { restaurar(); }
});
