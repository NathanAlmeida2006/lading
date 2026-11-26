// Prova social (validation.js, config.js, content.js, sections.js e prerender.mjs): uma regra só decide o que vai a tela e o que o build recusa.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CONFIG } from "../../src/infra/config.js";
import {
  getTestimonialIssues,
  getPublishableTestimonials,
  getRatingIssues,
} from "../../src/infra/validation.js";

const COMPLETO = {
  id: "t1",
  print: "/images/prints/t1.webp",
  alt: "Conversa em que o cliente conta que fechou o primeiro mes sem furar.",
  origin: "direct do Instagram, 20/11/2026",
  authorizationRef: "AUT-001",
  approved: true,
};
const VAGA = { id: "v1", print: null };

test("print completo e aprovado nao tem pendencia", () => {
  assert.deepEqual(getTestimonialIssues(COMPLETO), []);
});

test("a vaga (print: null) so precisa de id: nao ha pessoa nem conversa nela", () => {
  assert.deepEqual(getTestimonialIssues(VAGA), []);
  assert.deepEqual(getTestimonialIssues({ ...VAGA, id: " " }), ["id"]);
  // Só o `null` explícito é vaga: campo ausente ou vazio é print incompleto, e vai para a lista de pendências.
  assert.deepEqual(getTestimonialIssues({ id: "v2" }), [
    "print",
    "alt",
    "origin",
    "authorizationRef",
    "approved",
  ]);
  assert.ok(getTestimonialIssues({ ...COMPLETO, print: "" }).includes("print"));
});

test("cada campo de lastro ausente vira pendencia, e aprovado vem por ultimo", () => {
  assert.deepEqual(
    getTestimonialIssues({ ...COMPLETO, origin: null, authorizationRef: "  ", approved: false }),
    ["origin", "authorizationRef", "approved"],
  );
  const semRegistro = getTestimonialIssues(null);
  assert.ok(semRegistro.includes("id"));
  assert.equal(semRegistro.at(-1), "approved");
  assert.ok(
    getTestimonialIssues({ ...COMPLETO, authorizationRef: "[A DEFINIR]" }).includes(
      "authorizationRef",
    ),
  );
  // Sem a transcrição o leitor de tela não tem o que ler: o print não vai à tela.
  assert.deepEqual(getTestimonialIssues({ ...COMPLETO, alt: null }), ["alt"]);
  // Só `true` aprova: texto que parece aprovação ("sim", "true") continua pendente.
  for (const approved of ["sim", "true", 1])
    assert.deepEqual(
      getTestimonialIssues({ ...COMPLETO, approved }),
      ["approved"],
      String(approved),
    );
});

test("nota: fora de 0 ao maximo, sem fonte ou sem aprovacao e pendencia; sem nota nao ha pendencia", () => {
  assert.deepEqual(
    getRatingIssues({
      note: 4.5,
      max: 5,
      source: "Hotmart, 120 avaliacoes, 20/11/2026",
      approved: true,
    }),
    [],
  );
  assert.deepEqual(getRatingIssues({ note: 6, max: 5, source: null, approved: false }), [
    "note",
    "source",
    "approved",
  ]);
  assert.deepEqual(getRatingIssues({ note: 0, max: 5, source: "x", approved: true }), ["note"]);
  assert.deepEqual(
    getRatingIssues({ note: 5, max: 5, source: "x", approved: true }),
    [],
    "a nota maxima vale",
  );
  assert.deepEqual(getRatingIssues(null), []);
});

test("a configuracao atual (dois prints e a nota aprovada) esta sem pendencia", () => {
  assert.equal(CONFIG.testimonials.length, 2);
  for (const depoimento of CONFIG.testimonials)
    assert.deepEqual(getTestimonialIssues(depoimento), [], depoimento.id);
  assert.deepEqual(getRatingIssues(CONFIG.assessment), []);
  assert.equal(getPublishableTestimonials(CONFIG.testimonials).length, 2);
});

test("a tela mostra so o publicavel: conteudo e secao seguem a mesma regra", async () => {
  const depoimentosAtuais = CONFIG.testimonials;
  const avaliacaoAtual = CONFIG.assessment;
  try {
    const conteudoAtual = await import(
      new URL("../../src/content/content.js?c=1", import.meta.url).href
    );
    const secoesAtuais = await import(
      new URL("../../src/content/sections.js?c=1", import.meta.url).href
    );
    assert.deepEqual(
      conteudoAtual.CONTENT.proof.testimonials.map(({ src }) => src),
      ["/images/prints/dep1.webp", "/images/prints/dep2.webp"],
    );
    assert.equal(conteudoAtual.CONTENT.proof.assessment.note, 4.5);
    assert.equal(secoesAtuais.SECTIONS_BY_ID["prova-social"].isPresent, true);

    CONFIG.testimonials = [{ ...COMPLETO, approved: false }];
    CONFIG.assessment = { ...avaliacaoAtual, approved: false };
    const semAprovacao = await import(
      new URL("../../src/content/content.js?c=0", import.meta.url).href
    );
    const secaoSem = await import(
      new URL("../../src/content/sections.js?c=0", import.meta.url).href
    );
    assert.deepEqual(semAprovacao.CONTENT.proof.testimonials, []);
    assert.equal(semAprovacao.CONTENT.proof.assessment, null);
    assert.equal(secaoSem.SECTIONS_BY_ID["prova-social"].isPresent, false);

    CONFIG.testimonials = [COMPLETO];
    CONFIG.assessment = { note: 4.5, max: 5, source: "Hotmart", approved: true };
    const conteudoNovo = await import(
      new URL("../../src/content/content.js?c=2", import.meta.url).href
    );
    const secoesNovas = await import(
      new URL("../../src/content/sections.js?c=2", import.meta.url).href
    );
    assert.deepEqual(conteudoNovo.CONTENT.proof.testimonials, [
      { src: COMPLETO.print, alt: COMPLETO.alt },
    ]);
    assert.deepEqual(conteudoNovo.CONTENT.proof.assessment, {
      note: 4.5,
      max: 5,
    });
    assert.equal(secoesNovas.SECTIONS_BY_ID["prova-social"].isPresent, true);
  } finally {
    CONFIG.testimonials = depoimentosAtuais;
    CONFIG.assessment = avaliacaoAtual;
  }
});

test("o build recusa pela mesma regra da tela", () => {
  const prerender = readFileSync(new URL("../prerender.mjs", import.meta.url), "utf8");
  assert.ok(prerender.includes("getTestimonialIssues(depoimento)"));
  assert.ok(prerender.includes("getRatingIssues(CONFIG.assessment)"));
  assert.ok(!prerender.includes("relato ou identificação sem aprovação"));
});

// Depoimento publicável com nota pendente: a seção aparece e o bloco da nota não (sem a guarda, o prerender quebraria no `null`).
test("o Proof so desenha a nota publicavel", () => {
  const proof = readFileSync(new URL("../../src/sections/Proof.jsx", import.meta.url), "utf8");
  assert.match(proof, /\{RATING &&\s*\(?\s*<Rating\b/);
});
