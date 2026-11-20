/** Contrato editorial público. Origem não inclui autorizações nem contatos privados. */
import { CONFIG } from "../infra/config.js";
import { formatReais } from "./valueStack.js";

/**
 * @typedef MirrorCard Carta da seção Espelho: o antes e o depois.
 * @property {string} titulo - "Do X ao Y".
 * @property {string} [src] - Imagem da carta; ausente quando a carta não tem imagem.
 * @property {string} depois - O que o protocolo entrega.
 * @property {string} lastro - Rótulo curto do que sustenta a promessa.
 */

/**
 * @typedef MapState Estado do Mapa: uma tela do app.
 * @property {string} capa - Número da capa (`"01"`).
 * @property {string} src - Imagem da tela.
 * @property {string} [pos] - Classe de enquadramento da imagem (`object-[...]`).
 * @property {string} faixa - Faixa curta acima do nome.
 * @property {string} nome - Nome do estado.
 * @property {string} texto - Descrição.
 */

/**
 * @typedef MapNumber Número em destaque do Mapa.
 * @property {number} valor - O número.
 * @property {string} rotulo - O que ele conta.
 * @property {boolean} [destaque] - Marca o número em destaque.
 */

/**
 * @typedef Voice Voz da Leva: um protocolo.
 * @property {string} nome - Nome do protocolo.
 * @property {string} governa - O que o protocolo governa.
 * @property {string} onde - Onde ele vive.
 * @property {string} fala - A fala do protocolo.
 * @property {string} src - Imagem da tela do protocolo.
 * @property {string} [pos] - Classe de enquadramento da imagem (`object-[...]`).
 * @property {boolean} [zoom] - Aproxima a imagem em 5% (o card recorta o excesso).
 */

/**
 * @typedef FaqEntry Pergunta frequente e a resposta.
 * @property {string} pergunta
 * @property {string} resposta
 */

/**
 * @typedef Content O texto público das seções.
 * @property {{rotulo: string, cta: string, destaques: {valor: number|null, rotulo: string}[], headline: {linhas: string[]}, promessa: {texto: string}, subheadline: {texto: string}}} dobra - `promessa` alimenta o take 1 do vídeo.
 * @property {{rotulo: string, destaques: string[], texto: string}} reconhecimento
 * @property {{semanas: number, sessoesObrigatorias: number, sessoesOpcionais: number}} mecanismo
 * @property {{rotulo: string}} intro
 * @property {{nome: string, garantia: string, cta: string}} doca
 * @property {{rotulo: string, titulo: string, sub: string, cta: string, cartas: MirrorCard[]}} espelho
 * @property {{rotulo: string, linhas: string[], sub: string, estados: MapState[], frase: string, numeros: MapNumber[], cta: string}} mapa
 * @property {{rotulo: string, titulo: string, sub: string, vozes: Voice[]}} leva
 * @property {{cta: string, garantia: {titulo: string, texto: string}}} oferta
 * @property {{headline: {linhas: string[]}, titulo: string[], rotulo: string, sub: string, cta: string, condicoes: string}} fechamento - `headline` alimenta o último take do vídeo; o site usa `titulo`.
 * @property {string} objecoesRotulo
 * @property {string} objecoesTitulo
 * @property {{tagline: string}} rodape
 * @property {FaqEntry[]} objecoes
 */

const CORE_PROMISE = "O que não cresce é a comparação com quem não é natural.";
const MECHANISM = {
  semanas: 12, sessoesObrigatorias: 3, sessoesOpcionais: 1,
};
// Preço e garantia saem da config (o mesmo número do recibo, da doca e da trava de publicação). As cifras do FAQ
// são por semana e por treino obrigatório do ciclo.
const { moeda: currency, oferta: { preco: price } } = CONFIG.pilhaDeValor;
/**
 * @param {number} amount - Valor em reais.
 * @returns {string} Valor com a moeda.
 */
const formatPrice = (amount) => `${currency} ${formatReais(amount)}`;
const TOTAL_SESSIONS = MECHANISM.semanas * MECHANISM.sessoesObrigatorias;
const PRICE = formatPrice(price);
const GUARANTEE_DAYS = CONFIG.oferta.garantiaDias;
const GUARANTEE = `${GUARANTEE_DAYS} dias de garantia`;

