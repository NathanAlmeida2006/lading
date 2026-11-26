// Critério 3 do cartão: a doca não depende de ids de outras seções. Teste estático de texto: a janela da doca em rolagem é prova de navegador (orquestrador).
// Os arquivos citam data-oculta-doca e shouldHideDock em comentários; por isso cada alvo é casado na TAG de abertura, não pela palavra solta.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const src = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "src");
const ler = (relativo) => readFileSync(join(src, relativo), "utf8");

// Tag de abertura de `nome` que contém o trecho `marca` (ex.: id="inicio"). Não cruza `>`.
function tagAbertura(text, name, marca) {
  const re = new RegExp(`<${name}\\b[^>]*${marca.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^>]*>`);
  const m = text.match(re);
  assert.ok(m, `nao achei <${name} ... ${marca} ...>`);
  return m[0];
}

test("Dock.jsx nao usa getElementById nem seletor de id", () => {
  const text = ler("components/layout/Dock.jsx");
  assert.ok(!text.includes("getElementById"), "getElementById na doca");
  assert.doesNotMatch(text, /querySelector(All)?\(\s*["'`]#/);
});

test('Dock.jsx le os alvos por querySelectorAll("[data-oculta-doca]")', () => {
  assert.ok(
    ler("components/layout/Dock.jsx").includes('document.querySelectorAll("[data-oculta-doca]")'),
  );
});

test("Fold: a section id=inicio carrega data-oculta-doca", () => {
  assert.match(
    tagAbertura(ler("sections/Fold.jsx"), "section", 'id="inicio"'),
    /\bdata-oculta-doca=""/,
  );
});

test("LegalFooter: o footer id=rodape-legal carrega data-oculta-doca", () => {
  assert.match(
    tagAbertura(ler("sections/LegalFooter.jsx"), "footer", 'id="rodape-legal"'),
    /\bdata-oculta-doca=""/,
  );
});

test("Closing: o CtaButton da posicao fechamento tem a prop shouldHideDock na tag", () => {
  assert.match(
    tagAbertura(ler("sections/Closing.jsx"), "CtaButton", 'position="fechamento"'),
    /\sshouldHideDock\b/,
  );
});

test("App: so uma ValueStack (a #oferta, unica ocorrencia do preco) e a doca nao a esconde", () => {
  const pilhas = [...ler("app/App.jsx").matchAll(/<ValueStack\b[^>]*>/g)].map((m) => m[0]);
  assert.equal(pilhas.length, 1, "esperava uma ValueStack");
  assert.doesNotMatch(pilhas[0], /\sshouldHideDock\b/);
  assert.match(ler("sections/ValueStack.jsx"), /<section\s+id="oferta"/);
});

test("CtaButton.jsx renderiza data-oculta-doca a partir de shouldHideDock", () => {
  assert.ok(
    ler("components/ui/CtaButton.jsx").includes(
      'data-oculta-doca={shouldHideDock ? "" : undefined}',
    ),
    "CtaButton.jsx",
  );
});
