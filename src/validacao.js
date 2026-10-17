/**
 * Validadores de dado real, usados pela tela (oferta, fechamento, rodape) e pelo build (`PUBLICAR=1`,
 * em scripts/prerender.mjs). Uma regra so: o build nunca aprova o que a tela esconderia.
 */
const PENDENTE = /\[(?:A DEFINIR|A CONFIRMAR)\]|DEFINIR/i;

/** Texto preenchido e sem marcador de pendencia. */
export const textoReal = (valor) => typeof valor === "string" && valor.trim() !== "" && !PENDENTE.test(valor);

/** E-mail publicavel: dominio so com letras, digitos e hifen. */
export const emailReal = (valor) =>
  textoReal(valor) && /^[^\s@:<>()\[\]\\,;"]+@[a-z\d-]+(?:\.[a-z\d-]+)+$/i.test(valor.trim());

/** Documento legal: arquivo local (`/termos.html`) ou URL HTTPS sem credenciais. A referencia, ou `null`. */
export function urlDocumento(valor) {
  if (!textoReal(valor)) return null;
  const referencia = valor.trim();
  if (referencia.includes("..") || /[\s\\]/.test(referencia)) return null;
  if (/^\/(?!\/)[^?#]+$/.test(referencia)) return referencia;
  try {
    const url = new URL(referencia);
    return url.protocol === "https:" && url.hostname && !url.username && !url.password
      ? referencia
      : null;
  } catch {
    return null;
  }
}
