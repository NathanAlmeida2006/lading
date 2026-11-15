/**
 * Entrada das páginas legais (privacidade.html e termos.html): o mesmo scroll (Lenis) e o mesmo campo de
 * pontos `estelar` da landing, sem React. Build próprio: vite.documents.config.js.
 */
import "../styles/documents.css";
import { getFieldColors, startField } from "../sensory/field.js";
import { subscribeToPause, setPaused, isPaused } from "../sensory/pause.js";
import { startLenis } from "../sensory/scroll.js";
import { isMotionReduced, isTouchPointer } from "../sensory/tokens.js";
import { writeSessionValue } from "../infra/storage.js";

startLenis();

// Marca a aba: a landing, ao reabrir, nao repete a cortina nem a entrada do heroi (index.html le a chave crua "1";
// o numero 1 serializado como JSON e exatamente esse texto). Armazenamento bloqueado: a landing abre com a introducao.
writeSessionValue("fluor:de-documento", 1);

const isReduced = isMotionReduced();

const root = document.querySelector(".campos");
if (root) {
  startField(root, {
    variant: "estelar",
    isReduced: isReduced,
    isTouch: isTouchPointer(),
    colors: getFieldColors(),
  });
}

// WCAG 2.2.2: o campo anda sozinho por mais de 5 s. Fora da tela até receber foco; sob movimento reduzido
// não há o que pausar.
const button = document.querySelector(".pausa");
if (button && !isReduced) {
  button.hidden = false;
  button.addEventListener("click", () => setPaused(!isPaused()));
  subscribeToPause((isPausedNow) => {
    button.setAttribute("aria-pressed", String(isPausedNow));
    button.textContent = isPausedNow ? "Retomar animações" : "Pausar animações";
  });
}
