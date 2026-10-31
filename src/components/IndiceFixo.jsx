import { useEffect, useState } from "react";
import { idsDoIndice } from "../secoes.js";
import { doisDigitos } from "../ui.js";

/**
 * Paginacao fixa "03 / 10", no canto.
 *
 * Vem direto da engenharia reversa, onde o carrossel do Burocratik trata o
 * numero da pagina como elemento de design. Aqui ele diz onde o
 * visitante esta numa pagina longa, e e micro-registro tecnico: o token
 * `mono-reg` existe exatamente para isso.
 *
 * `mix-blend-mode: difference` resolve a legibilidade sobre os dois
 * temas sem duplicar o elemento por bloco.
 *
 * NAO usa IntersectionObserver, e a razao e a pilha de secoes. Numa pagina de
 * rolagem comum "que secao esta na tela" e uma pergunta que o observador
 * responde bem. Numa pilha, toda secao ja alcancada continua GRUDADA e
 * intersecta a faixa do meio para sempre: as dez respondem sim ao mesmo tempo
 * e o contador trava em `10 / 10` na primeira rolagem. Foi o que aconteceu, e o
 * defeito e silencioso porque o numero continua plausivel.
 *
 * A pergunta certa na pilha nao e quem intersecta, e QUEM ESTA POR CIMA - que e
 * sempre a ultima camada a alcancar o alto da tela, e isso se le direto da
 * geometria. A mesma regra vale na pagina sem pilha (movimento reduzido), onde
 * a ultima secao acima do meio da tela e justamente a que se esta lendo, entao
 * nao ha dois caminhos para manter.
 */
export function IndiceFixo() {
  const [atual, definirAtual] = useState(1);

  useEffect(() => {
    const secoes = idsDoIndice.map((id) => document.getElementById(id)).filter(Boolean);
    if (!secoes.length) return;

    // Nenhuma leitura de layout no caminho da rolagem. A posicao de cada secao NO DOCUMENTO so muda
    // quando a pagina muda de tamanho, e quem avisa e o `ResizeObserver` (que entrega depois do
    // layout, com ele limpo). Antes eram dez `getBoundingClientRect` por quadro, lidos DEPOIS de
    // o Lenis e o anime.js escreverem estilo no mesmo quadro: cada rodada forcava um recalculo
    // de estilo sincrono dentro do `requestAnimationFrame`. Agora a conta e `topo - scrollY`, e o
    // `scrollY` se le dentro do evento de rolagem, que roda antes de qualquer escrita do quadro.
    let topos = [];
    let meio = 0;

    const escolher = () => {
      const y = window.scrollY;
      let topo = 0;
      for (const [indice, posicao] of topos.entries()) {
        if (posicao - y <= meio) topo = indice;
      }
      definirAtual(topo + 1);
    };

    const medir = () => {
      const y = window.scrollY;
      topos = secoes.map((secao) => secao.getBoundingClientRect().top + y);
      meio = window.innerHeight / 2;
      escolher();
    };

    const aoRedimensionar = () => {
      meio = window.innerHeight / 2;
      escolher();
    };

    const tamanho = new ResizeObserver(medir);
    for (const secao of secoes) tamanho.observe(secao);
    window.addEventListener("scroll", escolher, { passive: true });
    window.addEventListener("resize", aoRedimensionar, { passive: true });
    return () => {
      tamanho.disconnect();
      window.removeEventListener("scroll", escolher);
      window.removeEventListener("resize", aoRedimensionar);
    };
  }, []);

  // Some com o aviso de cookies e em tela de 380px ou menos. A altura medida da
  // doca inclui quebra de linha e safe-area; o indice conserva um respiro acima dela.
  return (
    <div
      className="fixed bottom-4 left-4 z-5 font-terciaria text-mono-reg tabular-nums tracking-[0.08em] text-bone-pure mix-blend-difference pointer-events-none transition-[bottom] duration-(--motion-base) ease-(--ease-corte-2) [.com-doca_&]:bottom-[calc(var(--doca-altura,--spacing(24))+--spacing(3))] [.com-consentimento_&]:hidden tela-estreita:hidden"
      aria-hidden="true"
    >
      {doisDigitos(atual)} / {doisDigitos(idsDoIndice.length)}
    </div>
  );
}
