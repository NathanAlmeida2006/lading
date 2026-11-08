// Agendador do video (src/secoes/video/agenda.js): cada estagio dispara na sua batida, atrasado nao acumula, cancelar limpa tudo.
// O relogio e falso (Date e setTimeout por mock.timers); a LINHA e a batida vem de tempo.js.
import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { agendar } from "../../src/secoes/video/agenda.js";
import { LINHA, batida, BATIDA_FACA, FIM_DA_MUSICA } from "../../src/secoes/video/tempo.js";

// Roda `fn(t0)` com Date e setTimeout falsos; `t0` e o relogio do clique. Sempre desfaz o mock.
function comRelogio(fn) {
  mock.timers.enable({ apis: ["setTimeout", "Date"] });
  try {
    fn(Date.now());
  } finally {
    mock.timers.reset();
  }
}

// Instante inteiro em que um timer de `x` ms dispara (o mock so anda em ms inteiros).
const instante = (x) => Math.ceil(x);
const estagios = LINHA.map(([, e]) => e);

test("cada estagio dispara na sua batida: nao antes, e exatamente uma vez", () => comRelogio((t0) => {
  const disparos = [];
  agendar(LINHA, t0, (e) => disparos.push(e), Date.now);
  let agora = 0;
  for (const [b, e] of LINHA) {
    const alvo = instante(batida(b));
    mock.timers.tick(alvo - 1 - agora);
    agora = alvo - 1;
    assert.ok(!disparos.includes(e), `estagio ${e} disparou antes da batida ${b}`);
    mock.timers.tick(1);
    agora = alvo;
    assert.equal(disparos.filter((x) => x === e).length, 1, `estagio ${e} deveria ter disparado uma vez na batida ${b}`);
  }
}));

test("os estagios saem na ordem da LINHA, uma vez cada, com o numero do estagio", () => comRelogio((t0) => {
  const disparos = [];
  agendar(LINHA, t0, (e) => disparos.push(e), Date.now);
  mock.timers.tick(instante(batida(BATIDA_FACA)) + 10);
  assert.deepEqual(disparos, estagios);
}));

test("estagio atrasado dispara no primeiro tick; os seguintes mantem o instante absoluto", () => comRelogio((t0) => {
  const ATRASO = 8300; // ja passaram as batidas 0, 6 e 10 (3230, 6255,2 e 8272 ms)
  const disparos = [];
  agendar(LINHA, t0 - ATRASO, (e) => disparos.push(e), Date.now);
  const passados = LINHA.filter(([b]) => batida(b) <= ATRASO).map(([, e]) => e);
  assert.ok(passados.length >= 2, "o atraso tem de cobrir mais de um estagio");
  mock.timers.tick(0);
  assert.deepEqual(disparos, passados);
  // Os restantes seguem no instante absoluto t0 + batida(b), nao a partir do disparo atrasado.
  let agora = ATRASO;
  for (const [b, e] of LINHA.filter(([b]) => batida(b) > ATRASO)) {
    const alvo = instante(batida(b));
    mock.timers.tick(alvo - 1 - agora);
    agora = alvo - 1;
    assert.ok(!disparos.includes(e), `estagio ${e} veio cedo demais`);
    mock.timers.tick(1);
    agora = alvo;
    assert.equal(disparos.filter((x) => x === e).length, 1, `estagio ${e} na batida ${b}`);
  }
}));

test("cancelar limpa os timers pendentes; cancelar de novo nao lanca", () => comRelogio((t0) => {
  const disparos = [];
  const agenda = agendar(LINHA, t0, (e) => disparos.push(e), Date.now);
  mock.timers.tick(instante(batida(LINHA[2][0])) + 1);
  const antes = disparos.length;
  assert.ok(antes >= 1 && antes < LINHA.length, "o cancelamento deve pegar a linha no meio");
  agenda.cancelar();
  assert.doesNotThrow(() => agenda.cancelar());
  mock.timers.tick(instante(batida(BATIDA_FACA)) + FIM_DA_MUSICA.duracao);
  assert.equal(disparos.length, antes, "nada dispara depois de cancelar");
}));

test("cancelar antes do primeiro tick nao lanca e nao dispara nada", () => comRelogio((t0) => {
  const disparos = [];
  const agenda = agendar(LINHA, t0, (e) => disparos.push(e), Date.now);
  assert.doesNotThrow(() => agenda.cancelar());
  mock.timers.tick(instante(batida(BATIDA_FACA)) + FIM_DA_MUSICA.duracao);
  assert.deepEqual(disparos, []);
}));

test("horas: cada estagio marca t0 + batida(b)", () => comRelogio((t0) => {
  const { horas } = agendar(LINHA, t0, () => {}, Date.now);
  for (const [b, e] of LINHA) assert.equal(horas[e], t0 + batida(b));
}));

test("reagendar depois de cancelar comeca limpo, sem eco do primeiro", () => comRelogio((t0) => {
  const primeiro = [];
  const a = agendar(LINHA, t0, (e) => primeiro.push(e), Date.now);
  mock.timers.tick(4000);
  a.cancelar();
  const segundo = [];
  agendar(LINHA, Date.now(), (e) => segundo.push(e), Date.now);
  mock.timers.tick(instante(batida(BATIDA_FACA)) + 10);
  assert.deepEqual(primeiro, [LINHA[0][1]]);
  assert.deepEqual(segundo, estagios);
}));

test("agendar roda sem window e sem performance.now (o relogio e injetado)", () => comRelogio((t0) => {
  assert.equal(typeof globalThis.window, "undefined");
  const original = performance.now;
  performance.now = () => { throw new Error("performance.now nao deveria ser chamado"); };
  try {
    const agenda = agendar(LINHA, t0, () => {}, Date.now);
    agenda.cancelar();
  } finally {
    performance.now = original;
  }
}));

test("aoEstagio recebe o numero do estagio, nao o indice da LINHA (LINHA sintetica esparsa)", () => comRelogio((t0) => {
  const linhaSintetica = [[1, 7], [3, 4]]; // indices 0 e 1, estagios 7 e 4
  const disparos = [];
  agendar(linhaSintetica, t0, (e) => disparos.push(e), Date.now);
  mock.timers.tick(instante(batida(3)) + 1);
  assert.deepEqual(disparos, [7, 4]);
}));
