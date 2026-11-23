// PostHog (src/infra/posthog.js): injeta so com aceite, chave e host; opt-in a cada aceite; recusa apaga o que o SDK gravou; evento so sai com aceite e SDK desta carga.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CONFIG, readTrackerEnv } from "../../src/infra/config.js";
import { createPostHog, stripEventUrls } from "../../src/infra/posthog.js";

const fakeStorage = (map) => ({
  get length() { return map.size; },
  key: (i) => [...map.keys()][i] ?? null,
  getItem: (k) => map.get(k) ?? null,
  setItem: (k, v) => map.set(k, String(v)),
  removeItem: (k) => map.delete(k),
});

// Janela, document e chave/host de teste; `restaurar` devolve o CONFIG e apaga os globais.
function ambiente({ cookie = "", local = new Map(), sessao = new Map() } = {}) {
  const original = { ...CONFIG.posthog };
  CONFIG.posthog.key = "phc_teste";
  CONFIG.posthog.host = "https://us.i.posthog.com";
  const scripts = [];
  const cookies = [];
  globalThis.window = { location: { hostname: "www.lithium.app.br" }, localStorage: fakeStorage(local), sessionStorage: fakeStorage(sessao) };
  globalThis.document = {
    createElement: () => ({}),
    head: { appendChild: (el) => scripts.push(el) },
    get cookie() { return cookie; },
    set cookie(valor) { cookies.push(valor); },
  };
  return {
    scripts,
    cookies,
    local,
    sessao,
    fila: () => [...(window.posthog ?? [])].map((a) => [...a]),
    restaurar: () => {
      Object.assign(CONFIG.posthog, original);
      delete globalThis.window;
      delete globalThis.document;
    },
  };
}

// Expiracao gravada pelo navegador: o nome, `path=/` e, quando dado, o `domain`.
const expirou = (cookies, nome, dominio) =>
  cookies.some((c) => c.startsWith(`${nome}=; expires=Thu, 01 Jan 1970`) && c.endsWith(dominio ? `path=/; domain=${dominio}` : "path=/"));

test("sem aceite, sem chave ou sem host nada e injetado", () => {
  const combinacoes = [[null, "phc_teste", "https://us.i.posthog.com"], [false, "phc_teste", "https://us.i.posthog.com"], [true, null, "https://us.i.posthog.com"], [true, "phc_teste", null]];
  for (const [consent, key, host] of combinacoes) {
    const amb = ambiente();
    try {
      CONFIG.posthog.key = key;
      CONFIG.posthog.host = host;
      createPostHog(() => consent).loadPostHog();
      assert.equal(amb.scripts.length, 0, `${consent} ${key} ${host}`);
      assert.equal(globalThis.window.posthog, undefined);
    } finally { amb.restaurar(); }
  }
});

test("com aceite: um script so, init fora por padrao e opt_in a cada aceite", () => {
  const amb = ambiente();
  try {
    const ph = createPostHog(() => true);
    ph.loadPostHog();
    ph.loadPostHog();
    assert.equal(amb.scripts.length, 1);
    assert.equal(amb.scripts[0].src, "https://us.i.posthog.com/static/array.js");
    const [token, opcoes] = globalThis.window.posthog._i[0];
    assert.equal(token, "phc_teste");
    assert.equal(opcoes.opt_out_capturing_by_default, true);
    assert.equal(opcoes.opt_out_persistence_by_default, true);
    assert.equal(opcoes.before_send, stripEventUrls);
    assert.deepEqual(amb.fila().map((a) => a[0]), ["opt_in_capturing", "opt_in_capturing"]);
  } finally { amb.restaurar(); }
});

test("aceitar e retirar: opt_out, eventos param e o que o PostHog gravou some", () => {
  const local = new Map([["ph_phc_teste_posthog", "x"], ["__ph_opt_in_out_phc_teste", "1"], ["fluor:outra", "2"]]);
  const amb = ambiente({ cookie: "ph_phc_teste_posthog=abc; _ga=1", local });
  try {
    let aceite = true;
    const ph = createPostHog(() => aceite);
    ph.loadPostHog();
    aceite = null;
    ph.loadPostHog();
    ph.capture("checkout_started");
    assert.deepEqual(amb.fila().map((a) => a[0]), ["opt_in_capturing", "opt_out_capturing"]);
    assert.ok(expirou(amb.cookies, "ph_phc_teste_posthog", undefined), "host puro");
    assert.ok(expirou(amb.cookies, "ph_phc_teste_posthog", "www.lithium.app.br"), "subdominio");
    assert.ok(expirou(amb.cookies, "ph_phc_teste_posthog", "lithium.app.br"), "dominio registravel");
    assert.equal(amb.cookies.some((c) => c.startsWith("_ga=")), false);
    assert.deepEqual([...local.keys()], ["fluor:outra"]);
  } finally { amb.restaurar(); }
});

