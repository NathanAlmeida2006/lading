/**
 * O som do video: a musica (timing.js) e um unico efeito sonoro, o que abre o ultimo take. Um unico AudioContext vive na pagina:
 * `prepareSound()` o cria (suspenso) e baixa e decodifica a musica antes do clique, e `createSound()`, no clique, o retoma e
 * devolve `music`, `effect`, `fadeOutIn` e `stop`, agendados no relogio do audio, nao em setTimeout. Sem audio disponivel, tudo e mudo. A primeira falha vai ao console, uma vez.
 */
import { FINAL_EFFECT_URL, MUSIC_URL } from "./timing.js";

const VOLUME = 0.28; // o da musica (1 = o do arquivo): ela fica abaixo da voz da pagina
const EFFECT_VOLUME = 0.12; // o do efeito do ultimo take: o arquivo vem no maximo (0 dB), entao entra bem abaixo, so como um acento sobre a musica

let ctx = null, track = null, buffer = null, loading = null, effectBuffer = null, loadingEffect = null;
let failed = false; // so a primeira falha de audio vai ao console; o video segue mudo
const report = (error) => { if (!failed) { failed = true; console.error("som: falha de audio, o video segue sem som", error); } };

const ensure = () => {
  if (ctx && ctx.state !== "closed") return ctx;
  try {
    ctx = new AudioContext();
    track = ctx.createGain();
    track.connect(ctx.destination);
  } catch (error) { report(error); /* o video segue mudo */ }
  return ctx;
};

/**
 * Cria o contexto (suspenso, ainda sem som) e baixa e decodifica a musica e o efeito, para tocarem na hora. Se um download ou uma
 * decodificacao falhar, o que faltou e tentado de novo na proxima chamada (o replay chama de novo), em vez de a musica ficar muda
 * ate a pagina recarregar.
 * @returns {void}
 */
export function prepareSound() {
  if (!ensure()) return;
  const download = (url) => fetch(url).then((response) => { if (!response.ok) throw new Error(response.status); return response.arrayBuffer(); }).then((data) => ctx.decodeAudioData(data));
  if (!buffer && !loading) loading = download(MUSIC_URL).then((data) => { buffer = data; }).catch(report).finally(() => { loading = null; });
  if (!effectBuffer && !loadingEffect) loadingEffect = download(FINAL_EFFECT_URL).then((data) => { effectBuffer = data; }).catch(report).finally(() => { loadingEffect = null; });
}

/**
 * Cria a sessão de som de uma reprodução: a música, o efeito e o fade-out, agendados no relógio do áudio.
 * @returns {{music: Function, effect: Function, fadeOutIn: Function, stop: Function}} Os controles da sessão.
 */
export function createSound() {
  if (!ensure()) return { music() {}, effect() {}, fadeOutIn() {}, stop() {} };
  ctx.resume().catch(() => {});
  prepareSound(); // o que ainda nao chegou (ou falhou antes) e tentado de novo agora; `music` espera por ele
  const when = (delayMs) => ctx.currentTime + delayMs / 1000;
  let source = null, output = null, fadeOut = null, stopped = false, effectSource = null;
  const guard = (fn) => (...args) => { try { fn(...args); } catch (error) { report(error); } };
  // O fade-out agendado (`fadeOutIn`), aplicado assim que a musica existe e a fonte e o `saida` estao ligados. O ouvido ouve em
  // decibeis, e nao em ganho: um fade reto em ganho parece lento no comeco e despenca no fim. Aqui a queda e em dB, em S (comeca
  // e termina devagar): de 0 a -45 dB (abaixo disso ja nao se ouve, e assim a queda audivel dura quase toda a duracao), e o ultimo ponto e o silencio. Se a hora ja passou (a musica chegou tarde), segue do ponto certo.
  const applyFadeOut = () => {
    if (!source || !fadeOut) return;
    const now = ctx.currentTime, progress = Math.min(1, Math.max(0, (now - fadeOut.at) / fadeOut.duration));
    const curve = Float32Array.from({ length: 256 }, (_, k) => { const x = progress + (k / 255) * (1 - progress); return x >= 1 ? 0 : Math.pow(10, -2.25 * x * x * (3 - 2 * x)); });
    output.gain.setValueAtTime(curve[0], Math.max(now, fadeOut.at));
    if (progress < 1) output.gain.setValueCurveAtTime(curve, Math.max(now, fadeOut.at), fadeOut.duration * (1 - progress));
    source.stop(fadeOut.at + fadeOut.duration + 0.1);
  };
  return {
    /**
     * Toca a musica agora, do comeco do trecho, com fade-in de `fadeInMs` ms (uma curva suave, em S, de 0 a VOLUME). Se o
     * arquivo ainda nao chegou, ela entra assim que chegar, ja no ponto certo e na altura certa do fade (o video nao espera por ela).
     */
    music: guard((fadeInMs = 2000) => {
      const t0 = performance.now();
      const play = () => {
        if (!buffer || stopped) return;
        const elapsed = (performance.now() - t0) / 1000, total = fadeInMs / 1000;
        source = ctx.createBufferSource();
        source.buffer = buffer;
        const fadeIn = ctx.createGain();
        output = ctx.createGain();
        source.connect(fadeIn).connect(output).connect(track);
        if (elapsed >= total) fadeIn.gain.value = VOLUME;
        else {
          // smoothstep: sai do zero devagar, ganha corpo no meio e chega a VOLUME sem quina
          const curve = Float32Array.from({ length: 96 }, (_, k) => { const x = (elapsed + (k / 95) * (total - elapsed)) / total; return VOLUME * x * x * (3 - 2 * x); });
          fadeIn.gain.setValueAtTime(0, ctx.currentTime);
          fadeIn.gain.setValueCurveAtTime(curve, ctx.currentTime, total - elapsed);
        }
        source.start(0, elapsed);
        applyFadeOut();
      };
      // Sem o arquivo ainda: espera por ele e, se o download falhou, tenta mais uma vez.
      if (buffer) play();
      else loading?.then(() => { if (buffer) play(); else { prepareSound(); loading?.then(play); } });
    }),
    /** Toca o efeito sonoro do ultimo take (`rdr.mp3`), daqui a `delayMs` ms, por cima da musica. */
    effect: guard((delayMs) => {
      const t0 = ctx.currentTime;
      const play = () => {
        if (!effectBuffer || stopped) return;
        effectSource = ctx.createBufferSource();
        effectSource.buffer = effectBuffer;
        const volume = ctx.createGain();
        volume.gain.value = EFFECT_VOLUME;
        effectSource.connect(volume).connect(ctx.destination);
        effectSource.start(Math.max(ctx.currentTime, t0 + delayMs / 1000));
      };
      if (effectBuffer) play(); else loadingEffect?.then(play);
    }),
    /** Agenda o fade-out da musica: comeca daqui a `delayMs` ms e dura `duration` ms (curva suave, em dB), e a fonte para no fim. */
    fadeOutIn: guard((delayMs, duration = 1500) => {
      fadeOut = { at: when(delayMs), duration: duration / 1000 };
      applyFadeOut();
    }),
    /** Para a musica ja (replay, saida da pagina): um fade-out curto de `duration` ms. */
    stop: guard((duration = 250) => {
      stopped = true;
      effectSource?.stop();
      if (!output) return;
      const now = ctx.currentTime;
      output.gain.cancelScheduledValues(0);
      output.gain.setValueAtTime(output.gain.value, now);
      output.gain.linearRampToValueAtTime(0.0001, now + duration / 1000);
      source.stop(now + duration / 1000 + 0.05);
    }),
  };
}
