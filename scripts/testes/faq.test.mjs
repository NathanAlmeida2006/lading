// Cifras do FAQ (src/conteudo/conteudo.js): saem da pilha de valor. Valores de hoje: preco 79,99, total 600, 12 semanas e 3 sessoes obrigatorias por semana.
import { test } from "node:test";
import assert from "node:assert/strict";
import { conteudo } from "../../src/conteudo/conteudo.js";
import { config } from "../../src/infra/config.js";

const resposta = (pergunta) => conteudo.objecoes.find((o) => o.pergunta === pergunta)?.resposta ?? "";
const PRECO = resposta("Quanto custa para entrar no protocolo?");

test("resposta de preco traz o preco R$ 79,99", () => {
  assert.ok(PRECO.includes("R$ 79,99"));
});

test("resposta de preco traz o total declarado R$ 600", () => {
  assert.ok(PRECO.includes("R$ 600"));
});

test("resposta de preco traz R$ 6,67 por semana", () => {
  assert.ok(PRECO.includes("R$ 6,67 por semana"));
});

test("resposta de preco traz R$ 2,22 por sessao", () => {
  assert.ok(PRECO.includes("R$ 2,22 por sessão"));
});

test("a conta bate com a config: 79,99 / 12 semanas = 6,67 e 79,99 / 36 sessoes (12 x 3) = 2,22", () => {
  const { semanas, sessoesObrigatorias } = conteudo.mecanismo;
  const { preco } = config.pilhaDeValor.oferta;
  assert.equal(semanas, 12);
  assert.equal(sessoesObrigatorias, 3);
  assert.equal(semanas * sessoesObrigatorias, 36);
  assert.equal(Math.round((preco / semanas) * 100) / 100, 6.67);
  assert.equal(Math.round((preco / (semanas * sessoesObrigatorias)) * 100) / 100, 2.22);
});
