/**
 * Entrada das páginas legais (privacidade.html e termos.html): o mesmo scroll (Lenis) e o mesmo campo de
 * pontos `estelar` da landing, sem React. Build próprio: vite.documentos.config.js.
 */
import { coresDoCampo, ligarCampo } from "./motion/campo.js";
import { aoMudarPausa, definirPausa, estaPausado } from "./motion/pausa.js";
import { ligarLenis } from "./motion/rolagem.js";
import { semMovimento } from "./motion/tokens.js";

ligarLenis();

// Marca a aba: a landing, ao reabrir, nao repete a cortina nem a entrada do heroi (index.html).
try {
  sessionStorage.setItem("fluor:de-documento", "1");
} catch {
  /* armazenamento bloqueado: a landing abre com a introducao, como sempre */
}

const reduzido = semMovimento();

const raiz = document.querySelector(".campos");
if (raiz) {
  ligarCampo(raiz, {
    variante: "estelar",
    reduzido,
    cores: coresDoCampo(),
  });
}

// WCAG 2.2.2: o campo anda sozinho por mais de 5 s. Fora da tela até receber foco; sob movimento reduzido
// não há o que pausar.
const botao = document.querySelector(".pausa");
if (botao && !reduzido) {
  botao.hidden = false;
  botao.addEventListener("click", () => definirPausa(!estaPausado()));
  aoMudarPausa((pausado) => {
    botao.setAttribute("aria-pressed", String(pausado));
    botao.textContent = pausado ? "Retomar animações" : "Pausar animações";
  });
}
