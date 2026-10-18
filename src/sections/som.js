/**
 * O som do video: a musica (tempo.js) e um unico efeito sonoro, o que abre o ultimo take. Um unico AudioContext vive na pagina:
 * `prepararSom()` o cria (suspenso) e baixa e decodifica a musica antes do clique, e `criarSom()`, no clique, o retoma e
 * devolve `musica`, `efeito`, `apagarEm` e `parar`, agendados no relogio do audio, nao em setTimeout. Sem audio disponivel, tudo e mudo.
 */
import { EFEITO_FINAL, MUSICA } from "./tempo.js";

const VOLUME = 0.28; // o da musica (1 = o do arquivo): ela fica abaixo da voz da pagina
const VOLUME_EFEITO = 0.12; // o do efeito do ultimo take: o arquivo vem no maximo (0 dB), entao entra bem abaixo, so como um acento sobre a musica

let ctx = null, trilha = null, buffer = null, carregando = null, bufferEfeito = null, carregandoEfeito = null;

const garantir = () => {
  if (ctx && ctx.state !== "closed") return ctx;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    trilha = ctx.createGain();
    trilha.connect(ctx.destination);
  } catch { /* o video segue mudo */ }
  return ctx;
};

/**
 * Cria o contexto (suspenso, ainda sem som) e baixa e decodifica a musica e o efeito, para tocarem na hora. Se um download ou uma
 * decodificacao falhar, o que faltou e tentado de novo na proxima chamada (o replay chama de novo), em vez de a musica ficar muda
 * ate a pagina recarregar.
 */
export function prepararSom() {
  if (!garantir()) return;
  const baixar = (url) => fetch(url).then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }).then((b) => ctx.decodeAudioData(b));
  if (!buffer && !carregando) carregando = baixar(MUSICA).then((b) => { buffer = b; }).catch(() => {}).finally(() => { carregando = null; });
  if (!bufferEfeito && !carregandoEfeito) carregandoEfeito = baixar(EFEITO_FINAL).then((b) => { bufferEfeito = b; }).catch(() => {}).finally(() => { carregandoEfeito = null; });
}

export function criarSom() {
  if (!garantir()) return { musica() {}, efeito() {}, apagarEm() {}, parar() {} };
  ctx.resume().catch(() => {});
  prepararSom(); // o que ainda nao chegou (ou falhou antes) e tentado de novo agora; `musica` espera por ele
  const quando = (em) => ctx.currentTime + em / 1000;
  let fonte = null, saida = null, apagar = null, parado = false, efeito = null;
  const guard = (f) => (...a) => { try { f(...a); } catch { /* ignora */ } };
  // O fade-out agendado (`apagarEm`), aplicado assim que a musica existe e a fonte e o `saida` estao ligados. O ouvido ouve em
  // decibeis, e nao em ganho: um fade reto em ganho parece lento no comeco e despenca no fim. Aqui a queda e em dB, em S (comeca
  // e termina devagar): de 0 a -45 dB (abaixo disso ja nao se ouve, e assim a queda audivel dura quase os 7 s), e o ultimo ponto e o silencio. Se a hora ja passou (a musica chegou tarde), segue do ponto certo.
  const aplicarApagar = () => {
    if (!fonte || !apagar) return;
    const agora = ctx.currentTime, p = Math.min(1, Math.max(0, (agora - apagar.t) / apagar.dur));
    const curva = Float32Array.from({ length: 256 }, (_, k) => { const x = p + (k / 255) * (1 - p); return x >= 1 ? 0 : Math.pow(10, -2.25 * x * x * (3 - 2 * x)); });
    saida.gain.setValueAtTime(curva[0], Math.max(agora, apagar.t));
    if (p < 1) saida.gain.setValueCurveAtTime(curva, Math.max(agora, apagar.t), apagar.dur * (1 - p));
    fonte.stop(apagar.t + apagar.dur + 0.1);
  };
  return {
    /**
     * Toca a musica agora, do comeco do trecho, com fade-in de `entrada` ms (uma curva suave, em S, de 0 a VOLUME). Se o
     * arquivo ainda nao chegou, ela entra assim que chegar, ja no ponto certo e na altura certa do fade (o video nao espera por ela).
     */
    musica: guard((entrada = 2000) => {
      const t0 = performance.now();
      const tocar = () => {
        if (!buffer || parado) return;
        const decorrido = (performance.now() - t0) / 1000, total = entrada / 1000;
        fonte = ctx.createBufferSource();
        fonte.buffer = buffer;
        const subida = ctx.createGain();
        saida = ctx.createGain();
        fonte.connect(subida).connect(saida).connect(trilha);
        if (decorrido >= total) subida.gain.value = VOLUME;
        else {
          // smoothstep: sai do zero devagar, ganha corpo no meio e chega a VOLUME sem quina
          const curva = Float32Array.from({ length: 96 }, (_, k) => { const x = (decorrido + (k / 95) * (total - decorrido)) / total; return VOLUME * x * x * (3 - 2 * x); });
          subida.gain.setValueAtTime(0, ctx.currentTime);
          subida.gain.setValueCurveAtTime(curva, ctx.currentTime, total - decorrido);
        }
        fonte.start(0, decorrido);
        aplicarApagar();
      };
      // Sem o arquivo ainda: espera por ele e, se o download falhou, tenta mais uma vez.
      if (buffer) tocar();
      else carregando?.then(() => { if (buffer) tocar(); else { prepararSom(); carregando?.then(tocar); } });
    }),
    /** Toca o efeito sonoro do ultimo take (`rdr.mp3`), daqui a `em` ms, por cima da musica. */
    efeito: guard((em) => {
      const t0 = ctx.currentTime;
      const tocar = () => {
        if (!bufferEfeito || parado) return;
        efeito = ctx.createBufferSource();
        efeito.buffer = bufferEfeito;
        const volume = ctx.createGain();
        volume.gain.value = VOLUME_EFEITO;
        efeito.connect(volume).connect(ctx.destination);
        efeito.start(Math.max(ctx.currentTime, t0 + em / 1000));
      };
      if (bufferEfeito) tocar(); else carregandoEfeito?.then(tocar);
    }),
    /** Agenda o fade-out da musica: comeca daqui a `em` ms e dura `dur` ms (curva suave, em dB), e a fonte para no fim. */
    apagarEm: guard((em, dur = 1500) => {
      apagar = { t: quando(em), dur: dur / 1000 };
      aplicarApagar();
    }),
    /** Para a musica ja (replay, saida da pagina): um fade-out curto de `dur` ms. */
    parar: guard((dur = 250) => {
      parado = true;
      efeito?.stop();
      if (!saida) return;
      const agora = ctx.currentTime;
      saida.gain.cancelScheduledValues(0);
      saida.gain.setValueAtTime(saida.gain.value, agora);
      saida.gain.linearRampToValueAtTime(0.0001, agora + dur / 1000);
      fonte.stop(agora + dur / 1000 + 0.05);
    }),
  };
}
