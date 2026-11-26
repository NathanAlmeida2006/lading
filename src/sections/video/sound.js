/**
 * O som do vídeo: a música (timing.js) é um único efeito sonoro, o que abre o último take. Um único AudioContext vive na página:
 * `prepareSound()` o cria (suspenso) e baixa e decodifica a música antes do clique, e `createSound()`, no clique, o retoma e
 * devolve `music`, `effect`, `fadeOutIn` e `stop`, agendados no relógio do áudio, não em setTimeout. Sem áudio disponível, tudo é mudo. A primeira falha vai ao console, uma vez. Parado, o contexto dorme (`suspend`) até o próximo play.
 */
import { FINAL_EFFECT_URL, MUSIC_URL } from "./timing.js";

const VOLUME = 0.28; // o da música (1 = o do arquivo): ela fica abaixo da voz da página
const EFFECT_VOLUME = 0.12; // o do efeito do último take: o arquivo vem no máximo (0 dB), então entra bem abaixo, só como um acento sobre a música

let ctx = null;
let track = null;
let buffer = null;
let loading = null;
let effectBuffer = null;
let loadingEffect = null;
let failed = false; // só a primeira falha de áudio vai ao console; o vídeo segue mudo
let session = 0; // a sessão de som atual: o stop de uma sessão antiga não põe para dormir o contexto de uma nova
const report = (error) => {
  if (!failed) {
    failed = true;
    console.error("som: falha de audio, o video segue sem som", error);
  }
};

const ensure = () => {
  if (ctx && ctx.state !== "closed") return ctx;
  try {
    ctx = new AudioContext();
    track = ctx.createGain();
    track.connect(ctx.destination);
  } catch (error) {
    report(error); /* o vídeo segue mudo */
  }
  return ctx;
};

/**
 * Cria o contexto (suspenso, ainda sem som) e baixa e decodifica a música e o efeito, para tocarem na hora. Se um download ou uma
 * decodificação falhar, o que faltou é tentado de novo na próxima chamada (o replay chama de novo), em vez de a música ficar muda
 * até a página recarregar.
 * @returns {void}
 */
export function prepareSound() {
  if (!ensure()) return;
  const download = (url) =>
    fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error(response.status);
        return response.arrayBuffer();
      })
      .then((data) => ctx.decodeAudioData(data));
  if (!buffer && !loading)
    loading = download(MUSIC_URL)
      .then((data) => {
        buffer = data;
      })
      .catch(report)
      .finally(() => {
        loading = null;
      });
  if (!effectBuffer && !loadingEffect)
    loadingEffect = download(FINAL_EFFECT_URL)
      .then((data) => {
        effectBuffer = data;
      })
      .catch(report)
      .finally(() => {
        loadingEffect = null;
      });
}

/**
 * Cria a sessão de som de uma reprodução: a música, o efeito e o fade-out, agendados no relógio do áudio.
 * @returns {{music: Function, effect: Function, fadeOutIn: Function, stop: Function}} Os controles da sessão.
 */
