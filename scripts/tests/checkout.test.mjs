// buildCheckoutUrl (src/infra/instrumentation.js): monta a URL do checkout com a origem preservada. Varia CONFIG.checkout e restaura no finally.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCheckoutUrl } from "../../src/infra/instrumentation.js";
import { CONFIG } from "../../src/infra/config.js";

const RASTREIO = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "src", "sck"];

function comCheckout(valores, fazer) {
  const original = { ...CONFIG.checkout };
  try {
    Object.assign(CONFIG.checkout, valores);
    return fazer();
  } finally {
    Object.assign(CONFIG.checkout, original);
  }
}

const busca = (url) => new URL(url).searchParams;

test("urlConfirmada diferente de true devolve a url intacta", () => {
  for (const urlConfirmada of [false, "true", null]) {
    const saida = comCheckout({ urlConfirmada }, () => buildCheckoutUrl({ utm_source: "fb" }));
    assert.equal(saida, CONFIG.checkout.url, `urlConfirmada=${urlConfirmada}`);
  }
});

test("base preservada: origin, pathname e query da url-base continuam, e a chave nova entra", () => {
  const saida = comCheckout({ url: "https://pay.hotmart.com/Y108?x=1" }, () => buildCheckoutUrl({ utm_source: "fb" }));
  const url = new URL(saida);
  assert.equal(url.origin, "https://pay.hotmart.com");
  assert.equal(url.pathname, "/Y108");
  assert.equal(url.searchParams.get("x"), "1");
  assert.equal(url.searchParams.get("utm_source"), "fb");
});

for (const chave of RASTREIO) {
  test(`repassa ${chave} da visita ao checkout`, () => {
    assert.equal(busca(buildCheckoutUrl({ [chave]: "valor1" })).get(chave), "valor1");
  });
}

test("chave fora da lista permitida e ignorada", () => {
  const url = busca(buildCheckoutUrl({ evil: "x", utm_source: "a" }));
  assert.equal(url.has("evil"), false);
  assert.equal(url.get("utm_source"), "a");
});

// Comportamento atual, [2.2-B]: regra vigente, pendente de decisao do responsavel. Se a regra mudar, este teste muda junto.
test("valor com espaco e descartado (comportamento atual, [2.2-B])", () => {
  assert.equal(busca(buildCheckoutUrl({ utm_source: "a b" })).has("utm_source"), false);
});

// Comportamento atual, [2.2-B]: regra vigente, pendente de decisao do responsavel.
test("valor com letra acentuada e descartado (comportamento atual, [2.2-B])", () => {
  assert.equal(busca(buildCheckoutUrl({ utm_source: "ação" })).has("utm_source"), false);
});

test("valor de 101 caracteres e descartado; o de 100 e aceito", () => {
  assert.equal(busca(buildCheckoutUrl({ utm_source: "a".repeat(101) })).has("utm_source"), false);
  assert.equal(busca(buildCheckoutUrl({ utm_source: "a".repeat(100) })).get("utm_source").length, 100);
});

test("valor que nao e string (numero 5) e descartado", () => {
  assert.equal(busca(buildCheckoutUrl({ utm_source: 5 })).has("utm_source"), false);
});

for (const caractere of ["%", "+", ".", "~", ":", "-", "_"]) {
  test(`caractere ${caractere} e aceito dentro do valor`, () => {
    const valor = `a${caractere}b`;
    assert.equal(busca(buildCheckoutUrl({ utm_source: valor })).get("utm_source"), valor);
  });
}

test("chave que a base ja traz nao e sobrescrita nem duplicada", () => {
  const saida = comCheckout({ url: "https://pay.hotmart.com/Y108?utm_source=base" }, () => buildCheckoutUrl({ utm_source: "novo" }));
  assert.deepEqual(busca(saida).getAll("utm_source"), ["base"]);
});

test("parametroRastreio sem parametroConfirmado true nao e acrescentado", () => {
  const url = busca(comCheckout({ parametroRastreio: "ref", parametroConfirmado: false }, () => buildCheckoutUrl({ utm_content: "c" })));
  assert.equal(url.has("ref"), false);
});

test("parametroRastreio vazio, so espacos ou nulo nao e acrescentado", () => {
  for (const parametroRastreio of ["", "   ", null]) {
    const url = busca(comCheckout({ parametroRastreio, parametroConfirmado: true }, () => buildCheckoutUrl({ utm_content: "c" })));
    assert.deepEqual([...url.keys()], ["utm_content"], `parametroRastreio=${JSON.stringify(parametroRastreio)}`);
  }
});

test("a origem sai de utm_content, depois de utm_campaign, depois de src", () => {
  const origem = (params) =>
    busca(comCheckout({ parametroRastreio: "ref", parametroConfirmado: true }, () => buildCheckoutUrl(params))).get("ref");
  assert.equal(origem({ utm_content: "c", utm_campaign: "camp", src: "s" }), "c");
  assert.equal(origem({ utm_campaign: "camp", src: "s" }), "camp");
  assert.equal(origem({ src: "s" }), "s");
});

test("parametroRastreio com espacos ao redor e usado sem eles", () => {
  const url = busca(comCheckout({ parametroRastreio: " ref ", parametroConfirmado: true }, () => buildCheckoutUrl({ utm_content: "c" })));
  assert.equal(url.get("ref"), "c");
});

test("url-base invalida devolve a url como veio", () => {
  const saida = comCheckout({ url: "nao-e-url", urlConfirmada: true }, () => buildCheckoutUrl({ utm_source: "a" }));
  assert.equal(saida, "nao-e-url");
});

test("chamada sem argumento nao lanca e devolve a url-base", () => {
  assert.doesNotThrow(() => buildCheckoutUrl());
  assert.equal(buildCheckoutUrl(), CONFIG.checkout.url);
});