test("recusa fria (false, sem SDK nesta carga): nenhum script, e o que uma visita anterior gravou some", () => {
  const local = new Map([["ph_phc_velho_posthog", "x"], ["__ph_opt_in_out_phc_velho", "1"]]);
  const sessao = new Map([["ph_phc_velho_window_id", "x"], ["fluor:consentimento", "false"]]);
  const amb = ambiente({ cookie: "ph_phc_velho_posthog=abc", local, sessao });
  try {
    createPostHog(() => false).loadPostHog();
    assert.equal(amb.scripts.length, 0);
    assert.ok(expirou(amb.cookies, "ph_phc_velho_posthog", "lithium.app.br"));
    assert.equal(local.size, 0);
    assert.deepEqual([...sessao.keys()], ["fluor:consentimento"]);
  } finally { amb.restaurar(); }
});

test("sem resposta (null) e sem SDK nesta carga: nada e apagado", () => {
  const local = new Map([["ph_phc_teste_posthog", "x"], ["__ph_opt_in_out_phc_teste", "1"]]);
  const amb = ambiente({ cookie: "ph_phc_teste_posthog=abc", local });
  try {
    createPostHog(() => null).loadPostHog();
    assert.equal(amb.cookies.length, 0);
    assert.equal(local.size, 2);
  } finally { amb.restaurar(); }
});

test("capture e captureLog so saem com aceite e com o SDK desta carga", () => {
  const amb = ambiente();
  try {
    let aceite = false;
    const ph = createPostHog(() => aceite);
    ph.capture("antes");
    aceite = true;
    ph.capture("sem_sdk");
    ph.loadPostHog();
    ph.capture("faq_opened", { faq_position: 2 });
    ph.captureLog({ body: "x", level: "info" });
    assert.deepEqual(amb.fila(), [["opt_in_capturing"], ["capture", "faq_opened", { faq_position: 2 }], ["captureLog", { body: "x", level: "info" }]]);
  } finally { amb.restaurar(); }
});

test("before_send: query e hash saem das URLs do evento; $direct e o resto ficam", () => {
  const evento = stripEventUrls({
    properties: { $current_url: "https://lithium.app.br/?email=a%40b.com#x", $referrer: "https://mail.exemplo.com/inbox?token=abc", $referring_domain: "mail.exemplo.com", faq_position: 2 },
    $set_once: { $initial_current_url: "https://lithium.app.br/?token=1", $initial_referrer: "$direct" },
  });
  assert.equal(evento.properties.$current_url, "https://lithium.app.br/");
  assert.equal(evento.properties.$referrer, "https://mail.exemplo.com/inbox");
  assert.equal(evento.properties.$referring_domain, "mail.exemplo.com");
  assert.equal(evento.properties.faq_position, 2);
  assert.equal(evento.$set_once.$initial_current_url, "https://lithium.app.br/");
  assert.equal(evento.$set_once.$initial_referrer, "$direct");
  assert.equal(stripEventUrls(null), null);
});

test("readTrackerEnv: so producao ou VITE_ENABLE_PIXEL_DEV liberam, e vazio vira null (a mesma trava dos tres rastreadores)", () => {
  assert.equal(readTrackerEnv({ PROD: true, VITE_POSTHOG_KEY: " phc_x " }, "VITE_POSTHOG_KEY"), "phc_x");
  assert.equal(readTrackerEnv({ PROD: false, DEV: true, VITE_POSTHOG_KEY: "phc_x" }, "VITE_POSTHOG_KEY"), null);
  assert.equal(readTrackerEnv({ DEV: true, VITE_ENABLE_PIXEL_DEV: "1", VITE_POSTHOG_KEY: "phc_x" }, "VITE_POSTHOG_KEY"), "phc_x");
  assert.equal(readTrackerEnv({ PROD: true, VITE_POSTHOG_KEY: "  " }, "VITE_POSTHOG_KEY"), null);
  assert.equal(readTrackerEnv(undefined, "VITE_POSTHOG_KEY"), null);
});

