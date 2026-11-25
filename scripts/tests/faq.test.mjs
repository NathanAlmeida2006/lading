// Cifras do FAQ (src/content/content.js): saem da pilha de valor. Valores de hoje: preco 79,99, 12 semanas e 3 sessoes obrigatorias por semana.
import { test } from "node:test";
import assert from "node:assert/strict";
import { CONTENT } from "../../src/content/content.js";
import { CONFIG } from "../../src/infra/config.js";

const resposta = (pergunta) => CONTENT.objecoes.find((o) => o.pergunta === pergunta)?.resposta ?? "";
const PRECO = resposta("Por que tão barato? Tem pegadinha ou mensalidade escondida?");

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

test("a comparacao da oferta ('Menos de R$ 2,23 por treino, ... 36 treinos ... 12 semanas') continua verdadeira para a config", () => {
  const { semanas, sessoesObrigatorias } = CONTENT.mecanismo;
  const { preco, comparacao } = CONFIG.pilhaDeValor.oferta;
  assert.ok(comparacao.startsWith("Menos de R$ 2,23 por treino"));
  assert.ok(comparacao.includes(`${semanas * sessoesObrigatorias} treinos ao longo das ${semanas} semanas`), "treinos ou semanas mudaram: atualize a comparacao em config.js");
  assert.ok(preco / (semanas * sessoesObrigatorias) < 2.23, "preco subiu: atualize a comparacao em config.js");
});

test("a conta bate com a config: 79,99 / 12 semanas = 6,67 e 79,99 / 36 sessoes (12 x 3) = 2,22", () => {
  const { semanas, sessoesObrigatorias } = CONTENT.mecanismo;
  const { preco } = CONFIG.pilhaDeValor.oferta;
  assert.equal(semanas, 12);
  assert.equal(sessoesObrigatorias, 3);
  assert.equal(semanas * sessoesObrigatorias, 36);
  assert.equal(Math.round((preco / semanas) * 100) / 100, 6.67);
  assert.equal(Math.round((preco / (semanas * sessoesObrigatorias)) * 100) / 100, 2.22);
});
