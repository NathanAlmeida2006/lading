/**
 * Contratos compartilhados da instrumentação: só tipos, nenhum código. Moram aqui, e não no pixel nem no alcance,
 * porque os módulos de `src/infra/` não se importam entre si (nem em `import("...")` de JSDoc).
 */

/**
 * @typedef {"PageView"|"ViewContent"|"InitiateCheckout"|"SecaoAlcancada"} PixelEventName
 * Os eventos que a página sabe enviar (RF-L28). `Purchase` não está aqui de propósito.
 */

/**
 * @typedef {"dobra"|"espelho"|"mapa"|"video"|"oferta"|"fechamento"|"rodape"|"doca"} CtaPosition
 * Posição do botão de compra na página: vai ao pixel como `posicaoCTA` e ao DOM como `data-posicao`.
 */

/**
 * @typedef CheckoutPayload Payload de `InitiateCheckout`.
 * @property {CtaPosition} posicaoCTA - Posição do CTA clicado.
 * @property {string} campanha - Identificador da campanha.
 */

/**
 * @typedef ViewContentPayload Payload de `ViewContent` (a oferta alcançada).
 * @property {string} secao - Id da seção.
 * @property {number} etapa - Etapa canônica da seção.
 * @property {string} campanha - Identificador da campanha.
 */

/**
 * @typedef SectionReachedPayload Payload de `SecaoAlcancada`.
 * @property {string} secao - Id da seção.
 * @property {number} etapa - Etapa canônica da seção.
 * @property {boolean} [canonico] - Seção do RF-L31; ausente nas suplementares.
 * @property {string} campanha - Identificador da campanha.
 */

/** @typedef {CheckoutPayload|ViewContentPayload|SectionReachedPayload} PixelPayload */

/**
 * @typedef PixelPort A porta do pixel.
 * @property {(isForSending?: boolean) => boolean} isEligible - Se o pixel pode carregar (`false`) ou enviar (`true`, padrão).
 * @property {() => void} loadPixel - Carrega o pixel, uma vez, ou revoga o aceite quando ele foi retirado.
 * @property {(name: PixelEventName, data?: PixelPayload) => boolean} sendEvent - Envia um evento permitido; `true` quando saiu.
 * @property {(ctaPosition: CtaPosition) => void} trackCheckoutStart - Registra a intenção de compra no clique de um CTA.
 */

/**
 * @typedef ClarityPort A porta do Clarity (replay e mapa de calor).
 * @property {() => void} loadClarity - Carrega o Clarity, uma vez, ou revoga o aceite quando ele foi retirado.
 * @property {(key: string, value: string) => void} setTag - Grava uma tag na sessão; sem aceite não sai.
 * @property {(name: string) => void} sendEvent - Envia um evento personalizado; sem aceite não sai.
 */

/**
 * @typedef {Record<string, {etapa: number, canonico?: boolean}>} ReachById
 * Mapa de alcance das seções: id estável da seção para a etapa canônica e a marca do RF-L31 (`REACH_BY_ID`).
 */

export {};
