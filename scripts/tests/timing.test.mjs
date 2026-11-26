// Relógio do vídeo (src/sections/video/timing.js): linha do tempo em batidas, estágios e a música que cobre o roteiro.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BEAT_MS,
  DROP_MS,
  HOOK_BEAT,
  getBeatTime,
  STAGES,
  TIMELINE,
  DO_IT_BEAT,
  MUSIC_END,
} from "../../src/sections/video/timing.js";

// 36050 ms: duração de public/audio/apex-video.mp3 (36,05 s, conforme o cabeçalho de tempo.js). A música precisa cobrir o roteiro dentro desse tempo.
const DURACAO_DO_ARQUIVO_MS = 36050;
const estagios = TIMELINE.map(([, estagio]) => estagio);

test("TIMELINE tem batidas estritamente crescentes", () => {
  for (let i = 1; i < TIMELINE.length; i++) {
    assert.ok(TIMELINE[i][0] > TIMELINE[i - 1][0], `item ${i}`);
  }
});

test("nenhum estagio se repete na TIMELINE", () => {
  assert.equal(new Set(estagios).size, estagios.length);
});

// Adaptação: as capas usam STAGES.cover + i (cada capa é um índice próprio), por isso o teste confere o intervalo e não só os nomes.
test("todo estagio da TIMELINE e um indice valido de STAGES, e todo estagio nomeado aparece na TIMELINE", () => {
  for (const estagio of estagios) {
    assert.ok(
      Number.isInteger(estagio) && estagio >= STAGES.hook && estagio <= STAGES.doIt,
      `estagio ${estagio}`,
    );
  }
  for (const [name, estagio] of Object.entries(STAGES)) {
    assert.ok(estagios.includes(estagio), name);
  }
});

test("getBeatTime(0) e o DROP_MS, e getBeatTime(n) = DROP_MS + n * BEAT_MS", () => {
  assert.equal(getBeatTime(0), DROP_MS);
  assert.equal(getBeatTime(7), DROP_MS + 7 * BEAT_MS);
});

test("a musica cobre getBeatTime(DO_IT_BEAT) + MUSIC_END.duration, dentro de 36050 ms", () => {
  assert.ok(getBeatTime(DO_IT_BEAT) + MUSIC_END.duration <= DURACAO_DO_ARQUIVO_MS);
});

test("MUSIC_END para na batida do ultimo take, que e o ultimo item de TIMELINE", () => {
  assert.equal(MUSIC_END.beat, DO_IT_BEAT);
  assert.deepEqual(TIMELINE.at(-1), [DO_IT_BEAT, STAGES.doIt]);
});

test("o gancho abre no clique (0 ms) e e o primeiro estagio, antes do drop", () => {
  assert.deepEqual(TIMELINE[0], [HOOK_BEAT, STAGES.hook]);
  assert.ok(Math.abs(getBeatTime(HOOK_BEAT)) < 1e-6);
  assert.ok(getBeatTime(TIMELINE[1][0]) === DROP_MS && TIMELINE[1][1] === STAGES.l3d);
});
