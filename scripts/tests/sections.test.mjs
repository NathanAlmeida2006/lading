// Secoes e alcance (src/content/sections.js): ordem, indice e mapa de alcance das secoes mensuradas.
import { test } from "node:test";
import assert from "node:assert/strict";
import { SECTIONS, SECTIONS_BY_ID, INDEX_SECTION_IDS, REACH_BY_ID } from "../../src/content/sections.js";

test("etapaCanonica nao decresce ao longo de secoes", () => {
  for (let i = 1; i < SECTIONS.length; i++) {
    assert.ok(SECTIONS[i].etapaCanonica >= SECTIONS[i - 1].etapaCanonica, SECTIONS[i].id);
  }
});

test("a ordem dos ids e exatamente a atual", () => {
  assert.deepEqual(SECTIONS.map((s) => s.id), [
    "inicio", "reconhecimento", "espelho", "o-que-e", "mapa", "prova", "amostra", "oferta", "objecoes", "fechamento", "rodape-legal",
  ]);
});

test("INDEX_SECTION_IDS traz so as secoes presentes, sem rodape-legal (prova e amostra ficam de fora)", () => {
  assert.deepEqual(INDEX_SECTION_IDS, ["inicio", "reconhecimento", "espelho", "o-que-e", "mapa", "oferta", "objecoes", "fechamento"]);
});

test("REACH_BY_ID tem so secoes presentes da lista de alcance", () => {
  assert.deepEqual(Object.keys(REACH_BY_ID), ["mapa", "oferta", "objecoes", "fechamento"]);
});

test("mapa vai para { etapa: 4, canonico: true }", () => {
  assert.deepEqual(REACH_BY_ID.mapa, { etapa: 4, canonico: true });
});

test("objecoes vai para { etapa: 9, canonico: true }", () => {
  assert.deepEqual(REACH_BY_ID.objecoes, { etapa: 9, canonico: true });
});

test("fechamento tem canonico false (suplementar)", () => {
  assert.equal(REACH_BY_ID.fechamento.canonico, false);
});

test("oferta tem canonico undefined (vira ViewContent, nao secao canonica)", () => {
  assert.equal(REACH_BY_ID.oferta.canonico, undefined);
});

test("SECTIONS_BY_ID acha cada secao pelo id", () => {
  for (const secao of SECTIONS) {
    assert.equal(SECTIONS_BY_ID[secao.id], secao, secao.id);
  }
});
