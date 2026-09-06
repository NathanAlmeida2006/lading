import { useEffect, useRef } from "react";
import { marquise } from "../motion/index.js";

/**
 * Faixa horizontal em laco, entre blocos de tema.
 *
 * Faz dois trabalhos ao mesmo tempo: e a costura entre um bloco Sigilo e um
 * bloco Cartaz, e e o lugar onde os ornamentos do sistema († ‡ ∆ ∞ •) aparecem
 * como ornamento honesto, no espirito de "numeros e glifos crus" da engenharia
 * reversa.
 *
 * O conteudo e duplicado no markup para o laco nao ter costura visivel; a
 * copia leva `aria-hidden` e o leitor de tela ouve a frase uma vez so.
 */
export function Marquise({ palavras, sentido = -1, tempo = 26000, tema }) {
  const trilho = useRef(null);

  useEffect(() => marquise(trilho.current, { tempo, sentido }), [tempo, sentido]);

  // Sem parallax aqui, e a razao vale registro: a marquise E uma faixa de
  // layout, e deslocar o proprio conteiner abre um vao entre as duas secoes
  // vizinhas. Parallax move conteudo DENTRO de um recorte, nunca o recorte.
  // O laco horizontal ja e o movimento desta peca.

  const conteudo = palavras.map((palavra, indice) => (
    <span className="marquise__item" key={`${palavra}-${indice}`}>
      <span className="marquise__palavra">{palavra}</span>
      <span className="marquise__ornamento" aria-hidden="true">
        &#8224;
      </span>
    </span>
  ));

  return (
    <div className="marquise" data-tema={tema}>
      <div className="marquise__trilho label" ref={trilho}>
        <div className="marquise__metade">{conteudo}</div>
        <div className="marquise__metade" aria-hidden="true">
          {conteudo}
        </div>
      </div>
    </div>
  );
}
