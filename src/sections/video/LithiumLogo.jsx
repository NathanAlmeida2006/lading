/**
 * A logo do Lithium (a Art Dystopia de public/lithium-wordmark.svg) a tela cheia, em dois quadros: o 0, fundo preto e logo
 * branca; o 1, fundo vermelho (o acento) e logo preta. A logo e uma mascara: a cor sai do texto do quadro, e nao do SVG.
 * Cada quadro "bate": a logo chega um pouco maior e assenta (`animate-batida`).
 */
export const LOGO_URL = "/lithium-wordmark.svg";

const MASK_STYLE = { maskImage: `url(${LOGO_URL})`, WebkitMaskImage: `url(${LOGO_URL})`, maskSize: "contain", WebkitMaskSize: "contain", maskRepeat: "no-repeat", WebkitMaskRepeat: "no-repeat", maskPosition: "center", WebkitMaskPosition: "center" };

// Duas fatias da logo (a de cima e a de baixo), deslocadas para lados opostos e que voltam ao lugar em 130 ms, em degraus: o
// "glitch" que acompanha a batida de cada quadro.
const SLICES = [
  { cut: "[clip-path:inset(0_0_55%_0)]", animation: "motion-safe:animate-glitch-a" },
  { cut: "[clip-path:inset(48%_0_0_0)]", animation: "motion-safe:animate-glitch-b" },
];

/**
 * A logo do Lithium em tela cheia, em dois quadros; cada quadro bate e se encaixa na máscara.
 * @param {object} props
 * @param {number} props.frame - Quadro: 0 é fundo preto com logo branca; 1 é fundo vermelho com logo preta.
 * @param {number} props.restartKey - Muda a cada corte e reinicia a batida do quadro.
 * @returns {JSX.Element} A logo em tela cheia.
 */
export function LithiumLogo({ frame, restartKey }) {
  return (
    <div className={`absolute inset-0 z-4 flex items-center justify-center ${frame === 0 ? "bg-void text-bone" : "bg-acento text-void"}`} role="img" aria-label="Lithium">
      <div className="relative w-[min(86vw,1100px)] aspect-[3784/1296] motion-safe:animate-batida" key={restartKey}>
        <div className="absolute inset-0 bg-current" style={MASK_STYLE} />
        {SLICES.map(({ cut, animation }) => <div className={`absolute inset-0 bg-current ${cut} ${animation}`} style={MASK_STYLE} key={cut} />)}
      </div>
    </div>
  );
}
