// src -> { original: largura real do arquivo, variantes: larguras de `<nome>-<largura>.webp` ao lado dele em public/ }. Fora da tabela, sem srcSet.
// As variantes tem de manter a proporcao EXATA do original (largura * H == altura * W, em inteiros): a altura do card sai dela, e 0,3 px de
// arredondamento descia a pagina inteira e mudava o antialiasing do texto. Variante na largura do original e ele recomprimido, e o substitui.
const IMAGES = Object.fromEntries([0, 1, 2, 3, 4, 5, 6, 7, 8].map((n) => [`/images/image${n}.webp`, { original: 1440, variants: [480, 828, 1080] }]));

/**
 * Imagem dos cards (images/image0.webp). Decorativa (alt vazio): o texto do card ja diz tudo.
 * `sizes` e a largura real da imagem na grade de cada secao (nunca menor, ou ela amolece).
 * isDimmed: arte provisoria, a 70% de opacidade.
 * @param {object} props
 * @param {string} [props.className="aspect-video"] - Classes de proporcao e de posicao.
 * @param {string} [props.src="/images/image0.webp"] - Caminho da imagem; as variantes saem da tabela IMAGES.
 * @param {string} [props.sizes] - Atributo `sizes`, a largura real da imagem na grade da secao.
 * @param {boolean} [props.isDimmed=false] - Arte provisoria, a 70% de opacidade.
 * @returns {JSX.Element}
 */
export function CardImage({ className = "aspect-video", src = "/images/image0.webp", sizes, isDimmed = false }) {
  const { original, variants } = IMAGES[src] ?? {};
  const srcSet = original && [...variants.map((w) => `${src.replace(".webp", `-${w}.webp`)} ${w}w`), ...(variants.includes(original) ? [] : [`${src} ${original}w`])].join(", ");
  return (
    <img
      className={`w-full h-full object-cover bg-surface-1${isDimmed ? " opacity-70" : ""} ${className}`}
      src={src}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt=""
      width="1080"
      height="1024"
      loading="lazy"
      decoding="async"
    />
  );
}
