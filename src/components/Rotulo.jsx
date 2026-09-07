/**
 * O rotulo de secao, entre parenteses.
 *
 * Um unico recurso grafico, aplicado a toda etiqueta sem excecao: e o sistema
 * de ornamento da engenharia reversa do Nakula, e faz o mesmo trabalho que o
 * glifo `↴` fazia no Gaspar. Custo zero, coerencia instantanea. Os parenteses
 * sao texto, entao o leitor de tela os le como pausa, que e o que sao.
 */
export function Rotulo({ children, className = "" }) {
  return (
    <span className={`rotulo overline ${className}`.trim()}>
      ({children})
    </span>
  );
}
