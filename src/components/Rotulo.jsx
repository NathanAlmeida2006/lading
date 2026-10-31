/**
 * O rotulo de secao, entre parenteses.
 *
 * Um unico recurso grafico, aplicado a toda etiqueta sem excecao: e o sistema
 * de ornamento da engenharia reversa do Nakula, e faz o mesmo trabalho que o
 * glifo `↴` fazia no Gaspar. Custo zero, coerencia instantanea. Os parenteses
 * sao texto, entao o leitor de tela os le como pausa, que e o que sao.
 *
 * `como` troca a tag sem trocar o desenho: o rotulo e o unico titulo de uma secao
 * (o manifesto), e titulo precisa ser titulo.
 *
 * `margem` existe porque duas utilitarias de margem na mesma classe nao tem
 * ordem garantida: quem precisa de outra margem a passa aqui, em vez de somar.
 */
export function Rotulo({ children, className = "", margem = "mb-4", como: Tag = "span" }) {
  return (
    <Tag
      className={`rotulo block font-secundaria text-overline uppercase text-silver ${margem} ${className}`.trim()}
    >
      ({children})
    </Tag>
  );
}
