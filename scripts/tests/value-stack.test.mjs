// Bateria de logica da pilha de valor (src/content/valueStack.js). Roda com `npm test` (node --test scripts/tests/*.test.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { listValueStackErrors, formatReais, buildPresentableValueStack } from "../../src/content/valueStack.js";
import { CONFIG } from "../../src/infra/config.js";

// Bloco valido de partida; cada teste troca so o campo que quer examinar.
const blocoValido = (extra = {}) => ({
  ativo: true,
  cabecalho: "Veja tudo que você terá direito",
  itens: [{ id: "a", nome: "A" }],
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

test("item sem nome (ausente, vazio ou so espacos) gera erro no proprio item", () => {
  for (const item of [{ id: "a" }, { id: "a", nome: "" }, { id: "a", nome: "  " }, null]) {
    assert.ok(listValueStackErrors(blocoValido({ itens: [item] })).includes("itens[0].nome ausente"), JSON.stringify(item));
  }
});

test("oferta.preco invalido (zero, negativo, NaN, texto ou ausente) gera erro", () => {
  for (const preco of [0, -1, NaN, "79,99"]) {
    assert.ok(listValueStackErrors(blocoValido({ oferta: { rotulo: "x", preco } })).includes("oferta.preco inválido"), `preco=${preco}`);
  }
  assert.ok(listValueStackErrors(blocoValido({ oferta: undefined })).includes("oferta.preco inválido"));
});

test("bloco da config atual nao tem erros", () => {
  assert.deepEqual(listValueStackErrors(CONFIG.pilhaDeValor), []);
});

test("a config nao carrega preco 'antigo': nem total declarado, nem valor avulso por item", () => {
  assert.equal("totalDeclarado" in CONFIG.pilhaDeValor, false);
  assert.equal("totalRotulo" in CONFIG.pilhaDeValor, false);
  for (const item of CONFIG.pilhaDeValor.itens) assert.equal("valor" in item, false, item.id);
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

test("buildPresentableValueStack do bloco da config traz os itens (so nomes) e a oferta formatada, com moeda R$", () => {
  const forma = buildPresentableValueStack(CONFIG.pilhaDeValor);
  assert.notEqual(forma, null);
  assert.deepEqual(forma.itens.map((item) => item.nome), [
    "Protocolo Hipertrofia",
    "Protocolo Dieta para Naturais",
    "Protocolo Sono e Recuperação",
    "App Lithium Vitalício",
    "Checklist de Execução + Social Vibe",
    "Plano de retorno",
  ]);
  assert.equal(forma.tituloItens, "Itens inclusos");
  assert.equal("total" in forma, false);
  assert.equal(forma.moeda, "R$");
  assert.equal(forma.oferta.preco, "79,99");
  assert.ok(forma.oferta.comparacao && forma.oferta.subtexto);
  assert.deepEqual([forma.oferta.parcelas, forma.oferta.valorParcela, forma.oferta.totalParcelado], [3, "28,55", "85,65"]);
  assert.equal(forma.oferta.selo, "Pagamento único");
  assert.match(forma.oferta.subtexto, /Sem assinaturas/);
});

test("o Pix da config tem o mesmo valor do preco a vista da pilha", () => {
  assert.equal(CONFIG.oferta.pix.valor, CONFIG.pilhaDeValor.oferta.preco);
});

test("o preco a vista tem uma fonte so: a trava de publicacao valida o mesmo valor que a tela mostra", async () => {
  const { readFile } = await import("node:fs/promises");
  assert.equal("preco" in CONFIG.oferta, false);
  const prerender = await readFile(new URL("../prerender.mjs", import.meta.url), "utf8");
  assert.ok(prerender.includes('afirmacao("oferta.preco", preco(CONFIG.pilhaDeValor.oferta.preco)'));
  assert.equal(formatReais(CONFIG.pilhaDeValor.oferta.preco), buildPresentableValueStack(CONFIG.pilhaDeValor).oferta.preco);
});
