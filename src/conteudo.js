/** Contrato editorial público. Origem não inclui autorizações nem contatos privados. */
import { config } from "./config.js";
import { reais } from "./pilha.js";

const INSTANCIA = "landing/teto-natural-hipertrofia.md";
const ANGULO = "angulos/teto-natural.md";
const DOSSIE = "01-lithium/02-evidencia/dossie-hipertrofia.md";
const DRAFT = "01-lithium/03-producao/protocolo-hipertrofia";
const PROMESSA = "O que não cresce é a comparação com quem não é natural.";
const MECANISMO = {
  semanas: 12, sessoesObrigatorias: 3, sessoesOpcionais: 1,
  origem: `RF-L11a · RF-T02 · ${DRAFT}/09-cap-03-o-programa.md · 3.1–3.3`,
};
// As cifras do FAQ saem da pilha de valor (o mesmo número do recibo e do CTA): por semana e por sessão
// obrigatória do ciclo.
const { moeda, totalDeclarado, oferta: { preco } } = config.pilhaDeValor;
const em = (valor) => `${moeda} ${reais(valor)}`;
const SESSOES = MECANISMO.semanas * MECANISMO.sessoesObrigatorias;

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
    ],
    origem: MECANISMO.origem,
    // O texto que sobe quando a regua chega ao fim (motion, nao marcacao).
    frase: "Apenas faça",
    numeros: [
      { valor: 1, rotulo: "APP" },
      { valor: 3, rotulo: "PROTOCOLOS" },
      { valor: 12, rotulo: "SEMANAS" },
      { valor: 1, rotulo: "OBJETIVO" },
    ],
  },
  leva: {
    titulo: "Cresça calado. Imponha respeito.",
    sub: "Três armas para você nunca mais pisar na academia perdido.",
    vozes: [
      { nome: "Protocolo Hipertrofia", governa: "Treino", onde: "12 semanas", fala: "Zero improviso: o mapa completo de 12 semanas no app, usando a Regra do 12 para extrair seu máximo crescimento natural." },
      { nome: "Protocolo Dieta", governa: "Combustível", onde: "no app", fala: "Ajuste estratégico de combustível para construir massa densa e seca, sem passar fome e sem embaçar o shape com bulking sujo." },
      { nome: "Protocolo Sono", governa: "Recuperação", onde: "no app", fala: "Sono profundo alinhado para manter sua testosterona no topo e acelerar a reconstrução muscular entre um treino e outro." },
    ],
  },
  // So o fechamento: a headline da dobra e da intro segue "Natural / Cresce.".
  fechamento: { headline: { linhas: ["Apenas", "Faça."] } },
  objecoesRotulo: "dúvidas antes de comprar",
  objecoes: [
    { pergunta: "Quanto custa para entrar no protocolo?", resposta: `Pagamento único de ${em(preco)}, com acesso VITALÍCIO. Separados, todos os protocolos e ferramentas somam ${em(totalDeclarado)}. Na ponta do lápis, o seu investimento sai por cerca de ${em(Math.round((preco / MECANISMO.semanas) * 100) / 100)} por semana e ridículos ${em(Math.round((preco / SESSOES) * 100) / 100)} por sessão de treino: menos que uma garrafa de água na academia.`, origem: "config.pilhaDeValor" },
    { pergunta: "O que significa acesso vitalício na prática?", resposta: "Significa o fim das assinaturas que sugam seu cartão: você paga uma vez e o protocolo é seu para sempre, sem mensalidade, para repetir as 12 semanas quando quiser.", origem: "config.pilhaDeValor" },
    { pergunta: "Como eu acesso o Lithium depois de comprar?", resposta: "O Lithium é um Web App (PWA) de alta performance direto no seu celular. Assim que o pagamento é aprovado, você recebe o acesso imediato para instalar e começar no mesmo dia.", origem: "config.entrega" },
    { pergunta: "O protocolo realmente serve para mim?", resposta: "Foi forjado para o natural que treina buscando hipertrofia e cansou de passar despercebido ou copiar treino de quem usa bomba. Não vendemos milagre genético; entregamos o método exato para extrair o limite do seu corpo com trabalho duro.", origem: ANGULO },
    { pergunta: "Qual é a diferença real entre o Lithium e um ebook comum?", resposta: "Ebook é teoria solta que você lê uma vez e esquece. O Lithium é uma ferramenta de execução diária no bolso: 12 semanas mapeadas, Regra do 12, Portão da Semana 9, Plano de Retorno e base científica real.", origem: `${DRAFT}/17-fontes.md` },
    { pergunta: "Quanto tempo por semana eu preciso dedicar?", resposta: `Apenas de 3h a 3h45 por semana: são ${MECANISMO.sessoesObrigatorias} sessões cirúrgicas de 60 a 75 minutos, com ${MECANISMO.sessoesOpcionais} sessão extra opcional a partir da semana 5 para acelerar pontos específicos. Sem morar na academia.`, origem: MECANISMO.origem },
    { pergunta: "E se a rotina apertar e eu faltar uma semana?", resposta: "A maioria dos programas finge que sua vida é perfeita; o Lithium tem o Plano de Retorno. Como a unidade de progresso é a semana fechada, e não uma sequência frágil de dias, você retoma e segue sem perder o progresso.", origem: `${DRAFT}/13-cap-07-plano-de-retorno.md` },
  ],
};
