import { useRef } from "react";
import { marquise, useMovimento } from "../motion/index.js";

/**
 * Faixa horizontal em laco, entre blocos de tema.
 *
 * Faz dois trabalhos ao mesmo tempo: e a costura entre um bloco Sigilo e um
 * bloco Cartaz, e e o lugar onde os ornamentos do sistema († ‡ ∆ ∞ •) aparecem
 * como ornamento honesto, no espirito de "numeros e glifos crus" da engenharia
 * reversa.
 *
 * O conteudo e duplicado no markup para o laco nao ter costura visivel. A faixa
 * inteira e `aria-hidden`: e ornamento, as palavras dela estao no texto da
 * pagina, e o verbo do fechamento esta no botao logo abaixo. O † e o ::after.
 */
export function Marquise({ palavras, sentido = -1, tempo = 26000, className = "" }) {
  const trilho = useRef(null);

  // O laco repete o conteudo ate uma metade ser mais larga que a janela, e isso se mede
  // em px: medido antes de a fonte carregar, a faixa sai da largura da fonte de reserva
  // (mais larga), nao repete, e quando a fonte entra a metade fica curta e abre um vao.
  useMovimento(() => {
    let parar = () => {};
    let cancelado = false;
    // Roda depois de o efeito voltar, fora do try do `useMovimento`: precisa do proprio.
    const iniciar = () => {
      if (cancelado) return;
      try {
        parar = marquise(trilho.current, { tempo, sentido }) ?? parar;
      } catch (erro) {
        console.error(erro);
      }
    };
    if (document.fonts?.ready) document.fonts.ready.then(iniciar);
    else iniciar();
    return () => {
      cancelado = true;
      parar();
    };
  }, [tempo, sentido]);

  // Sem parallax aqui, e a razao vale registro: a marquise E uma faixa de
  // layout, e deslocar o proprio conteiner abre um vao entre as duas secoes
  // vizinhas. Parallax move conteudo DENTRO de um recorte, nunca o recorte.
  // O laco horizontal ja e o movimento desta peca.

  const conteudo = palavras.map((palavra, indice) => (
    <span
      className="inline-flex items-center gap-4 px-4 after:content-['†'] after:text-acento"
      key={`${palavra}-${indice}`}
    >
      {palavra}
    </span>
  ));

  // O `skewX` acompanha a velocidade da rolagem, que o Lenis escreve em
  // `--scroll-velocity`. Na faixa, nao no trilho: o trilho ja carrega o
  // translateX do laco. Sem JS a var nunca e escrita e o fallback zera.
  return (
    <div aria-hidden="true" className={`marquise relative overflow-clip py-3 lg:py-4 bg-void text-bone border-y border-line whitespace-nowrap js:[transform:skewX(calc(var(--scroll-velocity,0)*-0.35deg))] ${className}`.trim()}>
      <div
        className="will-change-transform flex w-max font-secundaria text-label uppercase lg:text-[24px] lg:leading-[1.15]"
        ref={trilho}
      >
        <div className="flex">{conteudo}</div>
        <div className="flex">
          {conteudo}
        </div>
      </div>
    </div>
  );
}
