// Secoes e alcance (src/content/sections.js): ordem, indice e mapa de alcance das secoes mensuradas.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { SECTIONS, SECTIONS_BY_ID, INDEX_SECTION_IDS, REACH_BY_ID } from "../../src/content/sections.js";

// A oferta (etapa 7) fica DEPOIS das objecoes (etapa 9) e a prova (5) ANTES do mapa (4) na pagina, por decisao de layout:
// a etapa e o rotulo do evento de alcance (RF-L31) e nao foi renumerada, entao as duas saem da checagem de monotonia.
test("etapaCanonica nao decresce ao longo de secoes (fora a oferta e a prova)", () => {
  const stages = SECTIONS.filter(({ id }) => id !== "oferta" && id !== "prova-social");
  for (let i = 1; i < stages.length; i++) {
    assert.ok(stages[i].etapaCanonica >= stages[i - 1].etapaCanonica, stages[i].id);
  }
});

test("a ordem dos ids e exatamente a atual", () => {
  assert.deepEqual(SECTIONS.map((s) => s.id), [
    "inicio", "espelho", "social-vibe", "o-que-e", "prova-social", "mapa", "amostra", "objecoes", "oferta", "fechamento", "rodape-legal",
  ]);
});

test("INDEX_SECTION_IDS traz so as secoes presentes e indexadas (social-vibe, prova-social, amostra e rodape-legal ficam de fora)", () => {
  assert.deepEqual(INDEX_SECTION_IDS, ["inicio", "espelho", "o-que-e", "mapa", "objecoes", "oferta", "fechamento"]);
});

test("REACH_BY_ID tem so secoes presentes da lista de alcance", () => {
  assert.deepEqual(Object.keys(REACH_BY_ID), ["social-vibe", "prova-social", "mapa", "objecoes", "oferta", "fechamento"]);
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

// O alcance e o indice acham a secao por document.getElementById: um id do registro que o JSX nao usa e uma secao muda.
test("cada secao presente do registro tem o mesmo id no JSX", () => {
  const dir = new URL("../../src/", import.meta.url);
  const jsx = readdirSync(dir, { recursive: true }).filter((f) => f.endsWith(".jsx")).map((f) => readFileSync(new URL(f, dir), "utf8")).join("\n");
  for (const { id, presente } of SECTIONS) if (presente) assert.ok(jsx.includes(`id="${id}"`), id);
});
