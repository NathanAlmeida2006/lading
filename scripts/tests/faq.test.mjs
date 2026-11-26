// Cifras do FAQ (src/content/content.js): saem da pilha de valor. Valores de hoje: preço 79,99, 12 semanas e 3 sessões obrigatórias por semana.
import { test } from "node:test";
import assert from "node:assert/strict";
import { CONTENT } from "../../src/content/content.js";
import { CONFIG } from "../../src/infra/config.js";

const answer = (question) => CONTENT.objections.find((o) => o.question === question)?.answer ?? "";
const PRECO = answer("Por que tão barato? Tem pegadinha ou mensalidade escondida?");

test("resposta de preco traz o parcelado 3x de R$ 28,55 e o a vista R$ 79,99", () => {
  assert.ok(PRECO.includes("3x de R$ 28,55 (ou R$ 79,99 à vista)"));
});

test("resposta de preco nao cita preco 'antigo' nem soma de valores avulsos", () => {
  assert.ok(!PRECO.includes("R$ 200"));
  assert.doesNotMatch(PRECO, /somam|separados|preço antigo/i);
});

test("resposta de preco traz R$ 6,67 por semana", () => {
  assert.ok(PRECO.includes("R$ 6,67 por semana"));
});

test("resposta de preco traz R$ 2,22 por treino", () => {
  assert.ok(PRECO.includes("R$ 2,22 por treino"));
});

test("a conta bate com a config: 79,99 / 12 semanas = 6,67 e 79,99 / 36 sessoes (12 x 3) = 2,22", () => {
  const { weeks, requiredSessions } = CONTENT.mechanism;
  const { price } = CONFIG.valueStack.offer;
  assert.equal(weeks, 12);
  assert.equal(requiredSessions, 3);
  assert.equal(weeks * requiredSessions, 36);
  assert.equal(Math.round((price / weeks) * 100) / 100, 6.67);
  assert.equal(Math.round((price / (weeks * requiredSessions)) * 100) / 100, 2.22);
});
