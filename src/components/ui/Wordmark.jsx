import raw from "../../assets/wordmark.svg?raw";

/**
 * O wordmark, em contornos convertidos (RF-G04).
 *
 * Nao e texto vivo: a assinatura precisa sair identica em toda peca (RF-G04). O SVG e `src/assets/wordmark.svg`, o tracado de `public/lithium-wordmark.svg` (viewBox 3784x1296) em `currentColor`, versionado: nao e gerado por script.
 *
 * Inline, e nao <img>, porque `currentColor` precisa resolver nos dois temas.
 *
 * Ele aparece tres vezes (dobra, menu e rodape) e tem uns 4,7 KB de contornos. A primeira
 * ocorrencia carrega o desenho, com um `id`; a segunda (`isReference`) so o aponta com
 * `<use>`, e herda a cor do mesmo jeito.
 */
const ID = "wordmark-lithium";
const viewBox = raw.match(/viewBox="([^"]+)"/)[1];
const definition = raw.replace(/<g(?=[\s>])/, `<g id="${ID}"`);

/**
 * @param {object} props
 * @param {string} [props.className="block w-33 text-bone"] - Classes do envoltorio.
 * @param {boolean} [props.isReference=false] - Aponta para a definicao ja presente na pagina (`<use>`), em vez de desenhar.
 * @returns {JSX.Element}
 */
export function Wordmark({ className = "block w-33 text-bone", isReference = false }) {
  const html = isReference
    ? `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="LITHIUM" viewBox="${viewBox}"><use href="#${ID}"/></svg>`
    : definition;
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
