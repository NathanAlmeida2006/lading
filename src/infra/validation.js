/**
 * Validadores de dado real, usados pela tela (oferta, fechamento, rodapé), pela prova social e pelo build (a trava de
 * publicação, em scripts/prerender.mjs). Uma regra só: o build nunca aprova o que a tela esconderia.
 */
// Marcador de pendência: "A DEFINIR", "A CONFIRMAR" ou um texto entre colchetes (`[CPF OU CNPJ]`), que é como a config
// guarda o dado que ainda falta preencher.
const PENDING_MARKER_PATTERN = /\bA[\s_-]+(?:DEFINIR|CONFIRMAR)\b|\[[^\]]*\]/i;

/**
 * Texto preenchido e sem marcador de pendência.
 * @param {unknown} value - Valor a conferir; qualquer tipo é aceito.
 * @returns {boolean} `true` quando é string não vazia e sem marcador de pendência.
 */
export const isRealText = (value) =>
  typeof value === "string" && value.trim() !== "" && !PENDING_MARKER_PATTERN.test(value);

/**
 * E-mail publicável: domínio só com letras, dígitos e hífen.
 * @param {unknown} value - Endereço a conferir.
 * @returns {boolean} `true` quando o endereço é real e publicável.
 */
export const isRealEmail = (value) =>
  typeof value === "string" &&
  isRealText(value) &&
  /^[^\s@:<>()\[\]\\,;"]+@[a-z\d-]+(?:\.[a-z\d-]+)+$/i.test(value.trim());

/**
 * Documento legal: arquivo local (`/terms.html`) ou URL HTTPS sem credenciais. A referência, ou `null`.
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

// O que um print de cliente precisa ter para ir a tela: o arquivo, a transcrição dele (`alt`) e o lastro (origem e referência
// opaca da autorização de uso: o print mostra @, foto e conversa de quem escreveu). O documento de autorização nunca entra no bundle.
const PRINT_FIELDS = ["print", "alt", "origin", "authorizationRef"];

/**
 * Pendências de um depoimento (um print de cliente): os campos que impedem publicá-lo (vazio = publicável), com `approved` por
 * último. A tela só mostra o que não tem pendência e o build recusa a configuração com qualquer uma: a mesma regra dos dois lados.
 * `print: null` é uma vaga reservada (placeholder): não há pessoa nem conversa nela, então só o `id` é exigido.
 * @param {unknown} testimonial - Um item de `CONFIG.testimonials`.
 * @returns {string[]} Os campos pendentes.
 */
export function getTestimonialIssues(testimonial) {
  const record = /** @type {Record<string, unknown>} */ (testimonial ?? {});
  const issues = isRealText(record.id) ? [] : ["id"];
  if (record.print === null) return issues;
  issues.push(...PRINT_FIELDS.filter((field) => !isRealText(record[field])));
  if (record.approved !== true) issues.push("approved");
  return issues;
}

/**
 * Os depoimentos publicáveis, na ordem da configuração.
 * @template T
 * @param {T[]} testimonials - `CONFIG.testimonials`.
 * @returns {T[]} Só os sem pendência.
 */
export const getPublishableTestimonials = (testimonials) =>
  testimonials.filter((testimonial) => getTestimonialIssues(testimonial).length === 0);

/**
 * Pendências da nota de avaliação: a nota (número acima de 0 e até o máximo), a fonte e a aprovação. Vazio = publicável.
 * Sem nota na configuração (`null`), não há o que publicar nem pendência.
 * @param {unknown} rating - `CONFIG.assessment`.
 * @returns {string[]} Os campos pendentes.
 */
export function getRatingIssues(rating) {
  if (rating === null || rating === undefined) return [];
  const record = /** @type {Record<string, unknown>} */ (rating);
  const { note, max } = record;
  const issues = [];
  if (!(typeof note === "number" && typeof max === "number" && note > 0 && note <= max))
    issues.push("note");
  if (!isRealText(record.source)) issues.push("source");
  if (record.approved !== true) issues.push("approved");
  return issues;
}
