// Secoes e alcance (src/conteudo/secoes.js): ordem, indice e mapa de alcance das secoes mensuradas.
import { test } from "node:test";
import assert from "node:assert/strict";
import { secoes, secoesPorId, idsDoIndice, alcancePorId } from "../../src/conteudo/secoes.js";

test("etapaCanonica nao decresce ao longo de secoes", () => {
  for (let i = 1; i < secoes.length; i++) {
    assert.ok(secoes[i].etapaCanonica >= secoes[i - 1].etapaCanonica, secoes[i].id);
  }
});

test("a ordem dos ids e exatamente a atual", () => {
  assert.deepEqual(secoes.map((s) => s.id), [
    "inicio", "reconhecimento", "espelho", "o-que-e", "mapa", "prova", "amostra", "oferta", "objecoes", "fechamento", "rodape-legal",
  ]);
});

test("idsDoIndice traz so as secoes presentes, sem rodape-legal (prova e amostra ficam de fora)", () => {
  assert.deepEqual(idsDoIndice, ["inicio", "reconhecimento", "espelho", "o-que-e", "mapa", "oferta", "objecoes", "fechamento"]);
});

test("alcancePorId tem so secoes presentes da lista de alcance", () => {
  assert.deepEqual(Object.keys(alcancePorId), ["mapa", "oferta", "objecoes", "fechamento"]);
});

test("mapa vai para { etapa: 4, canonico: true }", () => {
  assert.deepEqual(alcancePorId.mapa, { etapa: 4, canonico: true });
});

test("objecoes vai para { etapa: 9, canonico: true }", () => {
  assert.deepEqual(alcancePorId.objecoes, { etapa: 9, canonico: true });
});

test("fechamento tem canonico false (suplementar)", () => {
  assert.equal(alcancePorId.fechamento.canonico, false);
});

test("oferta tem canonico undefined (vira ViewContent, nao secao canonica)", () => {
  assert.equal(alcancePorId.oferta.canonico, undefined);
});

test("secoesPorId acha cada secao pelo id", () => {
  for (const secao of secoes) {
    assert.equal(secoesPorId[secao.id], secao, secao.id);
  }
});
