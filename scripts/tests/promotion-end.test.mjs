// Regra do fim da promocao guardado (src/infra/storage.js): so vale o que e finito, positivo e a no maximo 24 h de agora.
import { test } from "node:test";
import assert from "node:assert/strict";
import { getValidPromotionEnd } from "../../src/infra/storage.js";

const NOW = 1_700_000_000_000;
const DAY = 24 * 60 * 60 * 1000;

test("fim guardado dentro da janela vale", () => {
  assert.equal(getValidPromotionEnd(NOW + 1000, NOW, DAY), NOW + 1000);
  assert.equal(getValidPromotionEnd(NOW + DAY, NOW, DAY), NOW + DAY);
});

test("fim que ja passou continua valendo: a promocao encerrada nao recomeca ao recarregar", () => {
  assert.equal(getValidPromotionEnd(NOW, NOW, DAY), NOW);
  assert.equal(getValidPromotionEnd(NOW - 30 * DAY, NOW, DAY), NOW - 30 * DAY);
  assert.equal(getValidPromotionEnd(0, NOW, DAY), null);
  assert.equal(getValidPromotionEnd(-1, NOW, DAY), null);
});

test("fim alem da duracao da promocao (relogio errado ou valor adulterado) nao vale", () => {
  assert.equal(getValidPromotionEnd(NOW + DAY + 1, NOW, DAY), null);
  assert.equal(getValidPromotionEnd(NOW + 365 * DAY, NOW, DAY), null);
});

test("o que nao e numero finito nao vale", () => {
  for (const valor of [null, undefined, "abc", "1700000086400000", NaN, Infinity, {}, []]) {
    assert.equal(getValidPromotionEnd(valor, NOW, DAY), null, String(valor));
  }
});
