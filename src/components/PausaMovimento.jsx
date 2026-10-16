import { useState } from "react";
import { definirPausa } from "../motion/pausa.js";

/**
 * Pausar e retomar o movimento (WCAG 2.2.2).
 *
 * Campos de pontos, seta e pontas soltas andam sozinhos por mais de 5 s ao
 * lado do texto. `prefers-reduced-motion` ja os desliga para quem configurou o
 * sistema; este botao e para todos os outros. Como o "pular para o conteudo", fica
 * fora da tela ate receber foco: o desenho da pagina nao ganha nenhum controle, e quem
 * navega por teclado ou leitor de tela o encontra logo no inicio.
 */
export function PausaMovimento() {
  const [pausado, definirPausado] = useState(false);

  function alternar() {
    definirPausa(!pausado);
    definirPausado(!pausado);
  }

  return (
    <button
      type="button"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-10 focus:inline-flex focus:items-center focus:min-h-12 focus:px-4 focus:py-3 focus:bg-bone focus:text-void font-secundaria text-label uppercase cursor-pointer"
      aria-pressed={pausado}
      onClick={alternar}
    >
      {pausado ? "Retomar animações" : "Pausar animações"}
    </button>
  );
}
