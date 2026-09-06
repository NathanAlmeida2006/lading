import bruto from "../assets/wordmark.svg?raw";

/**
 * O wordmark, em contornos convertidos (RF-G04).
 *
 * Nao e texto vivo: a Marca nao tem kerning, e a assinatura precisa sair
 * identica em toda peca. O SVG e gerado de `art-dystopia-ii.otf` por
 * `scripts/marca.py`, com o espacejamento manual que o RF-G05a exige.
 *
 * Inline, e nao <img>, porque `currentColor` precisa resolver nos dois temas.
 */
export function Wordmark({ className = "wordmark" }) {
  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: bruto }}
    />
  );
}
