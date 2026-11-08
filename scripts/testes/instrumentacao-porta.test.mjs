// Porta da LGPD (src/infra/instrumentacao.js): exatamente os 9 nomes, cada um funcao; imports frescos nao dividem consentimento;
// os modulos novos de src/infra/ nao voltam a importar a porta nem se importam entre si.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const infra = (arquivo) => join(raiz, "src", "infra", arquivo);

const PORTA = [
  "capturarParametros", "useParametros", "urlCheckout", "lerConsentimento", "assinarConsentimento",
  "useConsentimento", "responderConsentimento", "registrarInicioCheckout", "iniciarMensuracao",
].sort();

// Imports relativos de um arquivo: `from "./x"`, `import "./x"` e `import("./x")`.
function importsRelativos(arquivo) {
  const texto = readFileSync(infra(arquivo), "utf8");
  const achados = [];
  for (const re of [/\bfrom\s+["'](\.{1,2}\/[^"']+)["']/g, /^\s*import\s+["'](\.{1,2}\/[^"']+)["']/gm, /import\(\s*["'](\.{1,2}\/[^"']+)["']\s*\)/g]) {
    for (const m of texto.matchAll(re)) achados.push(m[1].replace(/^\.\//, ""));
  }
  return achados;
}

test("instrumentacao.js exporta exatamente os 9 nomes da porta", async () => {
  const modulo = await import("../../src/infra/instrumentacao.js");
  assert.deepEqual(Object.keys(modulo).sort(), PORTA);
});

test("cada export da porta e funcao", async () => {
  const modulo = await import("../../src/infra/instrumentacao.js");
  for (const nome of PORTA) assert.equal(typeof modulo[nome], "function", nome);
});

test("imports frescos da porta nao compartilham o consentimento", async () => {
  const A = await import("../../src/infra/instrumentacao.js?c=a");
  const B = await import("../../src/infra/instrumentacao.js?c=b");
  assert.equal(A.lerConsentimento(), null, "A comeca sem resposta");
  A.responderConsentimento(true);
  assert.equal(A.lerConsentimento(), true);
  assert.equal(B.lerConsentimento(), null);
});

test("modulos novos de src/infra/ nao importam a porta de volta, e pixel, alcance e consentimento nao se importam", () => {
  for (const arquivo of ["armazenamento.js", "parametros.js", "consentimento.js", "pixel.js", "alcance.js"]) {
    assert.ok(!importsRelativos(arquivo).some((i) => i.startsWith("instrumentacao")), `${arquivo} importa instrumentacao.js`);
  }
  const irmaos = ["consentimento.js", "pixel.js", "alcance.js"];
  for (const arquivo of irmaos) {
    const outros = irmaos.filter((a) => a !== arquivo);
    for (const alvo of importsRelativos(arquivo)) {
      assert.ok(!outros.includes(alvo), `${arquivo} importa ${alvo}`);
    }
  }
});
