// Prova social (validation.js, config.js, content.js, sections.js e prerender.mjs): uma regra so decide o que vai a tela e o que o build recusa.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CONFIG } from "../../src/infra/config.js";
import { getTestimonialIssues, getPublishableTestimonials, getRatingIssues } from "../../src/infra/validation.js";

const COMPLETO = { id: "t1", print: "/images/prints/t1.webp", alt: "Conversa em que o cliente conta que fechou o primeiro mes sem furar.", origem: "direct do Instagram, 20/11/2026", autorizacaoRef: "AUT-001", aprovado: true };
const VAGA = { id: "v1", print: null };

test("print completo e aprovado nao tem pendencia", () => {
  assert.deepEqual(getTestimonialIssues(COMPLETO), []);
});

test("a vaga (print: null) so precisa de id: nao ha pessoa nem conversa nela", () => {
  assert.deepEqual(getTestimonialIssues(VAGA), []);
  assert.deepEqual(getTestimonialIssues({ ...VAGA, id: " " }), ["id"]);
  // So o `null` explicito e vaga: campo ausente ou vazio e print incompleto, e vai para a lista de pendencias.
  assert.deepEqual(getTestimonialIssues({ id: "v2" }), ["print", "alt", "origem", "autorizacaoRef", "aprovado"]);
  assert.ok(getTestimonialIssues({ ...COMPLETO, print: "" }).includes("print"));
});

test("cada campo de lastro ausente vira pendencia, e aprovado vem por ultimo", () => {
  assert.deepEqual(getTestimonialIssues({ ...COMPLETO, origem: null, autorizacaoRef: "  ", aprovado: false }), ["origem", "autorizacaoRef", "aprovado"]);
  const semRegistro = getTestimonialIssues(null);
  assert.ok(semRegistro.includes("id"));
  assert.equal(semRegistro.at(-1), "aprovado");
  assert.ok(getTestimonialIssues({ ...COMPLETO, autorizacaoRef: "[A DEFINIR]" }).includes("autorizacaoRef"));
  // Sem a transcricao o leitor de tela nao tem o que ler: o print nao vai a tela.
  assert.deepEqual(getTestimonialIssues({ ...COMPLETO, alt: null }), ["alt"]);
  // So `true` aprova: texto que parece aprovacao ("sim", "true") continua pendente.
  for (const aprovado of ["sim", "true", 1]) assert.deepEqual(getTestimonialIssues({ ...COMPLETO, aprovado }), ["aprovado"], String(aprovado));
});

test("nota: fora de 0 ao maximo, sem fonte ou sem aprovacao e pendencia; sem nota nao ha pendencia", () => {
  assert.deepEqual(getRatingIssues({ nota: 4.5, maximo: 5, fonte: "Hotmart, 120 avaliacoes, 20/11/2026", aprovado: true }), []);
  assert.deepEqual(getRatingIssues({ nota: 6, maximo: 5, fonte: null, aprovado: false }), ["nota", "fonte", "aprovado"]);
  assert.deepEqual(getRatingIssues({ nota: 0, maximo: 5, fonte: "x", aprovado: true }), ["nota"]);
  assert.deepEqual(getRatingIssues({ nota: 5, maximo: 5, fonte: "x", aprovado: true }), [], "a nota maxima vale");
  assert.deepEqual(getRatingIssues(null), []);
});

test("a configuracao atual (cinco vagas de print e a nota aprovada) esta sem pendencia", () => {
  assert.equal(CONFIG.depoimentos.length, 5);
  for (const depoimento of CONFIG.depoimentos) assert.deepEqual(getTestimonialIssues(depoimento), [], depoimento.id);
  assert.deepEqual(getRatingIssues(CONFIG.avaliacao), []);
  assert.equal(getPublishableTestimonials(CONFIG.depoimentos).length, 5);
});

test("a tela mostra so o publicavel: conteudo e secao seguem a mesma regra", async () => {
  const depoimentosAtuais = CONFIG.depoimentos;
  const avaliacaoAtual = CONFIG.avaliacao;
  try {
    const conteudoAtual = await import(new URL("../../src/content/content.js?c=1", import.meta.url).href);
    const secoesAtuais = await import(new URL("../../src/content/sections.js?c=1", import.meta.url).href);
    assert.deepEqual(conteudoAtual.CONTENT.prova.depoimentos.map(({ src }) => src), [null, null, null, null, null]);
    assert.equal(conteudoAtual.CONTENT.prova.avaliacao.nota, 4.5);
    assert.equal(secoesAtuais.SECTIONS_BY_ID["prova-social"].presente, true);

    CONFIG.depoimentos = [{ ...COMPLETO, aprovado: false }];
    CONFIG.avaliacao = { ...avaliacaoAtual, aprovado: false };
    const semAprovacao = await import(new URL("../../src/content/content.js?c=0", import.meta.url).href);
    const secaoSem = await import(new URL("../../src/content/sections.js?c=0", import.meta.url).href);
    assert.deepEqual(semAprovacao.CONTENT.prova.depoimentos, []);
    assert.equal(semAprovacao.CONTENT.prova.avaliacao, null);
    assert.equal(secaoSem.SECTIONS_BY_ID["prova-social"].presente, false);

    CONFIG.depoimentos = [COMPLETO];
    CONFIG.avaliacao = { nota: 4.5, maximo: 5, fonte: "Hotmart", aprovado: true };
    const conteudoNovo = await import(new URL("../../src/content/content.js?c=2", import.meta.url).href);
    const secoesNovas = await import(new URL("../../src/content/sections.js?c=2", import.meta.url).href);
    assert.deepEqual(conteudoNovo.CONTENT.prova.depoimentos, [{ src: COMPLETO.print, alt: COMPLETO.alt }]);
    assert.deepEqual(conteudoNovo.CONTENT.prova.avaliacao, { nota: 4.5, maximo: 5, rotulo: "Avaliação dos compradores" });
    assert.equal(secoesNovas.SECTIONS_BY_ID["prova-social"].presente, true);
  } finally {
    CONFIG.depoimentos = depoimentosAtuais;
    CONFIG.avaliacao = avaliacaoAtual;
  }
});

test("o build recusa pela mesma regra da tela", () => {
  const prerender = readFileSync(new URL("../prerender.mjs", import.meta.url), "utf8");
  assert.ok(prerender.includes("getTestimonialIssues(depoimento)"));
  assert.ok(prerender.includes("getRatingIssues(CONFIG.avaliacao)"));
  assert.ok(!prerender.includes("relato ou identificação sem aprovação"));
});

// Depoimento publicavel com nota pendente: a secao aparece e o bloco da nota nao (sem a guarda, o prerender quebraria no `null`).
test("o Proof so desenha a nota publicavel", () => {
  const proof = readFileSync(new URL("../../src/sections/Proof.jsx", import.meta.url), "utf8");
  assert.ok(proof.includes("{RATING && <Nota"));
});
