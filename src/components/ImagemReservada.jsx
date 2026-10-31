// src -> { original: largura real do arquivo, variantes: larguras de `<nome>-<largura>.webp` ao lado dele em public/, proporcao: a da imagem }. Fora da tabela, sem srcSet.
// As variantes tem de manter a proporcao EXATA do original (largura * H == altura * W, em inteiros): a altura do card sai dela, e 0,3 px de
// arredondamento descia a pagina inteira e mudava o antialiasing do texto. Variante na largura do original e ele recomprimido, e o substitui.
const IMAGENS = {
  ...Object.fromEntries([0, 1, 2, 3, 4, 5, 6, 7, 8].map((n) => [`/image${n}.webp`, { original: 1440, variantes: [480, 828, 1080] }])),
};

/**
 * Imagem dos cards (image0.webp). Decorativa (alt vazio): o texto do card ja diz tudo.
 * Troque o src por uma arte propria de cada card quando ela chegar.
 * `sizes` e a largura real da imagem na grade de cada secao (nunca menor, ou ela amolece).
 * `fixarProporcao`: quem tira a altura da imagem (Espelho) liga a proporcao de IMAGENS. Com `srcSet` a proporcao natural vem arredondada pela correcao de densidade.
 * So depois de carregar: antes disso a pilha do Espelho mede os cards na proporcao provisoria (`width`/`height`), e com a real ela soltaria no desktop.
 */
export function ImagemReservada({ className = "aspect-video", src = "/image0.webp", sizes, fixarProporcao }) {
  const { original, variantes } = IMAGENS[src] ?? {};
  const srcSet = original && [...variantes.map((w) => `${src.replace(".webp", `-${w}.webp`)} ${w}w`), ...(variantes.includes(original) ? [] : [`${src} ${original}w`])].join(", ");
  return (
    <img
      className={`w-full h-full object-cover bg-surface-1${src === "/image0.webp" ? " opacity-70" : ""} ${className}`}
      src={src}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      onLoad={fixarProporcao ? (e) => { e.currentTarget.style.aspectRatio = IMAGENS[src].proporcao; } : undefined}
      alt=""
      width="1080"
      height="1024"
      loading="lazy"
      decoding="async"
    />
  );
}
