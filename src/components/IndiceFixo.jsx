import { useEffect, useState } from "react";

/**
 * Paginacao fixa "03 / 09", no canto.
 *
 * Vem direto da engenharia reversa, onde o carrossel do Burocratik trata o
 * numero da pagina como elemento de design. Aqui ele diz onde o
 * visitante esta numa pagina longa, e e micro-registro tecnico: o token
 * `mono-reg` existe exatamente para isso.
 *
 * `mix-blend-mode: difference` no CSS resolve a legibilidade sobre os dois
 * temas sem duplicar o elemento por bloco.
 *
 * NAO usa IntersectionObserver, e a razao e a pilha de secoes. Numa pagina de
 * rolagem comum "que secao esta na tela" e uma pergunta que o observador
 * responde bem. Numa pilha, toda secao ja alcancada continua GRUDADA e
 * intersecta a faixa do meio para sempre: as nove respondem sim ao mesmo tempo
 * e o contador trava em `09 / 09` na primeira rolagem. Foi o que aconteceu, e o
 * defeito e silencioso porque o numero continua plausivel.
 *
 * A pergunta certa na pilha nao e quem intersecta, e QUEM ESTA POR CIMA - que e
 * sempre a ultima camada a alcancar o alto da tela, e isso se le direto da
 * geometria. A mesma regra vale na pagina sem pilha (movimento reduzido), onde
 * a ultima secao acima do meio da tela e justamente a que se esta lendo, entao
 * nao ha dois caminhos para manter.
 */
export function IndiceFixo({ ids }) {
  const [atual, definirAtual] = useState(1);

  useEffect(() => {
    const secoes = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (!secoes.length) return;

    let agendado = 0;

    const medir = () => {
      agendado = 0;
      const meio = window.innerHeight / 2;
      let topo = 0;
      for (const [indice, secao] of secoes.entries()) {
        if (secao.getBoundingClientRect().top <= meio) topo = indice;
      }
      definirAtual(topo + 1);
    };

    // Um quadro por rolagem, nunca uma medida por evento: sao nove retangulos,
    // e le-los a cada evento forca recalculo de layout no meio da animacao da
    // pilha.
    const aoRolar = () => {
      if (!agendado) agendado = requestAnimationFrame(medir);
    };

    medir();
    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("resize", aoRolar, { passive: true });
    return () => {
      cancelAnimationFrame(agendado);
      window.removeEventListener("scroll", aoRolar);
      window.removeEventListener("resize", aoRolar);
    };
  }, [ids]);

  const doisDigitos = (n) => String(n).padStart(2, "0");

  return (
    <div className="indice-fixo mono-reg" aria-hidden="true" data-num>
      {doisDigitos(atual)} / {doisDigitos(ids.length)}
    </div>
  );
}
