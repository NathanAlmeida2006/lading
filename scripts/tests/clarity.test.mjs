// createClarity (src/infra/clarity.js): carrega sem esperar o aviso (so exige id); cookies de analise so com aceite (Consent API v2); um script por carga.
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

const fila = () => [...window.clarity.q].map((a) => [...a]);
const NEGADO = ["consentv2", { ad_Storage: "denied", analytics_Storage: "denied" }];
const ANALISE = ["consentv2", { ad_Storage: "denied", analytics_Storage: "granted" }];

test("sem id valido nada e injetado, com qualquer resposta do aviso", () => {
  for (const consent of [null, false, true]) {
    for (const id of [null, "a/../b"]) {
      const { scripts, restaurar } = ambiente(id);
      try {
        createClarity(() => consent).loadClarity();
        assert.equal(scripts.length, 0);
        assert.equal(window.clarity, undefined);
      } finally { restaurar(); }
    }
  }
});

test("sem resposta ou com recusa: injeta um script so, com o padrao negado na fila ANTES do script, e nunca libera cookies", () => {
  for (const consent of [null, false]) {
    const { scripts, restaurar } = ambiente();
    try {
      const clarity = createClarity(() => consent, () => ({ criativo: "ad7", vazio: undefined }));
      clarity.loadClarity(); clarity.loadClarity();
      assert.equal(scripts.length, 1);
      assert.equal(scripts[0].src, "https://www.clarity.ms/tag/abc123");
      clarity.sendEvent("viu_preco");
      assert.deepEqual(fila(), [NEGADO, ["set", "criativo", "ad7"], ["event", "viu_preco"]]);
    } finally { restaurar(); }
  }
});

test("aceite previo: o padrao negado sai primeiro e analytics_Storage passa a granted (ad_Storage fica denied)", () => {
  const { scripts, restaurar } = ambiente();
  try {
    const clarity = createClarity(() => true);
    clarity.loadClarity(); clarity.loadClarity();
    assert.equal(scripts.length, 1);
    assert.deepEqual(fila(), [NEGADO, ANALISE]);
  } finally { restaurar(); }
});

test("aceitar na sessao e depois retirar: granted, depois denied, e _clck e _clsk expiram", () => {
  let aceite = null;
  const { restaurar } = ambiente();
  const cookies = [];
  try {
    window.location = { hostname: "www.lithium.app.br" };
    Object.defineProperty(document, "cookie", { set: (v) => cookies.push(v), configurable: true });
    const clarity = createClarity(() => aceite);
    clarity.loadClarity();
    assert.equal(cookies.length, 0, "sem resposta nada e apagado");
    aceite = true; clarity.loadClarity();
    aceite = false; clarity.loadClarity();
    assert.deepEqual(fila(), [NEGADO, ANALISE, NEGADO]);
    for (const nome of ["_clck", "_clsk"]) {
      for (const dominio of [undefined, "www.lithium.app.br", "lithium.app.br"]) {
        const fim = dominio ? `path=/; domain=${dominio}` : "path=/";
        assert.ok(cookies.some((c) => c.startsWith(`${nome}=; expires=Thu, 01 Jan 1970`) && c.endsWith(fim)), `${nome} em ${dominio ?? "host puro"}`);
      }
    }
  } finally { restaurar(); }
});

test("clarity de outra origem nao e assumido nem sobrescrito", () => {
  const { scripts, restaurar } = ambiente();
  try {
    const alheio = () => {};
    window.clarity = alheio;
    const clarity = createClarity(() => true);
    clarity.loadClarity();
    clarity.sendEvent("x");
    assert.equal(scripts.length, 0);
    assert.equal(window.clarity, alheio);
  } finally { restaurar(); }
});
