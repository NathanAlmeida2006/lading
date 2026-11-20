// Criterio 3 do cartao: a doca nao depende de ids de outras secoes. Teste estatico de texto: a janela da doca em rolagem e prova de navegador (orquestrador).
// Os arquivos citam data-oculta-doca e shouldHideDock em comentarios; por isso cada alvo e casado na TAG de abertura, nao pela palavra solta.
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

test("Dock.jsx nao usa getElementById nem seletor de id", () => {
  const texto = ler("components/layout/Dock.jsx");
  assert.ok(!texto.includes("getElementById"), "getElementById na doca");
  assert.doesNotMatch(texto, /querySelector(All)?\(\s*["'`]#/);
});

test("Dock.jsx le os alvos por querySelectorAll(\"[data-oculta-doca]\")", () => {
  assert.ok(ler("components/layout/Dock.jsx").includes('document.querySelectorAll("[data-oculta-doca]")'));
});

test("Fold: a section id=inicio carrega data-oculta-doca", () => {
  assert.match(tagAbertura(ler("sections/Fold.jsx"), "section", 'id="inicio"'), /\bdata-oculta-doca=""/);
});

test("Manifesto: a section id=reconhecimento carrega data-oculta-doca", () => {
  assert.match(tagAbertura(ler("sections/Manifesto.jsx"), "section", 'id="reconhecimento"'), /\bdata-oculta-doca=""/);
});

test("LegalFooter: o footer id=rodape-legal carrega data-oculta-doca", () => {
  assert.match(tagAbertura(ler("sections/LegalFooter.jsx"), "footer", 'id="rodape-legal"'), /\bdata-oculta-doca=""/);
});

test("Closing: o CtaButton da posicao fechamento tem a prop shouldHideDock na tag", () => {
  assert.match(tagAbertura(ler("sections/Closing.jsx"), "CtaButton", 'position="fechamento"'), /\sshouldHideDock\b/);
});

test("App: so uma ValueStack (a #oferta, unica ocorrencia do preco) e a doca nao a esconde", () => {
  const pilhas = [...ler("app/App.jsx").matchAll(/<ValueStack\b[^>]*>/g)].map((m) => m[0]);
  assert.equal(pilhas.length, 1, "esperava uma ValueStack");
  assert.doesNotMatch(pilhas[0], /\sshouldHideDock\b/);
  assert.match(ler("sections/ValueStack.jsx"), /<section id="oferta"/);
});

test("CtaButton.jsx renderiza data-oculta-doca a partir de shouldHideDock", () => {
  assert.ok(ler("components/ui/CtaButton.jsx").includes('data-oculta-doca={shouldHideDock ? "" : undefined}'), "CtaButton.jsx");
});
