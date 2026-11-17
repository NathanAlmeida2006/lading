/**
 * Validadores de dado real, usados pela tela (oferta, fechamento, rodape) e pelo build (`PUBLICAR=1`,
 * em scripts/prerender.mjs). Uma regra so: o build nunca aprova o que a tela esconderia.
 */
const PENDING_MARKER_PATTERN = /\bA[\s_-]+(?:DEFINIR|CONFIRMAR)\b/i;

/**
 * Texto preenchido e sem marcador de pendencia.
 * @param {unknown} value - Valor a conferir; qualquer tipo é aceito.
 * @returns {boolean} `true` quando é string não vazia e sem marcador de pendência.
 */
export const isRealText = (value) => typeof value === "string" && value.trim() !== "" && !PENDING_MARKER_PATTERN.test(value);

/**
 * E-mail publicavel: dominio so com letras, digitos e hifen.
 * @param {unknown} value - Endereço a conferir.
 * @returns {boolean} `true` quando o endereço é real e publicável.
 */
export const isRealEmail = (value) =>
  typeof value === "string" && isRealText(value) && /^[^\s@:<>()\[\]\\,;"]+@[a-z\d-]+(?:\.[a-z\d-]+)+$/i.test(value.trim());

/**
 * Documento legal: arquivo local (`/terms.html`) ou URL HTTPS sem credenciais. A referencia, ou `null`.
 * @param {unknown} value - Caminho local ou URL HTTPS do documento.
 * @returns {string|null} A referência limpa, ou `null` quando não é publicável.
 */
export function getDocumentUrl(value) {
  if (typeof value !== "string" || !isRealText(value)) return null;
  const reference = value.trim();
  if (reference.includes("..") || /[\s\\]/.test(reference)) return null;
  if (/^\/(?!\/)[^?#]+$/.test(reference)) return reference;
  try {
    const url = new URL(reference);
    return url.protocol === "https:" && url.hostname && !url.username && !url.password
      ? reference
      : null;
  } catch {
    return null;
  }
}
