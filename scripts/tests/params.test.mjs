// Parametros de campanha (src/infra/params.js): cada valor invalido cai sozinho (os validos sobrevivem), o guardado
// corrompido e descartado, a visita se mescla ao guardado e o fbclid real cabe no checkout.
import { test } from "node:test";
import assert from "node:assert/strict";
import { CONFIG } from "../../src/infra/config.js";
import { buildCheckoutUrl, captureCampaignParams, cleanUrl, createCampaignParams } from "../../src/infra/params.js";

const CHAVE = "fluor:params";

// `search` da URL e `guardado` (texto cru) do sessionStorage; devolve o que a captura devolve e o que ficou gravado.
function capturar(search, guardado) {
  const antes = globalThis.window;
  const armazem = new Map(guardado === undefined ? [] : [[CHAVE, guardado]]);
  globalThis.window = {
    location: { search },
    sessionStorage: { getItem: (k) => armazem.get(k) ?? null, setItem: (k, v) => armazem.set(k, v) },
  };
  try {
    return { devolvido: captureCampaignParams(), gravado: armazem.get(CHAVE) };
  } finally {
    if (antes === undefined) delete globalThis.window;
    else globalThis.window = antes;
  }
}

// Checkout de teste: a URL-base confirmada, restaurada ao fim.
function comCheckout(fn) {
  const original = { ...CONFIG.checkout };
  try {
    Object.assign(CONFIG.checkout, { url: "https://pay.exemplo.com/checkout", urlConfirmada: true });
    return fn();
  } finally {
    Object.assign(CONFIG.checkout, original);
  }
}

test("visita com campanha se mescla ao guardado: a URL ganha chave a chave e o resto continua", () => {
  const guardado = JSON.stringify({ utm_campaign: "a", utm_content: "x" });
  const { devolvido, gravado } = capturar("?utm_campaign=b", guardado);
  assert.deepEqual(devolvido, { utm_campaign: "b", utm_content: "x" });
  assert.deepEqual(JSON.parse(gravado), { utm_campaign: "b", utm_content: "x" });
});

test("sem parametro de campanha na URL, o guardado continua", () => {
  const guardado = JSON.stringify({ utm_campaign: "a", utm_content: "x" });
  const { devolvido, gravado } = capturar("?outra=1", guardado);
  assert.deepEqual(devolvido, { utm_campaign: "a", utm_content: "x" });
  assert.equal(gravado, guardado);
});

test("valor guardado corrompido (nao objeto, array, valor nao texto, valor longo demais, chave estranha) e descartado", () => {
  for (const ruim of ["\"texto\"", "42", "[\"utm_campaign\"]", "{\"utm_campaign\":1}", `{"utm_campaign":"${"a".repeat(129)}"}`, "{\"intruso\":\"x\"}", "{nao e json"]) {
    assert.deepEqual(capturar("", ruim).devolvido, {}, ruim);
  }
});

test("guardado com uma chave ruim perde so ela: as boas sobrevivem", () => {
  const guardado = JSON.stringify({ utm_source: "facebook", utm_term: "<b>", intruso: "x", sck: "cmp1" });
  assert.deepEqual(capturar("", guardado).devolvido, { utm_source: "facebook", sck: "cmp1" });
});

test("`+` vira espaco (tenis+de+corrida) e o valor segue guardado e para o checkout, codificado de novo", () => {
  const { devolvido } = capturar("?utm_source=google&utm_term=tenis+de+corrida");
  assert.equal(devolvido.utm_term, "tenis de corrida");
  const url = new URL(comCheckout(() => buildCheckoutUrl(devolvido)));
  assert.equal(url.searchParams.get("utm_term"), "tenis de corrida");
  assert.equal(url.searchParams.get("utm_source"), "google");
});

test("palavra com acento (promocao com cedilha e til) passa, e o `sck` leva o valor decodificado", () => {
  const { devolvido } = capturar("?utm_campaign=promo%C3%A7%C3%A3o&utm_content=criativo%201");
  assert.equal(devolvido.utm_campaign, "promoção");
  assert.equal(devolvido.utm_content, "criativo 1");
  const url = new URL(comCheckout(() => buildCheckoutUrl(devolvido)));
  assert.equal(url.searchParams.get("utm_campaign"), "promoção");
  assert.equal(url.searchParams.get("sck"), "criativo 1");
});

test("payload misto: uma chave maliciosa cai e as duas validas sobrevivem, na URL e no que fica gravado", () => {
  const { devolvido, gravado } = capturar("?utm_source=facebook&utm_campaign=%3Cscript%3Ealert(1)%3C/script%3E&utm_medium=cpc");
  assert.deepEqual(devolvido, { utm_source: "facebook", utm_medium: "cpc" });
  assert.deepEqual(JSON.parse(gravado), { utm_source: "facebook", utm_medium: "cpc" });
});

