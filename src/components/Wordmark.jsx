import bruto from "../assets/wordmark.svg?raw";

/**
 * O wordmark, em contornos convertidos (RF-G04).
 *
 * Nao e texto vivo: a assinatura precisa sair identica em toda peca (RF-G04). O SVG e gerado
 * da Secundaria (Big Shoulders Display, peso 800, tracking do token h1) por
 * `scripts/wordmark.py`, chamado pelo `npm run sync:ds`.
 *
 * Inline, e nao <img>, porque `currentColor` precisa resolver nos dois temas.
 *
 * Ele aparece duas vezes (dobra e rodape) e tem uns 4,7 KB de contornos. A primeira
 * ocorrencia carrega o desenho, com um `id`; a segunda (`referencia`) so o aponta com
 * `<use>`, e herda a cor do mesmo jeito. Se o arquivo gerado nao tiver o que o `<use>`
 * precisa (um `<g>` e um `viewBox`), as duas saem inteiras, como antes.
 */
const ID = "wordmark-lithium";
const caixa = bruto.match(/viewBox="([^"]+)"/)?.[1];
const definicao = bruto.replace(/<g(?=[\s>])/, `<g id="${ID}"`);
const podeReferenciar = Boolean(caixa) && definicao !== bruto;

export function Wordmark({ className = "block w-33 text-bone", referencia = false }) {
  const usar = referencia && podeReferenciar;
  const html = usar
    ? `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="LITHIUM" viewBox="${caixa}"><use href="#${ID}"/></svg>`
    : podeReferenciar
      ? definicao
      : bruto;
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
