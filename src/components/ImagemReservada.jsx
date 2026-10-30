/**
 * Imagem dos cards (image0.webp). Decorativa (alt vazio): o texto do card ja diz tudo.
 * Troque o src por uma arte propria de cada card quando ela chegar.
 */
export function ImagemReservada({ className = "aspect-video", src = "/image0.webp" }) {
  return (
    <img
      className={`w-full h-full object-cover bg-surface-1 ${className}`}
      src={src}
      alt=""
      width="1080"
      height="1024"
      loading="lazy"
      decoding="async"
    />
  );
}
