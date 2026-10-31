import { useSyncExternalStore } from "react";
import { aoMudarPausa, definirPausa, estaPausado } from "../motion/pausa.js";
import { alvoDeTeclado } from "../ui.js";

const semPausaNoServidor = () => false;

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
  // O estado mora em motion/pausa.js (o laco dos campos tambem o le); aqui so se le e se alterna.
  const pausado = useSyncExternalStore(aoMudarPausa, estaPausado, semPausaNoServidor);

  return (
    <button
      type="button"
      className={`${alvoDeTeclado} cursor-pointer`}
      aria-pressed={pausado}
      onClick={() => definirPausa(!pausado)}
    >
      {pausado ? "Retomar animações" : "Pausar animações"}
    </button>
  );
}