test("quebra de linha, `&` e `=` dentro do valor nao passam", () => {
  const { devolvido } = capturar("?utm_source=a%0Ab&utm_medium=x%26y%3Dz&utm_term=ok");
  assert.deepEqual(devolvido, { utm_term: "ok" });
});

test("ida e volta pela politica de privacidade: sem query na volta, utm_source, campaign, medium, content, term e sck seguem iguais", () => {
  const todos = "?utm_source=facebook&utm_medium=cpc&utm_campaign=promo%C3%A7%C3%A3o&utm_content=v1&utm_term=tenis+de+corrida&sck=cmp1";
  const ida = capturar(todos);
  assert.deepEqual(Object.keys(ida.devolvido).sort(), ["sck", "utm_campaign", "utm_content", "utm_medium", "utm_source", "utm_term"]);
  const volta = capturar("", ida.gravado); // `/`: a volta nao traz a query, so o sessionStorage
  assert.deepEqual(volta.devolvido, ida.devolvido);
});

test("o utm_content que vai de tag ao Clarity nunca e texto livre: com `<` ou `>` ele nao existe", () => {
  assert.equal(capturar("?utm_content=%3Cimg%20src%3Dx%3E").devolvido.utm_content, undefined);
});

test("fbclid de tamanho realista (200 caracteres) segue para a URL do checkout; utm_campaign longo demais continua fora", () => {
  const fbclid = "IwAR" + "a1B2-c3_D".repeat(22).slice(0, 196);
  assert.equal(fbclid.length, 200);
  const { devolvido } = capturar(`?fbclid=${fbclid}&utm_campaign=${"c".repeat(129)}`);
  const url = new URL(comCheckout(() => buildCheckoutUrl(devolvido)));
  assert.equal(url.searchParams.get("fbclid"), fbclid);
  assert.equal(url.searchParams.has("utm_campaign"), false);
});

test("@ e e-mail ficam fora: utm_content=fulano@gmail.com e o %40 escondido (duplo encode) nao passam", () => {
  const { devolvido } = capturar("?utm_content=fulano%40gmail.com&utm_term=fulano%2540gmail.com&utm_source=facebook");
  assert.deepEqual(devolvido, { utm_source: "facebook" });
  const url = new URL(comCheckout(() => buildCheckoutUrl({ utm_content: "fulano@gmail.com", sck: "a%40b.com", utm_source: "facebook" })));
  assert.equal(url.searchParams.has("utm_content"), false);
  assert.equal(url.searchParams.has("sck"), false);
});

// Reescrita da barra: a URL nova vai para `replaceState`; sem nada a tirar, a lista fica vazia.
function limpar(href) {
  const antes = globalThis.window;
  const trocas = [];
  globalThis.window = {
    location: { href, search: new URL(href).search },
    history: { state: null, replaceState: (_s, _t, nova) => trocas.push(String(nova)) },
  };
  try {
    cleanUrl();
  } finally {
    if (antes === undefined) delete globalThis.window;
    else globalThis.window = antes;
  }
  return trocas;
}

test("cleanUrl tira e-mail, token e chave estranha da barra, e mantem utm_source e o hash", () => {
  assert.deepEqual(limpar("https://lithium.app.br/?email=fulano%40gmail.com&token=abc&utm_source=facebook&utm_content=fulano%40gmail.com#oferta"), ["https://lithium.app.br/?utm_source=facebook#oferta"]);
});

test("cleanUrl nao toca em URL ja limpa", () => {
  assert.deepEqual(limpar("https://lithium.app.br/?utm_source=facebook#oferta"), []);
  assert.deepEqual(limpar("https://lithium.app.br/"), []);
});

test("cleanUrl tira a query inteira quando nenhuma chave de rastreio sobra", () => {
  assert.deepEqual(limpar("https://lithium.app.br/?email=a%40b.com"), ["https://lithium.app.br/"]);
});

test("a fabrica captura uma vez, na criacao; ler o snapshot nao grava nada e devolve o mesmo objeto", () => {
  const antes = globalThis.window;
  const armazem = new Map();
  let gravacoes = 0;
  globalThis.window = {
    location: { href: "https://lithium.app.br/?utm_source=facebook", search: "?utm_source=facebook" },
    history: { state: null, replaceState: () => {} },
    sessionStorage: { getItem: (k) => armazem.get(k) ?? null, setItem: (k, v) => { gravacoes++; armazem.set(k, v); } },
  };
  try {
    const { readCampaignParams } = createCampaignParams();
    assert.equal(gravacoes, 1);
    const visita = readCampaignParams();
    for (let i = 0; i < 5; i++) assert.equal(readCampaignParams(), visita);
    assert.equal(gravacoes, 1);
    assert.deepEqual(visita, { utm_source: "facebook" });
  } finally {
    if (antes === undefined) delete globalThis.window;
    else globalThis.window = antes;
  }
});

test("sem window (servidor) a fabrica devolve {} e nao lanca", () => {
  assert.deepEqual(createCampaignParams().readCampaignParams(), {});
});
