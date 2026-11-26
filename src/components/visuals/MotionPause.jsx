import { useSyncExternalStore } from "react";
import { subscribeToPause, setPaused, isPaused } from "../../sensory/pause.js";
import { KEYBOARD_TARGET } from "../../app/ui.js";

const serverSnapshot = () => false;

/**
 * Pausar e retomar o movimento (WCAG 2.2.2).
 *
 * Campos de pontos, seta e pontas soltas andam sozinhos por mais de 5 s ao
 * lado do texto. `prefers-reduced-motion` já os desliga para quem configurou o
 * sistema; este botão é para todos os outros. Como o "pular para o conteúdo", fica
 * fora da tela até receber foco: o desenho da página não ganha nenhum controle, e quem
 * navega por teclado ou leitor de tela o encontra logo no início.
 * @returns {JSX.Element} Botão de pausar e retomar, que informa o estado com aria-pressed.
 */
export function MotionPause() {
  // O estado mora em sensory/pause.js (o laço dos campos também o lê); aqui só se lê e se alterna.
  const isPausedNow = useSyncExternalStore(subscribeToPause, isPaused, serverSnapshot);

  return (
    <button
      type="button"
      className={`${KEYBOARD_TARGET} cursor-pointer`}
      aria-pressed={isPausedNow}
      onClick={() => setPaused(!isPausedNow)}
    >
      {isPausedNow ? "Retomar animações" : "Pausar animações"}
    </button>
  );
}
