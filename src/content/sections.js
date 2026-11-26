import { CONFIG } from "../infra/config.js";
import { getPublishableTestimonials } from "../infra/validation.js";

/**
 * @typedef Section Seção da página, na ordem do RF-L08.
 * @property {string} id - Id estável, o mesmo do `id` no DOM.
 * @property {number} canonicalStage - Etapa da jornada a que a seção pertence.
 * @property {string} label - Nome mostrado no índice.
 * @property {boolean} isPresent - `false` retira a seção da página.
 * @property {string|null} [absenceReason] - Por que a seção está ausente; só nas que podem faltar.
 * @property {boolean} [outOfIndex] - `true` tira a seção do menu e do contador, sem tirá-la da página nem do alcance.
 */

/**
 * Ordem do DOM (o prerender confere). Espelho é continuação da etapa 2. A prova (5) fica antes do mapa (4) e a oferta (7)
 * depois das objeções (9) por decisão de layout: a etapa é o rótulo do evento de alcance e não foi renumerada. Vídeo e app
 * continuam a dobra (etapa 1) e o espectro continua o espelho (etapa 2): suplementares do alcance e fora do índice, o menu e o contador não mudam.
 * @type {Section[]}
 */
export const SECTIONS = [
  { id: "inicio", canonicalStage: 1, label: "Dobra", isPresent: true },
  { id: "video", canonicalStage: 1, label: "Vídeo", isPresent: true, outOfIndex: true },
  { id: "app", canonicalStage: 1, label: "O app por dentro", isPresent: true, outOfIndex: true },
  { id: "espelho", canonicalStage: 2, label: "Espelho", isPresent: true },
  { id: "espectro", canonicalStage: 2, label: "Espectro", isPresent: true, outOfIndex: true },
  {
    id: "social-vibe",
    canonicalStage: 3,
    label: "Social Vibe",
    isPresent: true,
    outOfIndex: true,
  },
  { id: "o-que-e", canonicalStage: 3, label: "O que é", isPresent: true },
  {
    id: "prova-social",
    canonicalStage: 5,
    label: "Prova",
    isPresent: getPublishableTestimonials(CONFIG.testimonials).length > 0,
    outOfIndex: true,
    absenceReason:
      "Nenhum print de cliente com origem, autorização e aprovação registradas (CONFIG.testimonials).",
  },
  {
    id: "mapa",
    canonicalStage: 4,
    label: "Mapa do caminho",
    isPresent: CONFIG.sections.mapa.active,
    absenceReason: CONFIG.sections.mapa.absenceReason,
  },
  {
    id: "amostra",
    canonicalStage: 6,
    label: "Amostra",
    isPresent: CONFIG.sections.amostra.active,
    absenceReason: CONFIG.sections.amostra.absenceReason,
  },
  { id: "objecoes", canonicalStage: 9, label: "Objeções", isPresent: true },
  { id: "oferta", canonicalStage: 7, label: "Oferta", isPresent: true },
  { id: "fechamento", canonicalStage: 10, label: "Fechamento", isPresent: true },
  {
    id: "rodape-legal",
    canonicalStage: 11,
    label: "Rodapé legal",
    isPresent: true,
    outOfIndex: true,
  },
];

/** @type {Record<string, Section>} */
export const SECTIONS_BY_ID = Object.fromEntries(SECTIONS.map((section) => [section.id, section]));
/** @type {string[]} */
export const INDEX_SECTION_IDS = SECTIONS.filter(
  ({ isPresent: isPresent, outOfIndex: isOutOfIndex }) => isPresent && !isOutOfIndex,
).map(({ id }) => id);

/** @type {Record<string, boolean|undefined>} */
const IS_CANONICAL_BY_ID = {
  video: false,
  app: false,
  espectro: false,
  "social-vibe": false,
  mapa: true,
  amostra: true,
  objecoes: true,
  oferta: undefined,
  "prova-social": false,
  fechamento: false,
};

/**
 * Alcance mensurado (contrato da tarefa 10): id estável → { etapa, canonico }. `canonico` marca as
 * seções do RF-L31 (mapa/4, amostra/6, objecoes/9); vídeo, app, espectro, social-vibe, prova-social e fechamento são suplementares e a oferta
 * vira ViewContent. Seção ausente não entra no mapa: não gera evento nem desloca a numeração.
 * @type {import("../infra/contracts.js").ReachById}
 */
export const REACH_BY_ID = Object.fromEntries(
  SECTIONS.filter(({ id, isPresent: isPresent }) => isPresent && id in IS_CANONICAL_BY_ID).map(
    ({ id, canonicalStage }) => [id, { etapa: canonicalStage, canonico: IS_CANONICAL_BY_ID[id] }],
  ),
);