test("config.js le as quatro variaveis dos rastreadores pela mesma trava, e o client.jsx nao carrega o PostHog por conta propria", () => {
  const config = readFileSync(new URL("../../src/infra/config.js", import.meta.url), "utf8");
  for (const chamada of ['readTrackerEnv(ENV, "VITE_META_PIXEL_ID")', 'readTrackerEnv(ENV, "VITE_CLARITY_ID")', 'readTrackerEnv(ENV, "VITE_POSTHOG_KEY")', 'readTrackerEnv(ENV, "VITE_POSTHOG_HOST")']) {
    assert.ok(config.includes(chamada), chamada);
  }
  const client = readFileSync(new URL("../../src/entries/client.jsx", import.meta.url), "utf8");
  assert.doesNotMatch(client, /posthog/i);
});

test("a gravacao de sessao do PostHog sai desligada no init (o Clarity e o gravador)", () => {
  const amb = ambiente();
  try {
    createPostHog(() => true).loadPostHog();
    assert.equal(globalThis.window.posthog._i[0][1].disable_session_recording, true);
  } finally { amb.restaurar(); }
});

test("aceite sem chave ou sem host avisa uma vez no console", () => {
  const amb = ambiente();
  const original = console.warn;
  const avisos = [];
  console.warn = (mensagem) => avisos.push(mensagem);
  try {
    CONFIG.posthog.key = null;
    const ph = createPostHog(() => true);
    ph.loadPostHog();
    ph.loadPostHog();
    assert.equal(amb.scripts.length, 0);
    assert.equal(avisos.length, 1);
  } finally {
    console.warn = original;
    amb.restaurar();
  }
});

test("script bloqueado (onerror): a fila para e nada e tentado de novo", () => {
  const amb = ambiente();
  const original = console.warn;
  const avisos = [];
  console.warn = (mensagem) => avisos.push(mensagem);
  try {
    const ph = createPostHog(() => true);
    ph.loadPostHog();
    amb.scripts[0].onerror();
    ph.capture("depois");
    ph.loadPostHog();
    assert.equal(amb.scripts.length, 1);
    assert.deepEqual(amb.fila().map((a) => a[0]), ["opt_in_capturing"]);
    assert.equal(avisos.length, 1);
  } finally {
    console.warn = original;
    amb.restaurar();
  }
});

test("host invalido (nao URL ou sem https) avisa uma vez, nao injeta e nao tenta de novo", () => {
  for (const host of ["nao-e-url", "http://us.i.posthog.com"]) {
    const amb = ambiente();
    const original = console.warn;
    const avisos = [];
    console.warn = (mensagem) => avisos.push(mensagem);
    try {
      CONFIG.posthog.host = host;
      const ph = createPostHog(() => true);
      ph.loadPostHog();
      ph.loadPostHog();
      assert.equal(amb.scripts.length, 0, host);
      assert.equal(globalThis.window.posthog, undefined, host);
      assert.equal(avisos.length, 1, host);
    } finally {
      console.warn = original;
      amb.restaurar();
    }
  }
});

// "Uma vez so": depois da falha, a carga nem volta a ler o host (a URL nao e analisada de novo a cada resposta do aviso).
test("host invalido e lido uma vez so: depois da falha, as respostas seguintes nao tentam de novo", () => {
  const amb = ambiente();
  const original = console.warn;
  console.warn = () => {};
  let leituras = 0;
  try {
    Object.defineProperty(CONFIG.posthog, "host", { get: () => { leituras++; return "nao-e-url"; }, configurable: true });
    const ph = createPostHog(() => true);
    ph.loadPostHog();
    ph.loadPostHog();
    ph.loadPostHog();
    assert.equal(leituras, 1);
  } finally {
    Object.defineProperty(CONFIG.posthog, "host", { value: null, writable: true, enumerable: true, configurable: true });
    console.warn = original;
    amb.restaurar();
  }
});

test("window.posthog de outra origem nao e sobrescrito nem usado", () => {
  const amb = ambiente();
  try {
    const alheio = { capture() { throw new Error("alheio"); } };
    globalThis.window.posthog = alheio;
    const ph = createPostHog(() => true);
    ph.loadPostHog();
    ph.capture("x");
    assert.equal(amb.scripts.length, 0);
    assert.equal(globalThis.window.posthog, alheio);
  } finally { amb.restaurar(); }
});
