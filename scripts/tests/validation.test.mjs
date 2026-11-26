// Validadores de dado real (src/infra/validation.js). isRealText recusa marcador de pendência (regra nova de [2.2-A]).
import { test } from "node:test";
import assert from "node:assert/strict";
import { isRealText, isRealEmail, getDocumentUrl } from "../../src/infra/validation.js";
import { CONFIG } from "../../src/infra/config.js";

test("isRealText barra marcadores de pendencia (colchetes, caixa e fronteira de palavra)", () => {
  for (const valor of [
    "[A DEFINIR]",
    "[A CONFIRMAR]",
    "A DEFINIR",
    "A CONFIRMAR",
    "a definir",
    "texto a confirmar aqui",
    "[NOME OU RAZÃO SOCIAL]",
    "[CPF OU CNPJ]",
    "Rua X, [CIDADE/UF]",
  ]) {
    assert.equal(isRealText(valor), false, valor);
  }
});

test("isRealText recusa vazio, so espacos e valor que nao e string", () => {
  for (const valor of ["", "   ", 5, null, undefined]) {
    assert.equal(isRealText(valor), false, String(valor));
  }
});

test("isRealText nao barra redefinir, predefinir nem indefinido", () => {
  for (const valor of ["redefinir", "predefinir", "indefinido"]) {
    assert.equal(isRealText(valor), true, valor);
  }
});

test("isRealText nao barra palavra terminada em a seguida de definir (fronteira de palavra)", () => {
  assert.equal(isRealText("Consulta definir preços"), true);
});

test("isRealText aprova texto normal", () => {
  assert.equal(isRealText("Protocolo de hipertrofia"), true);
});

test("o e-mail do fornecedor e os documentos de CONFIG.legal continuam aprovados", () => {
  assert.equal(isRealEmail(CONFIG.supplier.contact), true);
  assert.equal(getDocumentUrl(CONFIG.legal.privacyPolicy), CONFIG.legal.privacyPolicy);
  assert.equal(getDocumentUrl(CONFIG.legal.termsOfUse), CONFIG.legal.termsOfUse);
});

test("isRealEmail aceita e-mails validos, com ou sem espacos ao redor", () => {
  for (const valor of ["a@b.com", "a.b+c@sub.dominio.com.br", "  a@b.com  "]) {
    assert.equal(isRealEmail(valor), true, valor);
  }
});

test("isRealEmail recusa sem arroba, dominio sem ponto, espaco, '<', ':' e ',' na parte local e sublinhado no dominio", () => {
  for (const valor of [
    "ab.com",
    "a@b",
    "a b@x.com",
    "a<b@x.com",
    "a:b@x.com",
    "a,b@x.com",
    "a@x_y.com",
  ]) {
    assert.equal(isRealEmail(valor), false, valor);
  }
});

test("isRealEmail recusa marcador de pendencia dentro do endereco", () => {
  assert.equal(isRealEmail("a_definir@x.com"), false);
});

test("getDocumentUrl aceita arquivo local e URL https sem credenciais, devolvendo a referencia", () => {
  assert.equal(getDocumentUrl("/terms.html"), "/terms.html");
  assert.equal(getDocumentUrl("https://x.com/a"), "https://x.com/a");
  assert.equal(getDocumentUrl("  /terms.html  "), "/terms.html");
});

test("getDocumentUrl recusa '..', espaco, barra invertida, //, http, credenciais, ftp e texto invalido", () => {
  const rejeitados = [
    "..",
    "/../terms.html",
    "/termos com espaco.html",
    "/a\\b.html",
    "//evil.com",
    "http://x.com",
    "https://u:p@x.com",
    "ftp://x.com",
    "texto invalido",
  ];
  for (const valor of rejeitados) {
    assert.equal(getDocumentUrl(valor), null, valor);
  }
});
