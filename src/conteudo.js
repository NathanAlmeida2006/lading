/** Contrato editorial público. Origem não inclui autorizações nem contatos privados. */
const INSTANCIA = "landing/teto-natural-hipertrofia.md";
const ANGULO = "angulos/teto-natural.md";
const DOSSIE = "01-lithium/02-evidencia/dossie-hipertrofia.md";
const DRAFT = "01-lithium/03-producao/protocolo-hipertrofia";
const PROMESSA = "O que não cresce é a comparação com quem não é natural.";
const MECANISMO = {
  nome: "A Regra do 12", semanas: 12, sessoesObrigatorias: 3, sessoesOpcionais: 1,
  origem: `RF-L11a · RF-T02 · ${DRAFT}/09-cap-03-o-programa.md · 3.1–3.3`,
};

export const conteudo = {
  dobra: {
    headline: { linhas: ["Natural", "Cresce."], origem: `${ANGULO} · A promessa` },
    promessa: { texto: PROMESSA, origem: `${ANGULO} · A promessa` },
    subheadline: {
      texto: `${PROMESSA} O protocolo organiza ${MECANISMO.semanas} semanas de treino para naturais.`,
      origem: `${ANGULO} · A promessa · ${MECANISMO.origem}`,
    },
  },
  reconhecimento: {
    rotulo: "a régua do treino",
    texto: "O feed nem sempre deixa claro quem usa hormônios. Mesmo assim, vira régua de treino natural. Essa régua não mede o limite de cada pessoa.",
    origem: `${ANGULO} · A dor · ${INSTANCIA} · Reconhecimento`,
  },
  mecanismo: MECANISMO,
  espelho: {
    rotuloSituacao: "situação",
    cartas: [
      { titulo: "Troca a régua", depois: "Consulta uma referência de estudo sobre atletas livres de drogas.", hoje: "Uso do feed como medida do potencial.", lastro: "Kouri e colaboradores, 1995", origem: `${ANGULO} · A dor · ${DOSSIE} §5.3` },
      { titulo: "Troca a onda pela semana", depois: `Organiza o treino em ${MECANISMO.semanas} semanas, com ${MECANISMO.sessoesObrigatorias} sessões obrigatórias por semana.`, hoje: "Treino em ondas de duas a seis semanas.", lastro: `${MECANISMO.semanas} semanas · ${MECANISMO.sessoesObrigatorias} sessões por semana`, origem: `${INSTANCIA} · O espelho · ${MECANISMO.origem}` },
      { titulo: "Troca o achismo pela regra", depois: `Consulta ${MECANISMO.nome} para decidir quando aumentar o peso no treino.`, hoje: "Troca de treino diante da demora percebida nos resultados.", lastro: MECANISMO.nome, origem: `${INSTANCIA} · O espelho · ${DRAFT}/11-cap-05-progressao.md` },
      { titulo: "Troca a desistência pelo retorno", depois: "Encontra um capítulo dedicado a voltar ao treino quando a rotina falha.", hoje: "Uma falta que se prolonga até a interrupção da rotina.", lastro: "Capítulo da retomada", origem: `${INSTANCIA} · O espelho · ${DRAFT}/13-cap-07-plano-de-retorno.md` },
      { titulo: "Troca o mito pelo dado", depois: "Consulta a referência sobre o teto natural, sem tratá-la como limite individual.", hoje: "Crença de que não há progresso sem hormônios.", lastro: "Kouri e colaboradores, 1995", origem: `${ANGULO} · A dor · ${DOSSIE} §5.3` },
    ],
  },
  mapa: {
    linhas: [`${MECANISMO.semanas} semanas`, "já estão", "escritas"],
    sessoes: `${MECANISMO.sessoesObrigatorias} sessões por semana, mais ${MECANISMO.sessoesOpcionais} opcional.`,
    progressao: "decide quando aumentar o peso no treino;",
    portao: ", o critério para trocar cada exercício, considera a execução registrada nas sessões.",
    fonte: "Fonte: protocolo de hipertrofia, capítulo 3 · RF-T02.",
    estados: [
      { semana: 1, capa: "1e2", leitura: "semanas 1 e 2", faixa: "semanas", nome: "Fase 1 · Aprender", texto: "Duas séries, grupos de repetições, por exercício, no máximo de repetições indicado na tabela, terminando cada série ainda podendo fazer três repetições. Nos exercícios por tempo, começar pelo mínimo de segundos da tabela.", origem: `${DRAFT}/09-cap-03-o-programa.md §3.3 · fase 1` },
      { semana: 3, capa: "3a8", leitura: "semanas 3 a 8", faixa: "semanas", nome: "Fase 2 · Construir", texto: `Três séries por exercício, no intervalo de repetições da tabela, terminando cada série ainda podendo fazer uma a duas repetições. ${MECANISMO.nome} decide quando o peso sobe.`, origem: `${DRAFT}/09-cap-03-o-programa.md §3.3 · fase 2` },
      { semana: 5, capa: "05", leitura: "semana 5", faixa: "semana", nome: "A quarta sessão", texto: `A sessão opcional entra a partir da semana cinco, se as ${MECANISMO.sessoesObrigatorias} obrigatórias estiverem acontecendo com folga. Não substitui sessão perdida.`, origem: `${DRAFT}/09-cap-03-o-programa.md §3.2` },
      { semana: 9, capa: "09", leitura: "semana 9", faixa: "semana", nome: "O portão", texto: "O portão da fase 3, o critério para trocar cada exercício, exige três séries completas, com amplitude cheia e sem quebra de técnica, em pelo menos três das últimas quatro sessões. Sem isso, a avaliação se repete em duas semanas.", origem: `${DRAFT}/09-cap-03-o-programa.md §3.3 · portão` },
      { semana: 9, capa: "9a12", leitura: "semanas 9 a 12", faixa: "semanas", nome: "Fase 3 · Consolidar", texto: `Mesmas três séries, intervalo de repetições e ${MECANISMO.nome}. Duas trocas planejadas, cada uma após passar pelo critério do exercício.`, origem: `${DRAFT}/09-cap-03-o-programa.md §3.3 · fase 3` },
    ],
    origem: MECANISMO.origem,
  },
  prova: {
    statement: { texto: "Natural cresce. A referência vem de estudos, com população e limites.", origem: `${ANGULO} · A promessa · ${DOSSIE} §5.3` },
    tetoNatural: {
      limite: "Esse estudo descreve uma amostra de atletas, não o limite de cada pessoa.",
      origem: `${DOSSIE} §5.3 · Kouri e colaboradores, 1995`,
    },
    reparo: {
      rotulo: "Sem promessa",
      texto: "No estudo com homens não treinados, parte do aumento inicial foi inchaço de reparo, não músculo novo.",
      nota: "Damas e colaboradores, 2016.",
      origem: `${DOSSIE} §5.1 · Damas e colaboradores, 2016`,
    },
    limite: "Esses dados descrevem os grupos estudados e não garantem resultados individuais com o protocolo.",
    fontes: "Referências de treino, com autor e ano, no protocolo.",
    origemFontes: `${DRAFT}/17-fontes.md`,
  },
  provaSocial: {
    rotulo: "relatos de uso",
    titulo: "Relato é experiência de uso. Não é medição.",
    nota: "Relatos publicados com autorização. Contam a experiência de quem usou e não prometem resultado.",
    posicao: "Relato {atual} de {total}", anterior: "Relato anterior", proximo: "Próximo relato",
    regiao: "Relatos de quem usou o protocolo",
    origem: "output/playwright/t07/copy.md · RF-L35 · RF-L17",
  },
  oferta: {
    inclui: [
      { texto: "O protocolo de hipertrofia completo", origem: `${INSTANCIA} · A oferta · formato em config.entrega.formato` },
      { texto: "O Kit: ferramentas de consulta para o treino", origem: `${DRAFT}/05-como-usar.md · Kit` },
      { texto: "A tabela de retorno, para retomar depois de uma pausa", origem: `${DRAFT}/13-cap-07-plano-de-retorno.md` },
      { texto: "Referências de treino, com autor e ano", origem: `${DRAFT}/17-fontes.md` },
    ],
  },
  objecoesRotulo: "dúvidas sobre o protocolo",
  objecoes: [
    { pergunta: "E o teto natural?", resposta: "A referência citada descreve uma amostra de atletas livres de drogas e não define um limite individual.", origem: `${ANGULO} · Objeção principal · ${DOSSIE} §5.3` },
    { pergunta: "É mais um curso raso de guru?", resposta: "O protocolo reúne explicações de treino e referências com autor e ano.", origem: `persona-kaua-santos.md §13 · ${DRAFT}/17-fontes.md` },
    { pergunta: "É uma promessa milagrosa?", resposta: "Os dados citados descrevem grupos estudados e não garantem resultados individuais com o protocolo.", origem: `persona-kaua-santos.md §13 · ${DOSSIE} §10` },
  ],
  marquise: {
    palavras: ["Natural cresce", MECANISMO.nome, `${MECANISMO.semanas} semanas`, `${MECANISMO.sessoesObrigatorias} sessões`],
    origem: `${ANGULO} · A promessa · ${MECANISMO.origem}`,
  },
};
