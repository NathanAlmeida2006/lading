/**
 * O rotulo de secao, entre parenteses.
 *
 * Um unico recurso grafico, aplicado a toda etiqueta sem excecao: e o sistema
 * de ornamento da engenharia reversa do Nakula, e faz o mesmo trabalho que o
 * glifo `↴` fazia no Gaspar. Custo zero, coerencia instantanea. Os parenteses
 * sao texto, entao o leitor de tela os le como pausa, que e o que sao.
 *
 * `as` troca a tag sem trocar o desenho: o rotulo e o unico titulo de uma secao
 * (o manifesto), e titulo precisa ser titulo.
 *
 * `margin` existe porque duas utilitarias de margem na mesma classe nao tem
 * ordem garantida: quem precisa de outra margem a passa aqui, em vez de somar.
 * @param {object} props
 * @param {import("react").ReactNode} props.children - Texto do rotulo, sem os parenteses (eles entram aqui).
 * @param {string} [props.className=""] - Classes extras.
 * @param {string} [props.margin="mb-4"] - Margem do rotulo.
 * @param {string|import("react").ElementType} [props.as="span"] - Tag do rotulo.
 * @returns {JSX.Element}
 */
export function Label({ children, className = "", margin = "mb-4", as: Tag = "span" }) {
  return (
    <Tag
      className={`rotulo block font-secundaria text-overline uppercase text-silver ${margin} ${className}`.trim()}
    >
      ({children})
    </Tag>
  );
}