export function createSound() {
  if (!ensure()) return { music() {}, effect() {}, fadeOutIn() {}, stop() {} };
  const id = ++session;
  // `ctx.currentTime` só anda depois do resume: nada se agenda antes dele, e o que já passou desde o clique (`t0`) sai do atraso, para o som não ficar atrás do vídeo.
  const t0 = performance.now();
  const ready = ctx.resume().catch(() => {});
  prepareSound(); // o que ainda não chegou (ou falhou antes) é tentado de novo agora; `music` espera por ele
  const when = (delayMs) =>
    ctx.currentTime + Math.max(0, delayMs - (performance.now() - t0)) / 1000;
  let source = null;
  let output = null;
  let fadeOut = null;
  let stopped = false;
  let effectSource = null;
  const guard =
    (fn) =>
    (...args) => {
      try {
        fn(...args);
      } catch (error) {
        report(error);
      }
    };
  // O fade-out agendado (`fadeOutIn`), aplicado assim que a música existe e a fonte e o `saida` estão ligados. O ouvido ouve em
  // decibéis, e não em ganho: um fade reto em ganho parece lento no começo e despenca no fim. Aqui a queda é em dB, em S (começa
  // e termina devagar): de 0 a -45 dB (abaixo disso já não se ouve, e assim a queda audível dura quase toda a duração), e o último ponto é o silêncio. Se a hora já passou (a música chegou tarde), segue do ponto certo.
  const applyFadeOut = () => {
    if (!source || !fadeOut) return;
    const now = ctx.currentTime;
    const progress = Math.min(1, Math.max(0, (now - fadeOut.at) / fadeOut.duration));
    const curve = Float32Array.from({ length: 256 }, (_, k) => {
      const x = progress + (k / 255) * (1 - progress);
      return x >= 1 ? 0 : Math.pow(10, -2.25 * x * x * (3 - 2 * x));
    });
    output.gain.setValueAtTime(curve[0], Math.max(now, fadeOut.at));
    if (progress < 1)
      output.gain.setValueCurveAtTime(
        curve,
        Math.max(now, fadeOut.at),
        fadeOut.duration * (1 - progress),
      );
    source.stop(fadeOut.at + fadeOut.duration + 0.1);
  };
  return {
    /**
     * Toca a música agora, do começo do trecho, com fade-in de `fadeInMs` ms (uma curva suave, em S, de 0 a VOLUME). Se o
     * arquivo ainda não chegou, ela entra assim que chegar, já no ponto certo e na altura certa do fade (o vídeo não espera por ela).
     */
    music: guard((fadeInMs = 2000) => {
      const musicT0 = performance.now();
      const play = guard(() => {
        if (!buffer || stopped) return;
        const elapsed = (performance.now() - musicT0) / 1000;
        const total = fadeInMs / 1000;
        source = ctx.createBufferSource();
        source.buffer = buffer;
        const fadeIn = ctx.createGain();
        output = ctx.createGain();
        source.connect(fadeIn).connect(output).connect(track);
        if (elapsed >= total) fadeIn.gain.value = VOLUME;
        else {
          // smoothstep: sai do zero devagar, ganha corpo no meio e chega a VOLUME sem quina
          const curve = Float32Array.from({ length: 96 }, (_, k) => {
            const x = (elapsed + (k / 95) * (total - elapsed)) / total;
            return VOLUME * x * x * (3 - 2 * x);
          });
          fadeIn.gain.setValueAtTime(0, ctx.currentTime);
          fadeIn.gain.setValueCurveAtTime(curve, ctx.currentTime, total - elapsed);
        }
        source.start(0, elapsed);
        applyFadeOut();
      });
      // Sem o arquivo ainda: espera por ele e, se o download falhou, tenta mais uma vez. Em todo caminho o `play` roda sob o `guard`.
      if (buffer) ready.then(play);
      else
        loading?.then(() => {
          if (buffer) ready.then(play);
          else {
            prepareSound();
            loading?.then(() => ready).then(play);
          }
        });
    }),
    /** Toca o efeito sonoro do último take (`rdr.mp3`), daqui a `delayMs` ms, por cima da música. */
    effect: guard((delayMs) => {
      const play = guard(() => {
        if (!effectBuffer || stopped) return;
        effectSource = ctx.createBufferSource();
        effectSource.buffer = effectBuffer;
        const volume = ctx.createGain();
        volume.gain.value = EFFECT_VOLUME;
        effectSource.connect(volume).connect(ctx.destination);
        effectSource.start(when(delayMs));
      });
      if (effectBuffer) ready.then(play);
      else loadingEffect?.then(() => ready).then(play);
    }),
    /** Agenda o fade-out da música: começa daqui a `delayMs` ms e dura `duration` ms (curva suave, em dB), e a fonte para no fim. */
    fadeOutIn: guard((delayMs, duration = 1500) => {
      ready.then(
        guard(() => {
          fadeOut = { at: when(delayMs), duration: duration / 1000 };
          applyFadeOut();
        }),
      );
    }),
    /**
     * Para a música já (replay, parar, saída da tela ou da página): um fade-out curto de `duration` ms. Depois do fade, sem
     * sessão nova, o contexto de áudio dorme (`suspend`): nada de áudio rodando com o vídeo parado.
     */
    stop: guard((duration = 250) => {
      stopped = true;
      effectSource?.stop();
      if (output) {
        const now = ctx.currentTime;
        output.gain.cancelScheduledValues(0);
        output.gain.setValueAtTime(output.gain.value, now);
        output.gain.linearRampToValueAtTime(0.0001, now + duration / 1000);
        source.stop(now + duration / 1000 + 0.05);
      }
      setTimeout(() => {
        if (id !== session) return;
        try {
          void ctx.suspend().catch(() => {});
        } catch {
          /* sem suspend: o contexto segue acordado, mudo */
        }
      }, duration + 100);
    }),
  };
}
