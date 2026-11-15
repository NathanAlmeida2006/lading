/** Contrato editorial público. Origem não inclui autorizações nem contatos privados. */
import { CONFIG } from "../infra/config.js";
import { formatReais } from "./valueStack.js";

const CORE_PROMISE = "O que não cresce é a comparação com quem não é natural.";
const MECHANISM = {
  semanas: 12, sessoesObrigatorias: 3, sessoesOpcionais: 1,
};
// As cifras do FAQ saem da pilha de valor (o mesmo número do recibo e do CTA): por semana e por sessão
// obrigatória do ciclo.
const { moeda: currency, totalDeclarado: declaredTotal, oferta: { preco: price } } = CONFIG.pilhaDeValor;
const formatPrice = (amount) => `${currency} ${formatReais(amount)}`;
const TOTAL_SESSIONS = MECHANISM.semanas * MECHANISM.sessoesObrigatorias;
const PROTOCOL_LABEL = "hipertrofia · natural";

export const CONTENT = {
  dobra: {
    rotulo: PROTOCOL_LABEL,
    // Espaço inicial de propósito: o número e o texto continuam dois nós de texto no SSR.
    condicoes: " semanas · condições na oferta abaixo",
    headline: { linhas: ["Natural", "Cresce."] },
    promessa: { texto: CORE_PROMISE },
    subheadline: {
      texto: `${CORE_PROMISE} O protocolo organiza ${MECHANISM.semanas} semanas de treino para naturais.`,
    },
  },
  reconhecimento: {
    rotulo: "a régua do treino",
    destaques: ["verdadeiro", "potencial"],
    texto: "O feed esconde quem usa bomba e não mede seu verdadeiro potencial. Abandone a frustração e descubra o caminho para construir o seu corpo estético.",
  },
  mecanismo: MECHANISM,
  intro: { rotulo: "(protocolo 01 · hipertrofia)" },
  doca: { rotulo: "Protocolo 01" },
  espelho: {
    rotulo: PROTOCOL_LABEL,
    titulo: "Cansado de passar despercebido?",
    sub: "Veja o que muda quando você entra no Lithium.",
    cartas: [
      // imagem: ebook genérico × protocolo Lithium
      { titulo: "Do ebook genérico ao protocolo", depois: `${MECHANISM.semanas} semanas prontas. ${MECHANISM.sessoesObrigatorias} sessões por semana. ${TOTAL_SESSIONS} treinos. Você só abre e executa.`, lastro: "Protocolo estruturado" },
      // imagem: tela do app Lithium
      { titulo: "Do app confuso ao app que guia", src: "/images/image1.webp", depois: "O protocolo já vem pronto. Três fases: Aprender, Construir e Consolidar.", lastro: "App que guia" },
      // imagem: Semana Verde e Semana Amarela
      { titulo: "Da semana perdida ao plano de retorno", src: "/images/image2.webp", depois: "Perdeu uma semana? Tem Plano de Retorno, com Semana Verde e Semana Amarela. Você volta e segue.", lastro: "Plano de retorno" },
    ],
  },
  mapa: {
    rotulo: "as próximas doze semanas",
    linhas: ["Fim da", "frustração"],
    sub: "Abra o app. Veja a missão do dia. Treine. O plano já está pronto.",
    estados: [
      // imagem: tela inicial do app · leitura: App Exclusivo (PWA) · origem: CONFIG.entrega
      { capa: "01", src: "/images/image6.webp", pos: "object-[50%_10%]", faixa: "Tudo num lugar só", nome: "App Exclusivo (PWA)", texto: "Tudo num só lugar, no seu celular. Rápido e sem travar." },
      // imagem: tela do Social Vibe · leitura: Social Vibe · origem: CONFIG.pilhaDeValor
      { capa: "02", src: "/images/image7.webp", pos: "object-[50%_10%]", faixa: "Mentalidade", nome: "Social Vibe", texto: "Um espaço para quem treina sério. Cabeça no jogo, evolução em silêncio." },
      // imagem: tela do Checklist Integrado · leitura: Checklist Integrado · origem: CONFIG.pilhaDeValor
      { capa: "03", src: "/images/image8.webp", faixa: "Disciplina", nome: "Checklist Integrado", texto: "Marque o que já fez no dia. Veja o que falta para fechar a missão." },
    ],
    // O texto que sobe quando a regua chega ao fim (motion, nao marcacao).
    frase: "Apenas faça",
    numeros: [
      { valor: 1, rotulo: "APP" },
      { valor: 3, rotulo: "PROTOCOLOS" },
      { valor: MECHANISM.semanas, rotulo: "SEMANAS", destaque: true },
      { valor: 1, rotulo: "OBJETIVO" },
    ],
  },
  leva: {
    rotulo: CONFIG.pilhaDeValor.cabecalho,
    quebraApos: 2,
    titulo: "Cresça calado. Imponha respeito.",
    sub: "Três armas para você nunca mais pisar na academia perdido.",
    vozes: [
      // imagem: tela do Protocolo Hipertrofia
      { nome: "Protocolo Hipertrofia", governa: "Treino", onde: `${MECHANISM.semanas} semanas`, fala: `O mapa de ${MECHANISM.semanas} semanas no app. Zero improviso.`, src: "/images/image3.webp" },
      // imagem: tela do Protocolo Dieta
      { nome: "Protocolo Dieta", governa: "Combustível", onde: "no app", fala: "Massa densa e seca. Sem passar fome, sem bulking sujo.", src: "/images/image4.webp" },
      // imagem: tela do Protocolo Sono
      { nome: "Protocolo Sono", governa: "Recuperação", onde: "no app", fala: "Recupere entre um treino e outro. O músculo cresce no descanso.", src: "/images/image5.webp", pos: "object-[50%_0%]" },
    ],
  },
  // So o fechamento: a headline da dobra e da intro segue "Natural / Cresce.".
  fechamento: {
    headline: { linhas: ["Apenas", "Faça."] },
    rotulo: "o caminho começa aqui",
    condicoes: "Pagamento único · acesso imediato e vitalício",
  },
  objecoesRotulo: "dúvidas antes de comprar",
  objecoesTitulo: "Perguntas frequentes",
  rodape: { tagline: "O básico bem feito, provado, sem mágica." },
  objecoes: [
    { pergunta: "Quanto custa para entrar no protocolo?", resposta: `Pagamento único de ${formatPrice(price)}, com acesso VITALÍCIO. Separados, todos os protocolos e ferramentas somam ${formatPrice(declaredTotal)}. Na ponta do lápis, o seu investimento sai por cerca de ${formatPrice(Math.round((price / MECHANISM.semanas) * 100) / 100)} por semana e ridículos ${formatPrice(Math.round((price / TOTAL_SESSIONS) * 100) / 100)} por sessão de treino: menos que uma garrafa de água na academia.` },
    { pergunta: "O que significa acesso vitalício na prática?", resposta: `Significa o fim das assinaturas que sugam seu cartão: você paga uma vez e o protocolo é seu para sempre, sem mensalidade, para repetir as ${MECHANISM.semanas} semanas quando quiser.` },
    { pergunta: "Como eu acesso o Lithium depois de comprar?", resposta: "O Lithium é um Web App (PWA) de alta performance direto no seu celular. Assim que o pagamento é aprovado, você recebe o acesso imediato para instalar e começar no mesmo dia." },
    { pergunta: "O protocolo realmente serve para mim?", resposta: "Foi forjado para o natural que treina buscando hipertrofia e cansou de passar despercebido ou copiar treino de quem usa bomba. Não vendemos milagre genético; entregamos o método exato para extrair o limite do seu corpo com trabalho duro." },
    { pergunta: "Qual é a diferença real entre o Lithium e um ebook comum?", resposta: `Ebook é teoria solta que você lê uma vez e esquece. O Lithium é uma ferramenta de execução diária no bolso: ${MECHANISM.semanas} semanas mapeadas, Regra do 12, Portão da Semana 9, Plano de Retorno e base científica real.` },
    { pergunta: "Quanto tempo por semana eu preciso dedicar?", resposta: `Apenas de 3h a 3h45 por semana: são ${MECHANISM.sessoesObrigatorias} sessões cirúrgicas de 60 a 75 minutos, com ${MECHANISM.sessoesOpcionais} sessão extra opcional a partir da semana 5 para acelerar pontos específicos. Sem morar na academia.` },
    { pergunta: "E se a rotina apertar e eu faltar uma semana?", resposta: "A maioria dos programas finge que sua vida é perfeita; o Lithium tem o Plano de Retorno. Como a unidade de progresso é a semana fechada, e não uma sequência frágil de dias, você retoma e segue sem perder o progresso." },
  ],
};
