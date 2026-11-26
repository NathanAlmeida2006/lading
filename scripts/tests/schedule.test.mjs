// Agendador do vídeo (src/sections/video/schedule.js): cada estágio dispara na sua batida, atrasado não acumula, cancelar limpa tudo.
// O relógio é falso (Date e setTimeout por mock.timers); a TIMELINE e o getBeatTime vêm de timing.js.
import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { scheduleStages } from "../../src/sections/video/schedule.js";
import { TIMELINE, getBeatTime, DO_IT_BEAT, MUSIC_END } from "../../src/sections/video/timing.js";

// Roda `fn(t0)` com Date e setTimeout falsos; `t0` é o relógio do clique. Sempre desfaz o mock.
function comRelogio(fn) {
  mock.timers.enable({ apis: ["setTimeout", "Date"] });
  try {
    fn(Date.now());
  } finally {
    mock.timers.reset();
  }
}

// Instante inteiro em que um timer de `x` ms dispara (o mock só anda em ms inteiros).
const instante = (x) => Math.ceil(x);
const estagios = TIMELINE.map(([, e]) => e);

test("cada estagio dispara na sua batida: nao antes, e exatamente uma vez", () =>
  comRelogio((t0) => {
    const disparos = [];
    scheduleStages(TIMELINE, t0, (e) => disparos.push(e), Date.now);
    let agora = 0;
    for (const [b, e] of TIMELINE) {
      const alvo = instante(getBeatTime(b));
      if (alvo > 0) {
        // o gancho cai no clique (0 ms): não há "antes" a conferir
        mock.timers.tick(alvo - 1 - agora);
        agora = alvo - 1;
        assert.ok(!disparos.includes(e), `estagio ${e} disparou antes da batida ${b}`);
      }
      mock.timers.tick(alvo - agora);
      agora = alvo;
      assert.equal(
        disparos.filter((x) => x === e).length,
        1,
        `estagio ${e} deveria ter disparado uma vez na batida ${b}`,
      );
    }
  }));

test("os estagios saem na ordem da TIMELINE, uma vez cada, com o numero do estagio", () =>
  comRelogio((t0) => {
    const disparos = [];
    scheduleStages(TIMELINE, t0, (e) => disparos.push(e), Date.now);
    mock.timers.tick(instante(getBeatTime(DO_IT_BEAT)) + 10);
    assert.deepEqual(disparos, estagios);
  }));

test("estagio atrasado dispara no primeiro tick; os seguintes mantem o instante absoluto", () =>
  comRelogio((t0) => {
    const ATRASO = 8300; // já passaram as batidas 0, 6 e 10 (3230, 6255,2 e 8272 ms)
    const disparos = [];
    scheduleStages(TIMELINE, t0 - ATRASO, (e) => disparos.push(e), Date.now);
    const passados = TIMELINE.filter(([b]) => getBeatTime(b) <= ATRASO).map(([, e]) => e);
    assert.ok(passados.length >= 2, "o atraso tem de cobrir mais de um estagio");
    mock.timers.tick(0);
    assert.deepEqual(disparos, passados);
    // Os restantes seguem no instante absoluto t0 + getBeatTime(b), não a partir do disparo atrasado.
    let agora = ATRASO;
    for (const [b, e] of TIMELINE.filter(([b]) => getBeatTime(b) > ATRASO)) {
      const alvo = instante(getBeatTime(b));
      mock.timers.tick(alvo - 1 - agora);
      agora = alvo - 1;
      assert.ok(!disparos.includes(e), `estagio ${e} veio cedo demais`);
      mock.timers.tick(1);
      agora = alvo;
      assert.equal(disparos.filter((x) => x === e).length, 1, `estagio ${e} na batida ${b}`);
    }
  }));

test("cancelar limpa os timers pendentes; cancelar de novo nao lanca", () =>
  comRelogio((t0) => {
    const disparos = [];
    const agenda = scheduleStages(TIMELINE, t0, (e) => disparos.push(e), Date.now);
    mock.timers.tick(instante(getBeatTime(TIMELINE[2][0])) + 1);
    const before = disparos.length;
    assert.ok(before >= 1 && before < TIMELINE.length, "o cancelamento deve pegar a linha no meio");
    agenda.cancel();
    assert.doesNotThrow(() => agenda.cancel());
    mock.timers.tick(instante(getBeatTime(DO_IT_BEAT)) + MUSIC_END.duration);
    assert.equal(disparos.length, before, "nada dispara depois de cancelar");
  }));

test("cancelar antes do primeiro tick nao lanca e nao dispara nada", () =>
  comRelogio((t0) => {
    const disparos = [];
    const agenda = scheduleStages(TIMELINE, t0, (e) => disparos.push(e), Date.now);
    assert.doesNotThrow(() => agenda.cancel());
    mock.timers.tick(instante(getBeatTime(DO_IT_BEAT)) + MUSIC_END.duration);
    assert.deepEqual(disparos, []);
  }));

test("times: cada estagio marca t0 + getBeatTime(b)", () =>
  comRelogio((t0) => {
    const { times } = scheduleStages(TIMELINE, t0, () => {}, Date.now);
    for (const [b, e] of TIMELINE) assert.equal(times[e], t0 + getBeatTime(b));
  }));

test("reagendar depois de cancelar comeca limpo, sem eco do primeiro", () =>
  comRelogio((t0) => {
    const primeiro = [];
    const a = scheduleStages(TIMELINE, t0, (e) => primeiro.push(e), Date.now);
    mock.timers.tick(4000);
    a.cancel();
    const segundo = [];
    scheduleStages(TIMELINE, Date.now(), (e) => segundo.push(e), Date.now);
    mock.timers.tick(instante(getBeatTime(DO_IT_BEAT)) + 10);
    assert.deepEqual(
      primeiro,
      TIMELINE.filter(([b]) => getBeatTime(b) <= 4000).map(([, e]) => e),
    ); // o que já tinha caído até os 4000 ms
    assert.deepEqual(segundo, estagios);
  }));

test("scheduleStages roda sem window e sem performance.now (o relogio e injetado)", () =>
  comRelogio((t0) => {
    assert.equal(typeof globalThis.window, "undefined");
    const original = performance.now;
    performance.now = () => {
      throw new Error("performance.now nao deveria ser chamado");
    };
    try {
      const agenda = scheduleStages(TIMELINE, t0, () => {}, Date.now);
      agenda.cancel();
    } finally {
      performance.now = original;
    }
  }));

test("onStage recebe o numero do estagio, nao o indice da TIMELINE (TIMELINE sintetica esparsa)", () =>
  comRelogio((t0) => {
    const linhaSintetica = [
      [1, 7],
      [3, 4],
    ]; // índices 0 e 1, estágios 7 e 4
    const disparos = [];
    scheduleStages(linhaSintetica, t0, (e) => disparos.push(e), Date.now);
    mock.timers.tick(instante(getBeatTime(3)) + 1);
    assert.deepEqual(disparos, [7, 4]);
  }));
