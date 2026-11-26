import { useEffect, useState } from "react";
import { INDEX_SECTION_IDS } from "../../content/sections.js";
import { padTwoDigits } from "../../app/ui.js";

/**
 * Paginação fixa "03 / 10", no canto.
 *
 * Vem direto da engenharia reversa, onde o carrossel do Burocratik trata o
 * número da página como elemento de design. Aqui ele diz onde o
 * visitante está numa página longa, e é micro-registro técnico: o token
 * `mono-reg` existe exatamente para isso.
 *
 * `mix-blend-mode: difference` resolve a legibilidade sobre os dois
 * temas sem duplicar o elemento por bloco.
 *
 * NÃO usa IntersectionObserver, e a razão é a pilha de seções. Numa página de
 * rolagem comum "que seção está na tela" é uma pergunta que o observador
 * responde bem. Numa pilha, toda seção já alcançada continua GRUDADA e
 * intersecta a faixa do meio para sempre: as dez respondem sim ao mesmo tempo
 * e o contador trava em `10 / 10` na primeira rolagem. Foi o que aconteceu, e o
 * defeito é silencioso porque o número continua plausível.
 *
 * A pergunta certa na pilha não é quem intersecta, e QUEM ESTÁ POR CIMA - que é
 * sempre a última camada a alcançar o alto da tela, e isso se lê direto da
 * geometria. A mesma regra vale na página sem pilha (movimento reduzido), onde
 * a última seção acima do meio da tela é justamente a que se está lendo, então
 * não há dois caminhos para manter.
 * @returns {JSX.Element} O contador "NN / NN", sempre a seção que está por cima.
 */
export function FixedIndex() {
  const [current, setCurrent] = useState(1);

  useEffect(() => {
    const sections = INDEX_SECTION_IDS.map((id) => document.getElementById(id)).filter(Boolean);
    if (!sections.length) return;

    // Nenhuma leitura de layout no caminho da rolagem. A posição de cada seção NO DOCUMENTO só muda
    // quando a página muda de tamanho, e quem avisa é o `ResizeObserver` (que entrega depois do
    // layout, com ele limpo). Antes eram dez `getBoundingClientRect` por quadro, lidos DEPOIS de
    // o Lenis e o anime.js escreverem estilo no mesmo quadro: cada rodada forçava um recalculo
    // de estilo síncrono dentro do `requestAnimationFrame`. Agora a conta é `topo - scrollY`, e o
    // `scrollY` se lê dentro do evento de rolagem, que roda antes de qualquer escrita do quadro.
    let tops = [];
    let middle = 0;

    const chooseCurrent = () => {
      const y = window.scrollY;
      let top = 0;
      for (const [index, position] of tops.entries()) {
        if (position - y <= middle) top = index;
      }
      setCurrent(top + 1);
    };

    const measure = () => {
      const y = window.scrollY;
      tops = sections.map((section) => section.getBoundingClientRect().top + y);
      middle = window.innerHeight / 2;
      chooseCurrent();
    };

    const handleResize = () => {
      middle = window.innerHeight / 2;
      chooseCurrent();
    };

    const sizeObserver = new ResizeObserver(measure);
    for (const section of sections) sizeObserver.observe(section);
    window.addEventListener("scroll", chooseCurrent, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });
    return () => {
      sizeObserver.disconnect();
      window.removeEventListener("scroll", chooseCurrent);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Some com o aviso de cookies e em tela de 380px ou menos. A altura medida da
  // doca inclui quebra de linha e safe-area; o índice conserva um respiro acima dela.
  return (
    <div
      className="fixed bottom-4 left-4 z-5 font-tertiary text-mono-reg tabular-nums tracking-[0.08em] text-bone-pure mix-blend-difference pointer-events-none transition-[bottom] duration-(--motion-base) ease-(--ease-cut-2) [.com-doca_&]:bottom-[calc(var(--dock-height,--spacing(24))+--spacing(3))] tela-estreita:hidden"
      aria-hidden="true"
    >
      {padTwoDigits(current)} / {padTwoDigits(INDEX_SECTION_IDS.length)}
    </div>
  );
}
