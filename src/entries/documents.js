/**
 * Entrada das páginas legais (privacidade.html e termos.html): o mesmo scroll (Lenis) e o mesmo campo de
 * pontos `estelar` da landing, sem React. Build próprio: vite.documents.config.js.
 */
import "../styles/documents.css";
import { getFieldColors, startField } from "../sensory/field.js";
import { subscribeToPause, setPaused, isPaused } from "../sensory/pause.js";
import { startLenis } from "../sensory/scroll.js";
import { isMotionReduced } from "../sensory/tokens.js";

startLenis();

// Marca a aba: a landing, ao reabrir, nao repete a cortina nem a entrada do heroi (index.html).
try {
  sessionStorage.setItem("fluor:de-documento", "1");
} catch {
  /* armazenamento bloqueado: a landing abre com a introducao, como sempre */
}

const isReduced = isMotionReduced();

const root = document.querySelector(".campos");
if (root) {
  startField(root, {
    variant: "estelar",
    isReduced: isReduced,
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
