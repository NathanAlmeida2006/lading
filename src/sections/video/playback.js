import { subscribeToPause } from "../../sensory/pause.js";

/**
 * Enquanto o vídeo toca, ele para sozinho quando o player sai inteiro da tela ou quando o visitante liga a pausa das
 * animações (WCAG 2.2.2). Parar leva junto a música, a linha do tempo e os laços 3D, e o vídeo nunca toca congelado: sob a
 * pausa, as animações de CSS deixavam os takes em branco com a música tocando.
 * @param {Element} player - A caixa do player.
 * @param {() => void} onStop - Para o vídeo.
 * @returns {() => void} Desliga a vigia.
 */
export function watchPlayback(player, onStop) {
  const observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) onStop();
  }, { threshold: 0 });
  observer.observe(player);
  const cancelPause = subscribeToPause((isPausedNow) => {
    if (isPausedNow) onStop();
  });
  return () => {
    observer.disconnect();
    cancelPause();
  };
}
