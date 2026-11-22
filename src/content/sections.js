import { CONFIG } from "../infra/config.js";

/**
 * @typedef Section Seção da página, na ordem do RF-L08.
 * @property {string} id - Id estável, o mesmo do `id` no DOM.
 * @property {number} etapaCanonica - Etapa da jornada a que a seção pertence.
 * @property {string} rotulo - Nome mostrado no índice.
 * @property {boolean} presente - `false` retira a seção da página.
 * @property {string|null} [justificativaAusencia] - Por que a seção está ausente; só nas que podem faltar.
 * @property {boolean} [foraDoIndice] - `true` tira a seção do menu e do contador, sem tirá-la da página nem do alcance.
 */

/**
 * Ordem do DOM (o prerender confere). Espelho é continuação da etapa 2. A prova (5) fica antes do mapa (4) e a oferta (7)
 * depois das objeções (9) por decisão de layout: a etapa é o rótulo do evento de alcance e não foi renumerada.
 * @type {Section[]}
 */
export const SECTIONS = [
  { id: "inicio", etapaCanonica: 1, rotulo: "Dobra", presente: true },
  { id: "espelho", etapaCanonica: 2, rotulo: "Espelho", presente: true },
  { id: "social-vibe", etapaCanonica: 3, rotulo: "Social Vibe", presente: true, foraDoIndice: true },
  { id: "o-que-e", etapaCanonica: 3, rotulo: "O que é", presente: true },
  { id: "prova-social", etapaCanonica: 5, rotulo: "Prova", presente: true, foraDoIndice: true },
  { id: "mapa", etapaCanonica: 4, rotulo: "Mapa do caminho", presente: CONFIG.secoes.mapa.ativo,
    justificativaAusencia: CONFIG.secoes.mapa.justificativaAusencia },
  { id: "amostra", etapaCanonica: 6, rotulo: "Amostra", presente: CONFIG.secoes.amostra.ativo,
    justificativaAusencia: CONFIG.secoes.amostra.justificativaAusencia },
  { id: "objecoes", etapaCanonica: 9, rotulo: "Objeções", presente: true },
  { id: "oferta", etapaCanonica: 7, rotulo: "Oferta", presente: true },
  { id: "fechamento", etapaCanonica: 10, rotulo: "Fechamento", presente: true },
  { id: "rodape-legal", etapaCanonica: 11, rotulo: "Rodapé legal", presente: true, foraDoIndice: true },
];

/** @type {Record<string, Section>} */
export const SECTIONS_BY_ID = Object.fromEntries(SECTIONS.map((section) => [section.id, section]));
/** @type {string[]} */
export const INDEX_SECTION_IDS = SECTIONS.filter(({ presente: isPresent, foraDoIndice: isOutOfIndex }) => isPresent && !isOutOfIndex).map(({ id }) => id);

/** @type {Record<string, boolean|undefined>} */
const IS_CANONICAL_BY_ID = { "social-vibe": false, mapa: true, amostra: true, objecoes: true, oferta: undefined, "prova-social": false, fechamento: false };

/**
 * Alcance mensurado (contrato da tarefa 10): id estável → { etapa, canonico }. `canonico` marca as
 * seções do RF-L31 (mapa/4, amostra/6, objecoes/9); social-vibe, prova-social e fechamento são suplementares e a oferta
 * vira ViewContent. Seção ausente não entra no mapa: não gera evento nem desloca a numeração.
 * @type {import("../infra/contracts.js").ReachById}
 */
export const REACH_BY_ID = Object.fromEntries(
  SECTIONS.filter(({ id, presente: isPresent }) => isPresent && id in IS_CANONICAL_BY_ID)
    .map(({ id, etapaCanonica }) => [id, { etapa: etapaCanonica, canonico: IS_CANONICAL_BY_ID[id] }]),
);
