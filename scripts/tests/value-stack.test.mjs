// Bateria de lógica da pilha de valor (src/content/valueStack.js). Roda com `npm test` (node --test scripts/tests/*.test.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  listValueStackErrors,
  formatReais,
  buildPresentableValueStack,
} from "../../src/content/valueStack.js";
import { CONFIG } from "../../src/infra/config.js";

// Bloco válido de partida; cada teste troca só o campo que quer examinar.
const blocoValido = (extra = {}) => ({
  active: true,
  header: "Veja tudo que você terá direito",
  items: [{ id: "a", name: "A" }],
  currency: "R$",
  connector: { label: "Vitalício" },
  offer: { label: "por apenas:", price: 79.99, subtext: "pagamento único" },
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
  for (const active of [false, "true", 1, undefined]) {
    assert.ok(
      listValueStackErrors(blocoValido({ active })).some((e) => e.startsWith("seção desativada")),
      `ativo=${active}`,
    );
  }
});

test("lista de itens vazia gera erro de itens vazios", () => {
  assert.ok(listValueStackErrors(blocoValido({ items: [] })).includes("itens vazios"));
});

test("item sem nome (ausente, vazio ou so espacos) gera erro no proprio item", () => {
  for (const item of [{ id: "a" }, { id: "a", name: "" }, { id: "a", name: "  " }, null]) {
    assert.ok(
      listValueStackErrors(blocoValido({ items: [item] })).includes("items[0].name ausente"),
      JSON.stringify(item),
    );
  }
});

test("oferta.preco invalido (zero, negativo, NaN, texto ou ausente) gera erro", () => {
  for (const price of [0, -1, NaN, "79,99"]) {
    assert.ok(
      listValueStackErrors(blocoValido({ offer: { label: "x", price } })).includes(
        "offer.price inválido",
      ),
      `preco=${price}`,
    );
  }
  assert.ok(
    listValueStackErrors(blocoValido({ offer: undefined })).includes("offer.price inválido"),
  );
});

test("bloco da config atual nao tem erros", () => {
  assert.deepEqual(listValueStackErrors(CONFIG.valueStack), []);
});

test("a config nao carrega preco 'antigo': nem total declarado, nem valor avulso por item", () => {
  assert.equal("totalDeclarado" in CONFIG.valueStack, false);
  assert.equal("totalRotulo" in CONFIG.valueStack, false);
  for (const item of CONFIG.valueStack.items) assert.equal("valor" in item, false, item.id);
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
  assert.equal(buildPresentableValueStack(blocoValido({ items: [] })), null);
  assert.equal(buildPresentableValueStack(blocoValido({ active: false })), null);
});

test("buildPresentableValueStack do bloco da config traz os itens (so nomes) e a oferta formatada, com moeda R$", () => {
  const forma = buildPresentableValueStack(CONFIG.valueStack);
  assert.notEqual(forma, null);
  assert.deepEqual(
    forma.items.map((item) => item.name),
    [
      "Protocolo Hipertrofia",
      "Protocolo Dieta para Naturais",
      "Protocolo Sono e Recuperação",
      "App Lithium Vitalício",
      "Checklist de Execução + Social Vibe",
      "Plano de retorno",
    ],
  );
  assert.equal(forma.itemsTitle, "Itens inclusos");
  assert.equal("total" in forma, false);
  assert.equal(forma.currency, "R$");
  assert.equal(forma.offer.price, "79,99");
  assert.ok(forma.offer.subtext);
  assert.deepEqual(
    [forma.offer.installments, forma.offer.installmentValue, forma.offer.totalInstallments],
    [3, "28,55", "85,65"],
  );
  assert.equal(forma.offer.seal, "Pagamento único");
  assert.match(forma.offer.subtext, /Sem assinaturas/);
});

test("o Pix da config tem o mesmo valor do preco a vista da pilha", () => {
  assert.equal(CONFIG.offer.pix.value, CONFIG.valueStack.offer.price);
});

test("o preco a vista tem uma fonte so: a trava de publicacao valida o mesmo valor que a tela mostra", async () => {
  const { readFile } = await import("node:fs/promises");
  assert.equal("price" in CONFIG.offer, false);
  const prerender = await readFile(new URL("../prerender.mjs", import.meta.url), "utf8");
  assert.match(
    prerender,
    /afirmacao\(\s*"offer\.price",\s*price\(CONFIG\.valueStack\.offer\.price\)/,
  );
  assert.equal(
    formatReais(CONFIG.valueStack.offer.price),
    buildPresentableValueStack(CONFIG.valueStack).offer.price,
  );
});
