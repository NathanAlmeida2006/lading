/**
 * Validadores de dado real, usados pela tela (oferta, fechamento, rodape), pela prova social e pelo build (a trava de
 * publicacao, em scripts/prerender.mjs). Uma regra so: o build nunca aprova o que a tela esconderia.
 */
// Marcador de pendencia: "A DEFINIR", "A CONFIRMAR" ou um texto entre colchetes (`[CPF OU CNPJ]`), que e como a config
// guarda o dado que ainda falta preencher.
const PENDING_MARKER_PATTERN = /\bA[\s_-]+(?:DEFINIR|CONFIRMAR)\b|\[[^\]]*\]/i;

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

// O que um depoimento precisa ter para ir a tela: o que ela mostra (texto, @, contexto e foto) e o lastro (origem e
// referencia opaca da autorizacao de uso do texto, do @ e da foto). O documento de autorizacao nunca entra no bundle.
const TESTIMONIAL_FIELDS = ["id", "texto", "identificacao", "contexto", "foto", "origem", "autorizacaoRef"];

/**
 * Pendências de um depoimento: os campos que impedem publicá-lo (vazio = publicável), com `aprovado` por último. A tela só
 * mostra o depoimento sem pendência e o build recusa a configuração com qualquer uma: a mesma regra dos dois lados.
 * @param {unknown} testimonial - Um item de `CONFIG.depoimentos`.
 * @returns {string[]} Os campos pendentes.
 */
export function getTestimonialIssues(testimonial) {
  const record = /** @type {Record<string, unknown>} */ (testimonial ?? {});
  const issues = TESTIMONIAL_FIELDS.filter((field) => !isRealText(record[field]));
  if (record.aprovado !== true) issues.push("aprovado");
  return issues;
}

/**
 * Os depoimentos publicáveis, na ordem da configuração.
 * @template T
 * @param {T[]} testimonials - `CONFIG.depoimentos`.
 * @returns {T[]} Só os sem pendência.
 */
export const getPublishableTestimonials = (testimonials) => testimonials.filter((testimonial) => getTestimonialIssues(testimonial).length === 0);

/**
 * Pendências da nota de avaliação: a nota (número acima de 0 e até o máximo), a fonte e a aprovação. Vazio = publicável.
 * Sem nota na configuração (`null`), não há o que publicar nem pendência.
 * @param {unknown} rating - `CONFIG.avaliacao`.
 * @returns {string[]} Os campos pendentes.
 */
export function getRatingIssues(rating) {
  if (rating === null || rating === undefined) return [];
  const record = /** @type {Record<string, unknown>} */ (rating);
  const { nota, maximo } = record;
  const issues = [];
  if (!(typeof nota === "number" && typeof maximo === "number" && nota > 0 && nota <= maximo)) issues.push("nota");
  if (!isRealText(record.fonte)) issues.push("fonte");
  if (record.aprovado !== true) issues.push("aprovado");
  return issues;
}
