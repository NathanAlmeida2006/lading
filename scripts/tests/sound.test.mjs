// Som do vídeo (src/sections/video/sound.js) com AudioContext e fetch falsos: o `play` que roda depois do download fica sob o `guard`,
// e nada é agendado antes de o contexto retomar (ctx.currentTime só anda depois do resume).
import { test } from "node:test";
import assert from "node:assert/strict";

// Um mundo falso por teste: o módulo guarda o contexto e os buffers em variáveis de módulo, então cada teste importa uma cópia nova.
async function montar({ falhaNaFonte = false } = {}) {
  const fontes = [];
  const efeitos = { resume: null };
  const gain = () => ({
    gain: {
      value: 0,
      setValueAtTime() {},
      setValueCurveAtTime() {},
      cancelScheduledValues() {},
      linearRampToValueAtTime() {},
    },
    connect: (alvo) => alvo,
  });
  globalThis.AudioContext = class {
    state = "suspended";
    currentTime = 10;
    destination = {};
    createGain() {
      return gain();
    }
    createBufferSource() {
      if (falhaNaFonte) throw new Error("contexto fechado");
      const source = {
        connect: (alvo) => alvo,
        start: (...args) => (source.iniciada = args),
        stop() {},
      };
      fontes.push(source);
      return source;
    }
    decodeAudioData() {
      return Promise.resolve({});
    }
    resume() {
      return new Promise((resolve) => {
        efeitos.resume = () => {
          this.state = "running";
          resolve();
        };
      });
    }
    suspend() {
      efeitos.suspensoes = (efeitos.suspensoes ?? 0) + 1;
      this.state = "suspended";
      return Promise.resolve();
    }
  };
  let baixou;
  const baixado = new Promise((resolve) => {
    baixou = resolve;
  });
  globalThis.fetch = async () => {
    await baixado;
    return { ok: true, arrayBuffer: async () => new ArrayBuffer(8) };
  };
  const sound = await import(`../../src/sections/video/sound.js?${Math.random()}`);
  return {
    sound,
    fontes,
    efeitos,
    baixou,
    esperar: () => new Promise((resolve) => setTimeout(resolve, 20)),
  };
}

test("o play que roda depois do download esta sob o guard: falha vai ao console e nao vira rejeicao solta", async () => {
  const { sound, efeitos, baixou, esperar } = await montar({ falhaNaFonte: true });
  const erros = [];
  const consoleError = console.error;
  console.error = (...args) => erros.push(args);
  let rejeicaoSolta = null;
  const aoRejeitar = (motivo) => {
    rejeicaoSolta = motivo;
  };
  process.on("unhandledRejection", aoRejeitar);
  try {
    sound.prepareSound();
    const sessao = sound.createSound();
    efeitos.resume();
    sessao.music(0);
    baixou();
    await esperar();
  } finally {
    console.error = consoleError;
    process.off("unhandledRejection", aoRejeitar);
  }
  assert.equal(rejeicaoSolta, null);
  assert.equal(erros.length, 1);
});

test("depois de stop(), o que termina de baixar nao toca (musica e efeito)", async () => {
  const { sound, fontes, efeitos, baixou, esperar } = await montar();
  sound.prepareSound();
  const sessao = sound.createSound();
  efeitos.resume();
  sessao.music(0);
  sessao.effect(0);
  sessao.stop(0);
  baixou();
  await esperar();
  assert.equal(fontes.length, 0);
});

test("nada e agendado antes de o contexto retomar; depois do resume, musica e efeito entram", async () => {
  const { sound, fontes, efeitos, baixou, esperar } = await montar();
  sound.prepareSound();
  baixou();
  await esperar(); // o arquivo já chegou: só o resume segura o som
  const sessao = sound.createSound();
  sessao.music(0);
  sessao.effect(5000);
  await esperar();
  assert.equal(fontes.length, 0);
  efeitos.resume();
  await esperar();
  assert.equal(fontes.length, 2);
  const [, inicio] = [fontes[0].iniciada, fontes[1].iniciada];
  assert.ok(
    inicio[0] > 10 && inicio[0] <= 15,
    `o efeito entra daqui a ~5 s do clique, e veio em ${inicio[0]}`,
  );
});

test("parar o som faz o contexto dormir depois do fade, se nenhuma sessao nova comecou", async () => {
  const { sound, efeitos } = await montar();
  const sessao = sound.createSound();
  efeitos.resume();
  sessao.stop(0);
  await new Promise((resolve) => setTimeout(resolve, 150));
  assert.equal(efeitos.suspensoes, 1);
});

test("uma sessao nova antes do fim do fade nao e posta para dormir", async () => {
  const { sound, efeitos } = await montar();
  const sessao = sound.createSound();
  efeitos.resume();
  sessao.stop(0);
  sound.createSound();
  await new Promise((resolve) => setTimeout(resolve, 150));
  assert.equal(efeitos.suspensoes ?? 0, 0);
});