/** @type {Content} */
export const CONTENT = {
  dobra: {
    rotulo: "hipertrofia · natural",
    headline: { linhas: ["Chega de", "Improviso"] },
    promessa: { texto: CORE_PROMISE },
    subheadline: {
      texto: `Treinar sem evoluir é perder tempo. O Lithium substitui o achismo por ${MECHANISM.semanas} semanas de método exato para naturais colocarem massa de verdade.`,
    },
    cta: `Acesso imediato · ${GUARANTEE_DAYS} dias de garantia`,
    // Duas frases curtas na barra da base da dobra: o número em destaque e o que ele conta.
    destaques: [
      { valor: 3, rotulo: "protocolos" },
      { valor: GUARANTEE_DAYS, rotulo: "dias de garantia" },
    ],
  },
  reconhecimento: {
    rotulo: "a mentira do feed",
    destaques: ["hormônio", "cansaço", "régua"],
    texto: "Sua genética não é o problema. O erro é copiar treino de quem usa hormônio e se matar em fichas genéricas que só acumulam cansaço. Natural precisa da régua certa para evoluir.",
  },
  mecanismo: MECHANISM,
  intro: { rotulo: "(protocolo 01 · hipertrofia)" },
  doca: { nome: "Lithium Vitalício", garantia: GUARANTEE, cta: "Garantir acesso" },
  espelho: {
    rotulo: "o choque de realidade",
    titulo: "Mais 6 meses treinando para continuar invisível?",
    sub: "A diferença entre quem só frequenta academia e quem muda de físico está no sistema.",
    cta: `Quero meu protocolo de ${MECHANISM.semanas} semanas`,
    cartas: [
      // imagem: ebook genérico × protocolo Lithium
      { titulo: "Do treino aleatório ao protocolo de guerra", depois: `Chega de escolher exercício na hora ou copiar ficha de instrutor desinteressado. São ${TOTAL_SESSIONS} treinos prontos em ${MECHANISM.semanas} semanas, com progressão exata para forçar hipertrofia natural.`, lastro: "Fim do achismo" },
      // imagem: tela do app Lithium
      { titulo: "Da teoria inútil ao passo a passo no bolso", src: "/images/image1.webp", depois: "Nada de PDF esquecido na pasta de downloads. Você abre no celular e executa três fases claras: Aprender, Construir e Consolidar. Cada série tem um motivo para estar ali.", lastro: "Execução guiada" },
      // imagem: Semana Verde e Semana Amarela
      { titulo: "Da semana perdida ao Plano de Retorno", src: "/images/image2.webp", depois: "Faltou na academia e bateu vontade de largar tudo? O sistema de Semana Verde e Semana Amarela recalibra seu ritmo automaticamente. Você cai, ajusta e não volta para a estaca zero.", lastro: "Blindado contra falhas" },
    ],
  },
  mapa: {
    rotulo: "como funciona na prática",
    linhas: ["Chega de", "começar", "e parar."],
    sub: "Você não precisa de motivação. Precisa abrir o celular, ver a missão do dia e bater a meta.",
    cta: "Garantir meu acesso vitalício",
    estados: [
      // imagem: tela inicial do app · leitura: App Exclusivo (PWA) · origem: CONFIG.entrega
      { capa: "01", src: "/images/image6.webp", pos: "object-[50%_10%]", faixa: "App direto no celular", nome: "Seu Quartel-General no Bolso", texto: "Instalado direto na tela inicial do seu celular, sem precisar de loja de aplicativos e sem anúncios. Treino, carga, dieta e metas a um toque de distância." },
      // imagem: tela do Social Vibe · leitura: Social Vibe · origem: CONFIG.pilhaDeValor
      { capa: "02", src: "/images/image7.webp", pos: "object-[50%_10%]", faixa: "Mentalidade", nome: "Social Vibe", texto: "Ambiente feito para quem leva o treino a sério. Menos distração de rede social, mais cabeça no jogo e constância em silêncio." },
      // imagem: tela do Checklist Integrado · leitura: Checklist Integrado · origem: CONFIG.pilhaDeValor
      { capa: "03", src: "/images/image8.webp", faixa: "Disciplina diária", nome: "Checklist de Execução", texto: "O aplicativo cobra o que você prometeu fazer. Marque treino, dieta e sono no dia e veja na sua cara se você está evoluindo ou dando desculpa." },
    ],
    // O texto que sobe quando a regua chega ao fim (motion, nao marcacao).
    frase: "Apenas faça",
    numeros: [
      { valor: TOTAL_SESSIONS, rotulo: "TREINOS PRONTOS" },
      { valor: 3, rotulo: "PROTOCOLOS INTEGRADOS" },
      { valor: MECHANISM.semanas, rotulo: "SEMANAS DE EVOLUÇÃO", destaque: true },
      { valor: 1, rotulo: "PAGAMENTO ÚNICO" },
    ],
  },
  leva: {
    rotulo: "o que você leva no arsenal",
    titulo: "Fim da estagnação.",
    sub: "O método exato para ganhar massa densa e natural, sem passar o dia na academia.",
    vozes: [
      // imagem: tela do Protocolo Hipertrofia
      { nome: "Protocolo Hipertrofia", governa: "Treino", onde: `${MECHANISM.semanas} semanas`, fala: "Volume cirúrgico para naturais. Menos lixo no treino, mais tensão mecânica e progressão de carga toda semana.", src: "/images/image3.webp" },
      // imagem: tela do Protocolo Dieta
      { nome: "Protocolo Dieta", governa: "Combustível", onde: "no app", zoom: true, fala: "Comida de verdade calculada para ganhar massa densa. Sem bulking sujo que só te dá barriga e sem cardápio impossível de seguir.", src: "/images/image4.webp" },
      // imagem: tela do Protocolo Sono
      { nome: "Protocolo Sono", governa: "Recuperação", onde: "no app", fala: "Quem é natural não tem hormônio sintético para mascarar treino mal recuperado. Ajuste seu sono e transforme descanso em músculo.", src: "/images/image5.webp", pos: "object-[50%_0%]" },
    ],
  },
  oferta: {
    cta: `Quero o Lithium agora por ${PRICE}`,
    garantia: {
      titulo: `Risco zero: Garantia incondicional de ${GUARANTEE_DAYS} dias`,
      texto: `Instale o app e teste tudo por ${GUARANTEE_DAYS} dias. Se não gostar, receba 100% do dinheiro de volta na Hotmart em um clique, sem perguntas.`,
    },
  },
  fechamento: {
    // Só o último take do vídeo lê `headline`; o fechamento do site usa `titulo` (a primeira linha em contorno).
    headline: { linhas: ["Apenas", "Faça."] },
    titulo: [`Mais ${MECHANISM.semanas} semanas de evolução`, "ou desculpas?"],
    rotulo: "sua escolha",
    sub: "O tempo vai passar de qualquer jeito. A única diferença é se você vai continuar improvisando na academia ou executar um plano feito para quem é natural.",
    cta: `Começar minhas ${MECHANISM.semanas} semanas agora`,
    condicoes: `${PRICE} pagamento único · Acesso imediato · ${GUARANTEE}`,
  },
  objecoesRotulo: "dúvidas antes de comprar",
  objecoesTitulo: "Perguntas frequentes",
  rodape: { tagline: "O básico bem feito, provado, sem mágica." },
  objecoes: [
    { pergunta: "Por que tão barato? Tem pegadinha ou mensalidade escondida?", resposta: `Nenhuma pegadinha. Você paga ${PRICE} uma única vez e o acesso é vitalício. Sem assinatura sugando seu cartão todo mês. Dividido pelas ${MECHANISM.semanas} semanas, sai por ${formatPrice(Math.round((price / MECHANISM.semanas) * 100) / 100)} por semana, ou ${formatPrice(Math.round((price / TOTAL_SESSIONS) * 100) / 100)} por treino. O valor atual é condição de entrada para construir base de usuários antes de virar assinatura.` },
    { pergunta: "Isso não é só mais um e-book enfeitado?", resposta: `E-book é PDF morto que você lê 5 páginas e larga. O Lithium é um aplicativo de execução diária no seu celular, com ${MECHANISM.semanas} semanas estruturadas, Regra do 12, Portão da Semana 9, checklist diário e Plano de Retorno.` },
    { pergunta: "Eu trabalho ou estudo e não tenho tempo de morar na academia. Funciona para mim?", resposta: `Foi feito exatamente para isso. Você precisa de apenas ${MECHANISM.sessoesObrigatorias} sessões cirúrgicas de 60 a 75 minutos por semana (com ${MECHANISM.sessoesOpcionais} sessão extra opcional a partir da semana 5). Natural não cresce com 2 horas de treino junk volume; cresce com intensidade e recuperação.` },
    { pergunta: "Sou natural e já treino há meses sem ver resultado. Serve para mim?", resposta: "Serve principalmente para você. O Lithium não vende milagre genético nem promessa de físico hormonizado. Ele elimina os erros de volume, carga e constância que travam 90% dos naturais." },
    { pergunta: "E se eu falhar uma semana por causa de prova, trabalho ou imprevisto?", resposta: "Todo app comum quebra sua sequência e faz você desistir. O Lithium mede progresso por semana fechada e ativa o Plano de Retorno (Semana Verde e Semana Amarela) para você retomar o ritmo sem jogar fora o que construiu." },
    { pergunta: "Como recebo o acesso depois de pagar?", resposta: "Na mesma hora. Assim que o Pix ou cartão aprova na Hotmart, você já é redirecionado para ativar e instalar o app direto no seu celular e começar hoje mesmo, com acesso de backup enviado também por e-mail." },
    { pergunta: "E se eu comprar e não gostar?", resposta: `Você tem ${GUARANTEE_DAYS} dias de garantia incondicional pela Hotmart. Testou e não curtiu? É só solicitar o reembolso na plataforma e cada centavo volta para a sua conta.` },
  ],
};
