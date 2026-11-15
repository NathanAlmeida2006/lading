// Parametros de campanha (src/infra/params.js): a visita nova substitui o guardado, o guardado corrompido e descartado
// e o fbclid real cabe no checkout.
import { test } from "node:test";
import assert from "node:assert/strict";
import { CONFIG } from "../../src/infra/config.js";
import { buildCheckoutUrl, captureCampaignParams } from "../../src/infra/params.js";

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

test("visita nova com campanha substitui o guardado: nada de utm_content de outro anuncio", () => {
  const guardado = JSON.stringify({ utm_campaign: "a", utm_content: "x" });
  const { devolvido, gravado } = capturar("?utm_campaign=b", guardado);
  assert.deepEqual(devolvido, { utm_campaign: "b" });
  assert.deepEqual(JSON.parse(gravado), { utm_campaign: "b" });
});

test("sem parametro de campanha na URL, o guardado continua", () => {
  const guardado = JSON.stringify({ utm_campaign: "a", utm_content: "x" });
  const { devolvido, gravado } = capturar("?outra=1", guardado);
  assert.deepEqual(devolvido, { utm_campaign: "a", utm_content: "x" });
  assert.equal(gravado, guardado);
});

test("valor guardado corrompido (nao objeto, array, valor nao texto, valor longo demais, chave estranha) e descartado", () => {
  for (const ruim of ["\"texto\"", "42", "[\"utm_campaign\"]", "{\"utm_campaign\":1}", `{"utm_campaign":"${"a".repeat(101)}"}`, "{\"intruso\":\"x\"}", "{nao e json"]) {
    assert.deepEqual(capturar("", ruim).devolvido, {}, ruim);
  }
});

test("fbclid de tamanho realista (200 caracteres) segue para a URL do checkout; utm_campaign longo demais continua fora", () => {
  const original = { ...CONFIG.checkout };
  const fbclid = "IwAR" + "a1B2-c3_D".repeat(22).slice(0, 196);
  assert.equal(fbclid.length, 200);
  try {
    Object.assign(CONFIG.checkout, { url: "https://pay.exemplo.com/checkout", urlConfirmada: true });
    const { devolvido } = capturar(`?fbclid=${fbclid}&utm_campaign=${"c".repeat(101)}`);
    const url = new URL(buildCheckoutUrl(devolvido));
    assert.equal(url.searchParams.get("fbclid"), fbclid);
    assert.equal(url.searchParams.has("utm_campaign"), false);
  } finally {
    Object.assign(CONFIG.checkout, original);
  }
});
