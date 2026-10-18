/**
 * A logo do Lithium (a Art Dystopia de public/lithium-wordmark.svg) a tela cheia, em dois quadros: o 0, fundo preto e logo
 * branca; o 1, fundo vermelho (o acento) e logo preta. A logo e uma mascara: a cor sai do texto do quadro, e nao do SVG.
 * Cada quadro "bate": a logo chega um pouco maior e assenta (`animate-batida`). Os quadros se encaixam na mascara de
 * `TelaDoApp` (`MASCARA_DA_LOGO`): mesma forma, mesmo tamanho, no mesmo lugar. Mais o glitch e a batida de som (Video.jsx).
 */
import { BATIDA } from "../sections/tempo.js";

const URL = "/lithium-wordmark.svg";
const PROPORCAO = 1296 / 3784; // altura / largura do SVG

/**
 * A logo como forma, para a mascara de TelaDoApp: `foco` e o ponto da logo (fracao da largura e da altura) onde cabe o maior
 * circulo (o do "M", medido na imagem) e `raio` e o raio dele, em fracao da largura. `largura(W)` e a largura final.
 */
const larguraDaLogo = (W) => Math.min(W * 0.86, 1100);
export const MASCARA_DA_LOGO = { url: URL, proporcao: PROPORCAO, foco: { x: 0.96, y: 0.435 }, raio: 34 / 1100, largura: larguraDaLogo, ms: 2 * BATIDA };

const MASCARA = { maskImage: `url(${URL})`, WebkitMaskImage: `url(${URL})`, maskSize: "contain", WebkitMaskSize: "contain", maskRepeat: "no-repeat", WebkitMaskRepeat: "no-repeat", maskPosition: "center", WebkitMaskPosition: "center" };

// Duas fatias da logo (a de cima e a de baixo), deslocadas para lados opostos e que voltam ao lugar em 130 ms, em degraus: o
// "glitch" que acompanha a batida de cada quadro.
const FATIAS = [
  { corte: "[clip-path:inset(0_0_55%_0)]", anima: "motion-safe:animate-glitch-a" },
  { corte: "[clip-path:inset(48%_0_0_0)]", anima: "motion-safe:animate-glitch-b" },
];

export function LogoLithium({ quadro, batida }) {
  return (
    <div className={`absolute inset-0 z-4 flex items-center justify-center ${quadro === 0 ? "bg-void text-bone" : "bg-acento text-void"}`} role="img" aria-label="Lithium">
      <div className="relative w-[min(86vw,1100px)] aspect-[3784/1296] motion-safe:animate-batida" key={batida}>
        <div className="absolute inset-0 bg-current" style={MASCARA} />
        {FATIAS.map(({ corte, anima }) => <div className={`absolute inset-0 bg-current ${corte} ${anima}`} style={MASCARA} key={corte} />)}
      </div>
    </div>
  );
}
