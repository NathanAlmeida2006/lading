// Validadores de dado real (src/infra/validacao.js). textoReal recusa marcador de pendencia (regra nova de [2.2-A]).
import { test } from "node:test";
import assert from "node:assert/strict";
import { textoReal, emailReal, urlDocumento } from "../../src/infra/validacao.js";
import { config } from "../../src/infra/config.js";

test("textoReal barra marcadores de pendencia (colchetes, caixa e fronteira de palavra)", () => {
  for (const valor of ["[A DEFINIR]", "[A CONFIRMAR]", "A DEFINIR", "A CONFIRMAR", "a definir", "texto a confirmar aqui"]) {
    assert.equal(textoReal(valor), false, valor);
  }
});

test("textoReal recusa vazio, so espacos e valor que nao e string", () => {
  for (const valor of ["", "   ", 5, null, undefined]) {
    assert.equal(textoReal(valor), false, String(valor));
  }
});

test("textoReal nao barra redefinir, predefinir nem indefinido", () => {
  for (const valor of ["redefinir", "predefinir", "indefinido"]) {
    assert.equal(textoReal(valor), true, valor);
  }
});

test("textoReal nao barra palavra terminada em a seguida de definir (fronteira de palavra)", () => {
  assert.equal(textoReal("Consulta definir preços"), true);
});

test("textoReal aprova texto normal", () => {
  assert.equal(textoReal("Protocolo de hipertrofia"), true);
});

test("o e-mail e os documentos de config.legal continuam aprovados", () => {
  assert.equal(emailReal(config.legal.contato), true);
  assert.equal(urlDocumento(config.legal.politicaPrivacidade), config.legal.politicaPrivacidade);
  assert.equal(urlDocumento(config.legal.termosDeUso), config.legal.termosDeUso);
});

test("emailReal aceita e-mails validos, com ou sem espacos ao redor", () => {
  for (const valor of ["a@b.com", "a.b+c@sub.dominio.com.br", "  a@b.com  "]) {
    assert.equal(emailReal(valor), true, valor);
  }
});

test("emailReal recusa sem arroba, dominio sem ponto, espaco, '<', ':' e ',' na parte local e sublinhado no dominio", () => {
  for (const valor of ["ab.com", "a@b", "a b@x.com", "a<b@x.com", "a:b@x.com", "a,b@x.com", "a@x_y.com"]) {
    assert.equal(emailReal(valor), false, valor);
  }
});

test("emailReal recusa marcador de pendencia dentro do endereco", () => {
  assert.equal(emailReal("a_definir@x.com"), false);
});

test("urlDocumento aceita arquivo local e URL https sem credenciais, devolvendo a referencia", () => {
  assert.equal(urlDocumento("/termos.html"), "/termos.html");
  assert.equal(urlDocumento("https://x.com/a"), "https://x.com/a");
  assert.equal(urlDocumento("  /termos.html  "), "/termos.html");
});

test("urlDocumento recusa '..', espaco, barra invertida, //, http, credenciais, ftp e texto invalido", () => {
  const rejeitados = ["..", "/../termos.html", "/termos com espaco.html", "/a\\b.html", "//evil.com", "http://x.com", "https://u:p@x.com", "ftp://x.com", "texto invalido"];
  for (const valor of rejeitados) {
    assert.equal(urlDocumento(valor), null, valor);
  }
});
