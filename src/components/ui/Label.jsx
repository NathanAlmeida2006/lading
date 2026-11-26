/**
 * O rótulo de seção, entre parênteses.
 *
 * Um único recurso gráfico, aplicado a toda etiqueta sem exceção: é o sistema
 * de ornamento da engenharia reversa do Nakula, e faz o mesmo trabalho que o
 * glifo `↴` fazia no Gaspar. Custo zero, coerência instantânea. Os parênteses
 * são texto, então o leitor de tela os lê como pausa, que é o que são.
 *
 * `as` troca a tag sem trocar o desenho: o rótulo é o único título de uma seção
 * (o manifesto), e título precisa ser título.
 *
 * `margin` existe porque duas utilitárias de margem na mesma classe não têm
 * ordem garantida: quem precisa de outra margem a passa aqui, em vez de somar.
 * @param {object} props
 * @param {import("react").ReactNode} props.children - Texto do rótulo, sem os parênteses (eles entram aqui).
 * @param {string} [props.className=""] - Classes extras.
 * @param {string} [props.margin="mb-4"] - Margem do rótulo.
 * @param {string|import("react").ElementType} [props.as="span"] - Tag do rótulo.
 * @returns {JSX.Element}
 */
export function Label({ children, className = "", margin = "mb-4", as: Tag = "span" }) {
  return (
    <Tag
      className={`rotulo block font-secondary text-overline uppercase text-silver ${margin} ${className}`.trim()}
    >
      ({children})
    </Tag>
  );
}
