import { config } from "./config.js";

/** Ordem RF-L08. Espelho é continuação da etapa 2; ProvaSocial pertence a Prova. */
export const secoes = [
  { id: "inicio", etapaCanonica: 1, rotulo: "Dobra", presente: true },
  { id: "reconhecimento", etapaCanonica: 2, rotulo: "Reconhecimento", presente: true },
  { id: "espelho", etapaCanonica: 2, rotulo: "Espelho", presente: true },
  { id: "o-que-e", etapaCanonica: 3, rotulo: "O que é", presente: true },
  { id: "mapa", etapaCanonica: 4, rotulo: "Mapa do caminho", presente: config.secoes.mapa.ativo,
    justificativaAusencia: config.secoes.mapa.justificativaAusencia },
  { id: "prova", etapaCanonica: 5, rotulo: "Prova", presente: false,
    complementos: [{ id: "prova-social", presente: config.depoimentos.length > 0 }] },
  { id: "amostra", etapaCanonica: 6, rotulo: "Amostra", presente: config.secoes.amostra.ativo,
    justificativaAusencia: config.secoes.amostra.justificativaAusencia },
  { id: "oferta", etapaCanonica: 7, rotulo: "Oferta", presente: true },
  { id: "objecoes", etapaCanonica: 9, rotulo: "Objeções", presente: true },
  { id: "fechamento", etapaCanonica: 10, rotulo: "Fechamento", presente: true },
  { id: "rodape-legal", etapaCanonica: 11, rotulo: "Rodapé legal", presente: true },
];

export const secoesPorId = Object.fromEntries(secoes.map((secao) => [secao.id, secao]));
export const idsDoIndice = secoes.filter(({ id, presente }) => presente && id !== "rodape-legal").map(({ id }) => id);

/**
 * Alcance mensurado (contrato da tarefa 10): id estável → { etapa, canonico }. `canonico` marca as
 * seções do RF-L31 (mapa/4, amostra/6, objecoes/9); prova e fechamento são suplementares e a oferta
 * vira ViewContent. Seção ausente não entra no mapa: não gera evento nem desloca a numeração.
 */
const CANONICO = { mapa: true, amostra: true, objecoes: true, oferta: undefined, prova: false, fechamento: false };
export const alcancePorId = Object.fromEntries(
  secoes.filter(({ id, presente }) => presente && id in CANONICO)
    .map(({ id, etapaCanonica }) => [id, { etapa: etapaCanonica, canonico: CANONICO[id] }]),
);
