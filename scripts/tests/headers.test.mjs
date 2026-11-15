// Cabecalhos de seguranca (public/_headers) e hash do script inline (index.html). Le os arquivos a partir deste teste, sem depender do cwd.
// Fonte: cartao T-010 (criterio 1) e headers.mjs de referencia. Afirmacoes do cartao, um test() por afirmacao.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const headers = readFileSync(new URL("../../public/_headers", import.meta.url), "utf8");
const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");

// Leitura de blocos igual a do headers.mjs: linha sem recuo abre bloco (padrao de caminho); linha recuada e "Nome: valor".
const blocos = {};
let atual = null;
for (const linha of headers.split("\n")) {
  if (!linha.trim()) continue;
  if (!/^\s/.test(linha)) {
    atual = linha.trim();
    blocos[atual] = [];
  } else if (atual) {
    blocos[atual].push(linha.trim());
  }
}
const geral = blocos["/*"] ?? [];
const valor = (lista, nome) => lista.find((l) => l.startsWith(`${nome}:`))?.slice(nome.length + 1).trim();
const csp = valor(geral, "Content-Security-Policy") ?? "";
const diretiva = (nome) => csp.split(";").map((d) => d.trim()).find((d) => d.split(/\s+/)[0] === nome) ?? "";
const fontes = (nome) => diretiva(nome).split(/\s+/).slice(1);
const scriptSrc = fontes("script-src");

// Scripts inline executaveis: sem src, e type ausente ou JS (ld+json e outros ficam de fora).
const hashes = [...html.matchAll(/<script(?![^>]*\bsrc\s*=)([^>]*)>([\s\S]*?)<\/script>/g)]
  .filter(([, atributos]) => {
    const tipo = atributos.match(/\btype\s*=\s*["']?([^"'\s>]+)/i)?.[1];
    return tipo === undefined || ["module", "text/javascript", "application/javascript"].includes(tipo.toLowerCase());
  })
  .map(([, , conteudo]) => `'sha256-${createHash("sha256").update(conteudo).digest("base64")}'`);

test("bloco /* traz X-Content-Type-Options: nosniff", () => {
  assert.ok(geral.includes("X-Content-Type-Options: nosniff"));
});

test("Referrer-Policy esta presente no bloco /*", () => {
  assert.notEqual(valor(geral, "Referrer-Policy"), undefined);
});

test("Permissions-Policy esta presente no bloco /*", () => {
  assert.notEqual(valor(geral, "Permissions-Policy"), undefined);
});

test("Strict-Transport-Security esta presente e sem includeSubDomains", () => {
  const hsts = valor(geral, "Strict-Transport-Security");
  assert.notEqual(hsts, undefined);
  assert.doesNotMatch(hsts, /includeSubDomains/i);
});

test("CSP tem frame-ancestors exatamente 'none'", () => {
  assert.deepEqual(fontes("frame-ancestors"), ["'none'"]);
});

test("script-src tem 'self'", () => {
  assert.ok(scriptSrc.includes("'self'"));
});

test("script-src tem https://connect.facebook.net", () => {
  assert.ok(scriptSrc.includes("https://connect.facebook.net"));
});

test("script-src sem 'unsafe-inline'", () => {
  assert.ok(!scriptSrc.includes("'unsafe-inline'"));
});

test("script-src sem 'unsafe-eval'", () => {
  assert.ok(!scriptSrc.includes("'unsafe-eval'"));
});

test("index.html tem ao menos um script inline executavel (o regex nao quebrou)", () => {
  assert.ok(hashes.length >= 1);
});

test("cada script inline executavel do index.html tem seu hash em script-src", () => {
  assert.deepEqual(hashes.filter((hash) => !scriptSrc.includes(hash)), []);
});

test("img-src traz https://www.facebook.com", () => {
  assert.ok(fontes("img-src").includes("https://www.facebook.com"));
});

test("connect-src traz https://www.facebook.com", () => {
  assert.ok(fontes("connect-src").includes("https://www.facebook.com"));
});

test("object-src e exatamente 'none'", () => {
  assert.equal(diretiva("object-src"), "object-src 'none'");
});

test("bloco /documents/* tem Cache-Control: public, max-age=31536000, immutable", () => {
  assert.ok((blocos["/documents/*"] ?? []).includes("Cache-Control: public, max-age=31536000, immutable"));
});
