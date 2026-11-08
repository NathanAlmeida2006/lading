// Criterio 3 do cartao: a doca nao depende de ids de outras secoes. Teste estatico de texto: a janela da doca em rolagem e prova de navegador (orquestrador).
// Os arquivos citam data-oculta-doca e ocultaDoca em comentarios; por isso cada alvo e casado na TAG de abertura, nao pela palavra solta.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const src = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "src");
const ler = (relativo) => readFileSync(join(src, relativo), "utf8");

// Tag de abertura de `nome` que contem o trecho `marca` (ex.: id="inicio"). Nao cruza `>`.
function tagAbertura(texto, nome, marca) {
  const re = new RegExp(`<${nome}\\b[^>]*${marca.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^>]*>`);
  const m = texto.match(re);
  assert.ok(m, `nao achei <${nome} ... ${marca} ...>`);
  return m[0];
}

test("Doca.jsx nao usa getElementById nem seletor de id", () => {
  const texto = ler("componentes/layout/Doca.jsx");
  assert.ok(!texto.includes("getElementById"), "getElementById na doca");
  assert.doesNotMatch(texto, /querySelector(All)?\(\s*["'`]#/);
});

test("Doca.jsx le os alvos por querySelectorAll(\"[data-oculta-doca]\")", () => {
  assert.ok(ler("componentes/layout/Doca.jsx").includes('document.querySelectorAll("[data-oculta-doca]")'));
});

test("Dobra: a section id=inicio carrega data-oculta-doca", () => {
  assert.match(tagAbertura(ler("secoes/Dobra.jsx"), "section", 'id="inicio"'), /\bdata-oculta-doca=""/);
});

test("Manifesto: a section id=reconhecimento carrega data-oculta-doca", () => {
  assert.match(tagAbertura(ler("secoes/Manifesto.jsx"), "section", 'id="reconhecimento"'), /\bdata-oculta-doca=""/);
});

test("RodapeLegal: o footer id=rodape-legal carrega data-oculta-doca", () => {
  assert.match(tagAbertura(ler("secoes/RodapeLegal.jsx"), "footer", 'id="rodape-legal"'), /\bdata-oculta-doca=""/);
});

test("Fechamento: o Botao da posicao fechamento tem a prop ocultaDoca na tag", () => {
  assert.match(tagAbertura(ler("secoes/Fechamento.jsx"), "Botao", 'posicao="fechamento"'), /\socultaDoca\b/);
});

test("Aplicativo: a primeira PilhaDeValor tem ocultaDoca; a #oferta nao", () => {
  const texto = ler("app/Aplicativo.jsx");
  const pilhas = [...texto.matchAll(/<PilhaDeValor\b[^>]*>/g)].map((m) => m[0]);
  assert.equal(pilhas.length, 2, "esperava duas PilhaDeValor");
  assert.match(pilhas[0], /\socultaDoca\b/);
  assert.match(pilhas[1], /id="oferta"/);
  assert.doesNotMatch(pilhas[1], /\socultaDoca\b/);
});

test("Botao.jsx e PilhaDeValor.jsx renderizam data-oculta-doca a partir de ocultaDoca", () => {
  const literal = 'data-oculta-doca={ocultaDoca ? "" : undefined}';
  assert.ok(ler("componentes/ui/Botao.jsx").includes(literal), "Botao.jsx");
  assert.ok(ler("secoes/PilhaDeValor.jsx").includes(literal), "PilhaDeValor.jsx");
});
