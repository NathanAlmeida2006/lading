// Bateria de logica da pilha de valor (src/content/valueStack.js). Roda com `npm test` (node --test scripts/tests/*.test.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { listValueStackErrors, formatReais, buildPresentableValueStack } from "../../src/content/valueStack.js";
import { CONFIG } from "../../src/infra/config.js";

// Bloco valido de partida; cada teste troca so o campo que quer examinar.
const blocoValido = (extra = {}) => ({
  ativo: true,
  cabecalho: "Veja tudo que você terá direito",
  itens: [{ id: "a", nome: "A", valor: 79.99 }],
  totalRotulo: "Preço antigo:",
  totalDeclarado: 79.99,
  moeda: "R$",
  conector: { rotulo: "Vitalício" },
  oferta: { rotulo: "por apenas:", preco: 79.99, subtexto: "pagamento único" },
  ...extra,
});

test("bloco valido de um item nao gera erro", () => {
  assert.deepEqual(listValueStackErrors(blocoValido()), []);
});

test("bloco ausente gera o erro de bloco ausente", () => {
  assert.deepEqual(listValueStackErrors(undefined), ["bloco pilhaDeValor ausente"]);
  assert.deepEqual(listValueStackErrors(null), ["bloco pilhaDeValor ausente"]);
});

test("ativo diferente de true gera erro de secao desativada", () => {
  for (const ativo of [false, "true", 1, undefined]) {
    assert.ok(listValueStackErrors(blocoValido({ ativo })).some((e) => e.startsWith("seção desativada")), `ativo=${ativo}`);
  }
});

test("lista de itens vazia gera erro de itens vazios", () => {
  assert.ok(listValueStackErrors(blocoValido({ itens: [] })).includes("itens vazios"));
});

test("item com valor 0, negativo, NaN, Infinity ou string gera erro no proprio item", () => {
  for (const valor of [0, -10, NaN, Infinity, "10"]) {
    const erros = listValueStackErrors(blocoValido({ itens: [{ id: "a", nome: "A", valor }] }));
    assert.ok(erros.includes("itens[0].valor não finito ou não positivo"), `valor=${valor}`);
  }
});

test("oferta.preco invalido (zero ou ausente) gera erro", () => {
  assert.ok(listValueStackErrors(blocoValido({ oferta: { rotulo: "x", preco: 0 } })).includes("oferta.preco inválido"));
  assert.ok(listValueStackErrors(blocoValido({ oferta: undefined })).includes("oferta.preco inválido"));
});

test("totalDeclarado invalido (zero) gera erro", () => {
  assert.ok(listValueStackErrors(blocoValido({ totalDeclarado: 0 })).includes("totalDeclarado inválido"));
});

test("soma dos itens diferente do total declarado gera erro de soma", () => {
  const erros = listValueStackErrors(blocoValido({ totalDeclarado: 80 }));
  assert.ok(erros.some((e) => e.startsWith("soma dos itens")));
});

test("itens somando 79,99 batem com o total 79,99", () => {
  const bloco = blocoValido({ itens: [{ id: "a", nome: "A", valor: 50.5 }, { id: "b", nome: "B", valor: 29.49 }] });
  assert.deepEqual(listValueStackErrors(bloco), []);
});

test("soma em centavos: 0,29 + 0,29 batem com 0,58 (a conta e feita em centavos inteiros, com arredondamento)", () => {
  const bloco = blocoValido({
    itens: [{ id: "a", nome: "A", valor: 0.29 }, { id: "b", nome: "B", valor: 0.29 }],
    totalDeclarado: 0.58,
    oferta: { rotulo: "x", preco: 0.58 },
  });
  assert.deepEqual(listValueStackErrors(bloco), []);
});

test("bloco da config atual nao tem erros", () => {
  assert.deepEqual(listValueStackErrors(CONFIG.pilhaDeValor), []);
});

test("formatReais: inteiro sai sem centavos (600 -> 600)", () => {
  assert.equal(formatReais(600), "600");
});

test("formatReais: fracao sai com virgula e duas casas (79.99 -> 79,99; 6.666 -> 6,67)", () => {
  assert.equal(formatReais(79.99), "79,99");
  assert.equal(formatReais(6.666), "6,67");
});

test("buildPresentableValueStack devolve null para bloco invalido", () => {
  assert.equal(buildPresentableValueStack(undefined), null);
  assert.equal(buildPresentableValueStack(blocoValido({ itens: [] })), null);
  assert.equal(buildPresentableValueStack(blocoValido({ ativo: false })), null);
});

test("buildPresentableValueStack do bloco da config traz itens, total e oferta formatados, com moeda R$", () => {
  const forma = buildPresentableValueStack(CONFIG.pilhaDeValor);
  assert.notEqual(forma, null);
  assert.deepEqual(forma.itens.map((item) => item.valor), ["30", "25", "20", "10", "15", "100"]);
  assert.equal(forma.total, "200");
  assert.equal(forma.moeda, "R$");
  assert.equal(forma.oferta.preco, "79,99");
});

test("o preco a vista tem uma fonte so: a trava de publicacao valida o mesmo valor que a tela mostra", async () => {
  const { readFile } = await import("node:fs/promises");
  assert.equal("preco" in CONFIG.oferta, false);
  const prerender = await readFile(new URL("../prerender.mjs", import.meta.url), "utf8");
  assert.ok(prerender.includes('afirmacao("oferta.preco", preco(CONFIG.pilhaDeValor.oferta.preco)'));
  assert.equal(formatReais(CONFIG.pilhaDeValor.oferta.preco), buildPresentableValueStack(CONFIG.pilhaDeValor).oferta.preco);
});
