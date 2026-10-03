import { useRef } from "react";
import { carimbar, desenhar, revelar, useMovimento } from "../motion/index.js";

/**
 * A regua: o argumento inteiro deste angulo em uma imagem.
 *
 * A dor do angulo teto-natural e de REGUA. O visitante mede o proprio
 * potencial por um alvo que ninguem alcanca sem farmacologia, e nao sabe onde
 * fica o alvo que e. Entao a peca mostra a regua, nao um corpo - o que tambem
 * e o que mantem a pagina dentro da politica de categoria sensivel (RF-L17).
 *
 * Faixa 15 a 35 do indice de massa livre de gordura. Kouri et al. (1995).
 * Lastro: dossie-hipertrofia §5.3.
 */
const MINIMO = 15;
const MAXIMO = 35;
const FRONTEIRA = 25;
const MEDIA = 21.8;

const ESQUERDA = 10;
const LARGURA = 300;

const posicao = (valor) =>
  ESQUERDA + ((valor - MINIMO) / (MAXIMO - MINIMO)) * LARGURA;

const CHAVE = "inline-flex items-center gap-2";
const AMOSTRA = "size-3.5 border border-current flex-none";

export function Regua({ children }) {
  const raiz = useRef(null);

  useMovimento(() => {
    const svg = raiz.current?.querySelector("svg");
    if (svg) {
      desenhar(svg.querySelectorAll("[data-tracar]"), { tempo: 720 });
      desenhar(svg.querySelectorAll("[data-fronteira]"), { atraso: 420 });
    }
    carimbar(raiz.current?.querySelector(".regua__numero"), { atraso: 520 });
    revelar(raiz.current?.querySelector(".regua__legenda"), { atraso: 200 });
  }, []);

  return (
    <figure className="mt-8 mb-12" ref={raiz}>
      <p className="regua__numero mb-3 text-bone font-secundaria text-stat tabular-nums">25</p>
      <svg
        className="w-full h-auto text-line-strong"
        viewBox="0 0 320 76"
        aria-hidden="true"
        fill="none"
      >
        {/* Faixa natural: praticamente todos os atletas livres de drogas. */}
        <line
          data-tracar
          x1={ESQUERDA}
          y1="34"
          x2={posicao(FRONTEIRA)}
          y2="34"
          stroke="var(--bone)"
          strokeWidth="14"
        />
        {/* Faixa acima da fronteira, ocupada por quem usa. */}
        <line
          data-tracar
          x1={posicao(FRONTEIRA)}
          y1="34"
          x2={posicao(MAXIMO)}
          y2="34"
          stroke="var(--silver)"
          strokeWidth="14"
          opacity="0.45"
        />
        {/* A fronteira. Unico uso do acento nesta superficie. */}
        <line
          data-fronteira
          x1={posicao(FRONTEIRA)}
          y1="16"
          x2={posicao(FRONTEIRA)}
          y2="52"
          stroke="var(--acento)"
          strokeWidth="2.5"
        />
        {/* A media medida entre os naturais. */}
        <line
          data-fronteira
          x1={posicao(MEDIA)}
          y1="20"
          x2={posicao(MEDIA)}
          y2="48"
          stroke="var(--void)"
          strokeWidth="1.5"
        />
        {[15, 20, 25, 30, 35].map((marca) => (
          <line
            key={marca}
            data-tracar
            x1={posicao(marca)}
            y1="58"
            x2={posicao(marca)}
            y2="64"
            stroke="var(--line-strong)"
            strokeWidth="1"
          />
        ))}
      </svg>

      <figcaption>
        <div className="regua__legenda flex flex-wrap gap-x-6 gap-y-2 mt-4 text-silver font-terciaria text-caption">
          <span className={CHAVE}>
            <span className={`${AMOSTRA} bg-bone`} />
            Livres de drogas, média <span className="tabular-nums">21,8</span>
          </span>
          <span className={CHAVE}>
            <span
              className={`${AMOSTRA} bg-[repeating-linear-gradient(45deg,transparent,transparent_3px,var(--silver)_3px,var(--silver)_4px)]`}
            />
            Faixa de <span className="tabular-nums">25</span> a <span className="tabular-nums">35</span>
          </span>
        </div>
        {children}
      </figcaption>
    </figure>
  );
}
