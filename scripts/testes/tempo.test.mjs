// Relogio do video (src/secoes/video/tempo.js): linha do tempo em batidas, estagios e a musica que cobre o roteiro.
import { test } from "node:test";
import assert from "node:assert/strict";
import { BATIDA, DROP, batida, ESTAGIOS, LINHA, BATIDA_FACA, FIM_DA_MUSICA } from "../../src/secoes/video/tempo.js";

// 36050 ms: duracao de public/audios/apex-video.mp3 (36,05 s, conforme o cabecalho de tempo.js). A musica precisa cobrir o roteiro dentro desse tempo.
const DURACAO_DO_ARQUIVO_MS = 36050;
const estagios = LINHA.map(([, estagio]) => estagio);

test("LINHA tem batidas estritamente crescentes", () => {
  for (let i = 1; i < LINHA.length; i++) {
    assert.ok(LINHA[i][0] > LINHA[i - 1][0], `item ${i}`);
  }
});

test("nenhum estagio se repete na LINHA", () => {
  assert.equal(new Set(estagios).size, estagios.length);
});

// Adaptacao: as capas usam ESTAGIOS.capa + i (cada capa e um indice proprio), por isso o teste confere o intervalo e nao so os nomes.
test("todo estagio da LINHA e um indice valido de ESTAGIOS, e todo estagio nomeado aparece na LINHA", () => {
  for (const estagio of estagios) {
    assert.ok(Number.isInteger(estagio) && estagio >= ESTAGIOS.l3d && estagio <= ESTAGIOS.faca, `estagio ${estagio}`);
  }
  for (const [nome, estagio] of Object.entries(ESTAGIOS)) {
    assert.ok(estagios.includes(estagio), nome);
  }
});

test("batida(0) e o DROP, e batida(n) = DROP + n * BATIDA", () => {
  assert.equal(batida(0), DROP);
  assert.equal(batida(7), DROP + 7 * BATIDA);
});

test("a musica cobre batida(BATIDA_FACA) + FIM_DA_MUSICA.duracao, dentro de 36050 ms", () => {
  assert.ok(batida(BATIDA_FACA) + FIM_DA_MUSICA.duracao <= DURACAO_DO_ARQUIVO_MS);
});

test("FIM_DA_MUSICA para na batida do ultimo take, que e o ultimo item de LINHA", () => {
  assert.equal(FIM_DA_MUSICA.batida, BATIDA_FACA);
  assert.deepEqual(LINHA.at(-1), [BATIDA_FACA, ESTAGIOS.faca]);
});
