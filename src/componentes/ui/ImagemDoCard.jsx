// src -> { original: largura real do arquivo, variantes: larguras de `<nome>-<largura>.webp` ao lado dele em public/ }. Fora da tabela, sem srcSet.
// As variantes tem de manter a proporcao EXATA do original (largura * H == altura * W, em inteiros): a altura do card sai dela, e 0,3 px de
// arredondamento descia a pagina inteira e mudava o antialiasing do texto. Variante na largura do original e ele recomprimido, e o substitui.
const IMAGENS = Object.fromEntries([0, 1, 2, 3, 4, 5, 6, 7, 8].map((n) => [`/imagens/image${n}.webp`, { original: 1440, variantes: [480, 828, 1080] }]));

/**
 * Imagem dos cards (imagens/image0.webp). Decorativa (alt vazio): o texto do card ja diz tudo.
 * `sizes` e a largura real da imagem na grade de cada secao (nunca menor, ou ela amolece).
 * esmaecida: arte provisoria, a 70% de opacidade.
 */
export function ImagemDoCard({ className = "aspect-video", src = "/imagens/image0.webp", sizes, esmaecida = false }) {
  const { original, variantes } = IMAGENS[src] ?? {};
  const srcSet = original && [...variantes.map((w) => `${src.replace(".webp", `-${w}.webp`)} ${w}w`), ...(variantes.includes(original) ? [] : [`${src} ${original}w`])].join(", ");
  return (
    <img
      className={`w-full h-full object-cover bg-surface-1${esmaecida ? " opacity-70" : ""} ${className}`}
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
