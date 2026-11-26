import { useEffect, useRef } from "react";
import { getBeatTime } from "./timing.js";

/**
 * Agenda um `onStage(stage)` por [batida, estágio] da `linha`, no relógio do clique (`t0`, na escala de `agora`), e não em cadeia:
 * nenhum estágio depende do anterior. Devolve a hora prevista de cada estágio (`horas`: quem anima por dentro conta dela), os timers
 * e `cancelar` (idempotente). `agora` é injetável só para teste.
 * @param {Array<[number, number]>} timeline - Pares [batida, estágio].
 * @param {number} t0 - Hora do clique, na escala de `now`.
 * @param {(stage: number) => void} onStage - Chamado em cada estágio.
 * @param {() => number} [now] - Relógio, injetável só para teste.
 * @returns {{times: Object<number, number>, timers: number[], cancel: () => void}}
 */
export function scheduleStages(timeline, t0, onStage, now = () => performance.now()) {
  const times = {};
  const timers = timeline.map(([beat, stage]) => {
    times[stage] = t0 + getBeatTime(beat);
    return setTimeout(() => onStage(stage), getBeatTime(beat) - (now() - t0));
  });
  return { times, timers, cancel: () => timers.forEach(clearTimeout) };
}

/**
 * O hook fino de Video.jsx: guarda os timers da rodada, limpa a anterior e ao desmontar. `depois` agenda um extra na mesma lista.
 * @param {(stage: number) => void} onStage - Chamado em cada estágio.
 * @returns {{start: Function, after: Function, stop: Function}}
 */
export function useTimeline(onStage) {
  const timers = useRef([]);
  const stop = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => stop, []);
  const start = (timeline, t0) => {
    stop();
    const { times, timers: next } = scheduleStages(timeline, t0, onStage, () => performance.now());
    timers.current = next;
    return times;
  };
  const after = (ms, fn) => {
    timers.current.push(setTimeout(fn, ms));
  };
  return { start, after, stop };
}
