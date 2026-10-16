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
    texto: "O feed esconde quem usa bomba e não mede seu verdadeiro potencial. Abandone a frustração e descubra o caminho para construir o seu corpo estético.",
    origem: `${ANGULO} · A dor · ${INSTANCIA} · Reconhecimento`,
  },
  mecanismo: MECANISMO,
  espelho: {
    rotuloSituacao: "situação",
    titulo: "Cansado de passar despercebido?",
    sub: "É hora de decretar o fim da frustração e ver o que muda quando você entra no protocolo Lithium:",
    cartas: [
      { titulo: "Do ebook genérico ao protocolo estruturado", hoje: "PDF genérico de influenciador: serve para todo mundo na teoria, mas não constrói um grama de músculo em ninguém na prática.", depois: `${MECANISMO.semanas} semanas já escritas, com ${MECANISMO.sessoesObrigatorias} sessões obrigatórias por semana e 36 treinos cirúrgicos no total. Você só abre e executa.`, lastro: "Protocolo estruturado", origem: MECANISMO.origem },
      { titulo: "Do app confuso ao app que guia", hoje: "Aplicativo poluído onde você gasta mais energia montando ficha do que levantando ferro.", depois: "Evolua calado: o protocolo já chega mastigado no app em 3 fases exatas: Aprender, Construir e Consolidar.", lastro: "App que guia", origem: MECANISMO.origem },
      { titulo: "Da semana perdida ao plano de retorno", hoje: "Faltou uma semana por imprevisto, perdeu o ritmo e abandonou o projeto no meio do caminho.", depois: "Protocolo anti-abandono: um capítulo inteiro dedicado a voltar aos trilhos com Semana Verde e Semana Amarela, porque o que constrói carcaça é a semana fechada.", lastro: "Plano de retorno", origem: `${DRAFT}/13-cap-07-plano-de-retorno.md` },
    ],
  },
  mapa: {
    linhas: ["Fim da", "frustração"],
    sub: "Abra o celular, veja a missão de hoje e puxe o ferro. O planejamento já está decidido: a sua única obrigação é executar.",
    estados: [
      { capa: "01", leitura: "App Exclusivo (PWA)", faixa: "Tudo num lugar só", nome: "App Exclusivo (PWA)", texto: "Tudo o que o Lithium entrega reunido em um só lugar, direto na tela do seu celular, rápido, sem travar e com o plano de retorno sempre à mão.", origem: "config.entrega" },
      { capa: "02", leitura: "Social Vibe", faixa: "Mentalidade", nome: "Social Vibe", texto: "Treine com contexto e mentalidade blindada, não sozinho contra a futilidade do feed. Um espaço interno focado na cultura do treino sério para manter sua cabeça no jogo enquanto você evolui em silêncio.", origem: "config.pilhaDeValor" },
      { capa: "03", leitura: "Checklist Integrado", faixa: "Disciplina", nome: "Checklist Integrado", texto: "A disciplina visível na sua tela: você bate o olho, marca o que já executou no dia e vê exatamente o que falta para fechar a missão sem furar o plano.", origem: "config.pilhaDeValor" },
      { capa: "9a12", leitura: "semanas 9 a 12", faixa: "semanas", nome: "Fase 3 · Consolidar", texto: "Você espreme cada gota de resultado do método até a 12ª semana, solidificando um físico mais largo, denso e que impõe respeito em qualquer lugar.", origem: `${DRAFT}/09-cap-03-o-programa.md §3.3 · fase 3` },
      { capa: "↺", leitura: "plano de retorno", faixa: "retorno", nome: "Faltou uma semana?", texto: "Imprevistos acontecem, mas desistir não é opção: o sistema de Semana Verde e Amarela recalibra sua rota imediatamente para você não perder o que construiu.", origem: `${DRAFT}/13-cap-07-plano-de-retorno.md` },
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
  objecoesRotulo: "dúvidas antes de comprar",
  objecoes: [
    { pergunta: "Quanto custa para entrar no protocolo?", resposta: "Pagamento único de R$ 79,99, com acesso VITALÍCIO. Separados, todos os protocolos e ferramentas somam R$ 600. Na ponta do lápis, o seu investimento sai por cerca de R$ 6,67 por semana e ridículos R$ 2,22 por sessão de treino: menos que uma garrafa de água na academia.", origem: "config.pilhaDeValor" },
    { pergunta: "O que significa acesso vitalício na prática?", resposta: "Significa o fim das assinaturas que sugam seu cartão todo mês: você paga uma única vez e o protocolo é seu para sempre, sem mensalidade e sem cobranças surpresa, para repetir o ciclo de 12 semanas quantas vezes quiser.", origem: "config.pilhaDeValor" },
    { pergunta: "Como eu acesso o Lithium depois de comprar?", resposta: "O Lithium é entregue em formato de Web App (PWA) de alta performance direto no seu celular. Assim que o pagamento é aprovado, você recebe seu acesso imediato para instalar no aparelho e começar no mesmo dia.", origem: "config.entrega" },
    { pergunta: "O protocolo realmente serve para mim?", resposta: "Foi forjado especificamente para o natural que treina buscando hipertrofia e está cansado de passar despercebido ou de se frustrar copiando treino de quem usa bomba. Nós não vendemos milagre genético; entregamos o método exato para você extrair o limite máximo do seu corpo com trabalho duro.", origem: ANGULO },
    { pergunta: "Qual é a diferença real entre o Lithium e um ebook comum?", resposta: "Ebook é teoria solta que você lê uma vez e esquece na gaveta do celular. O Lithium é uma ferramenta de execução diária no bolso: traz as 12 semanas mapeadas, a Regra do 12, o Portão da Semana 9, o Plano de Retorno e base científica real.", origem: `${DRAFT}/17-fontes.md` },
    { pergunta: "Quanto tempo por semana eu preciso dedicar?", resposta: `Apenas de 3h a 3h45 por semana: são ${MECANISMO.sessoesObrigatorias} sessões cirúrgicas de 60 a 75 minutos, com ${MECANISMO.sessoesOpcionais} sessão extra opcional a partir da semana 5 para quem quiser acelerar pontos específicos. Sem morar na academia.`, origem: MECANISMO.origem },
    { pergunta: "E se a rotina apertar e eu faltar uma semana?", resposta: "A maioria dos programas finge que sua vida é perfeita; o Lithium tem o Plano de Retorno integrado. Como a nossa unidade de progresso é a semana fechada (e não uma sequência frágil de dias), você aplica a regra de retomada e volta ao jogo sem jogar seu progresso no lixo.", origem: `${DRAFT}/13-cap-07-plano-de-retorno.md` },
  ],
};
