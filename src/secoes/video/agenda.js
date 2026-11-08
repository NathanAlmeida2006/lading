import { useEffect, useRef } from "react";
import { batida } from "./tempo.js";

/**
 * Agenda um `aoEstagio(estagio)` por [batida, estagio] da `linha`, no relogio do clique (`t0`, na escala de `agora`), e nao em cadeia:
 * nenhum estagio depende do anterior. Devolve a hora prevista de cada estagio (`horas`: quem anima por dentro conta dela), os timers
 * e `cancelar` (idempotente). `agora` e injetavel so para teste.
 */
export function agendar(linha, t0, aoEstagio, agora = () => performance.now()) {
  const horas = {};
  const relogios = linha.map(([b, e]) => {
    horas[e] = t0 + batida(b);
    return setTimeout(() => aoEstagio(e), batida(b) - (agora() - t0));
  });
  return { horas, relogios, cancelar: () => relogios.forEach(clearTimeout) };
}

/** O hook fino de Video.jsx: guarda os timers da rodada, limpa a anterior e ao desmontar. `depois` agenda um extra na mesma lista. */
export function useLinhaDoTempo(aoEstagio) {
  const relogios = useRef([]);
  const parar = () => { relogios.current.forEach(clearTimeout); relogios.current = []; };
  useEffect(() => parar, []);
  const iniciar = (linha, t0) => {
    parar();
    const { horas, relogios: novos } = agendar(linha, t0, aoEstagio, () => performance.now());
    relogios.current = novos;
    return horas;
  };
  const depois = (ms, f) => { relogios.current.push(setTimeout(f, ms)); };
  return { iniciar, depois, parar };
}
