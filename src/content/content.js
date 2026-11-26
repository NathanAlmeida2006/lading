/** Contrato editorial público. Origem não inclui autorizações nem contatos privados. */
import { CONFIG } from "../infra/config.js";
import { getPublishableTestimonials, getRatingIssues } from "../infra/validation.js";
import { formatReais } from "./valueStack.js";

/**
 * @typedef MirrorCard Carta da seção Espelho: o antes e o depois.
 * @property {string} title - "Do X ao Y".
 * @property {string} [src] - Imagem da carta; ausente quando a carta não tem imagem.
 * @property {string} after - O que o protocolo entrega.
 * @property {string} backing - Rótulo curto do que sustenta a promessa.
 */

/**
 * @typedef MapState Estado do Mapa: uma tela do app.
 * @property {string} cover - Número da capa (`"01"`).
 * @property {string} src - Imagem da tela.
 * @property {string} [position] - Classe de enquadramento da imagem (`object-[...]`).
 * @property {string} range - Faixa curta acima do nome.
 * @property {string} name - Nome do estado.
 * @property {string} text - Descrição.
 */

/**
 * @typedef MapNumber Número em destaque do Mapa.
 * @property {number} valor - O número.
 * @property {string} label - O que ele conta.
 * @property {boolean} [highlight] - Marca o número em destaque.
 */

/**
 * @typedef Voice Voz da Leva: um protocolo.
 * @property {string} name - Nome do protocolo.
 * @property {string} governs - O que o protocolo governa.
 * @property {string} where - Onde ele vive.
 * @property {string} speech - A fala do protocolo.
 * @property {string} src - Imagem da tela do protocolo.
 * @property {string} [position] - Classe de enquadramento da imagem (`object-[...]`).
 * @property {boolean} [zoom] - Aproxima a imagem em 5% (o card recorta o excesso).
 */

/**
 * @typedef FaqEntry Pergunta frequente e a resposta.
 * @property {string} question
 * @property {string} answer
 */

/**
 * @typedef VibeCard Cartão do mural Social Vibe.
 * @property {string} title - Título do cartão.
 * @property {string} source - Legenda (o lugar do canal).
 * @property {string} src - Capa do cartão.
 * @property {string} position - Classe de enquadramento da capa (`object-[...]`).
 */

/**
 * @typedef Seal Selo da garantia.
 * @property {"payment"|"protection"|"guarantee"} icon - Ícone do selo (o desenho fica em ValueStack.jsx).
 * @property {string} text - O que o selo diz.
 */

/**
 * @typedef Content O texto público das seções.
 * @property {{label: string, cta: string, highlights: {valor: number|null, label: string}[], headline: {lines: string[]}, promise: {text: string}, subheadline: {text: string}}} fold - `promise` alimenta o take 1 do vídeo.
 * @property {{weeks: number, requiredSessions: number, optionalSessions: number}} mechanism
 * @property {{label: string}} intro
 * @property {{text: string, cta: string}} dock
 * @property {{label: string, title: string, sub: string, cta: string, cards: MirrorCard[]}} mirror
 * @property {{title: string, steps: {id: string, name: string, text: string}[]}} demo
 * @property {{label: string, title: string, assessment: {note: number, max: number}|null, testimonials: {src: string|null, alt: string}[]}} proof - Um item por print de cliente: `src` é o arquivo (`null` = vaga/placeholder) e `alt`, a transcrição; só o que CONFIG traz publicável (validation.js), e `avaliacao` é `null` sem nota publicável.
 * @property {{title: string[], shortVideos: string, news: string, open: string, videos: (VibeCard & {avatar: string})[], shorts: VibeCard[], newsItem: VibeCard & {summary: string}}} vibe
 * @property {{title: string, sub: string, idle: string}} video
 * @property {{title: string, sub: string, note: string, before: string, after: string, areas: {name: string, before: number, after: number}[]}} spectrum
 * @property {{label: string, states: MapState[], numbers: MapNumber[], cta: string}} roadmap
 * @property {{label: string, title: string, sub: string, voices: Voice[]}} batch
 * @property {{cta: string, guarantee: {title: string, text: string, seals: Seal[]}}} offer
 * @property {{headline: {lines: string[]}, title: string[], label: string, sub: string, cta: string, conditions: string}} closing - `headline` alimenta o último take do vídeo; o site usa `title`.
 * @property {string} objectionsLabel
 * @property {string} objectionsTitle
 * @property {{tagline: string}} footer
 * @property {FaqEntry[]} objections
 */

const CORE_PROMISE = "O que não cresce é a comparação com quem não é natural.";
const MECHANISM = {
  weeks: 12,
  requiredSessions: 3,
  optionalSessions: 1,
};
// Preço e garantia saem da config (o mesmo número do recibo, da doca e da trava de publicação). As cifras do FAQ
// são por semana e por treino obrigatório do ciclo.
const {
  currency: currency,
  offer: { price: price, installments: installments, installmentValue: installment },
} = CONFIG.valueStack;
/**
 * @param {number} amount - Valor em reais.
 * @returns {string} Valor com a moeda.
 */
const formatPrice = (amount) => `${currency} ${formatReais(amount)}`;
const TOTAL_SESSIONS = MECHANISM.weeks * MECHANISM.requiredSessions;
const PRICE = formatPrice(price);
const INSTALLMENTS = `${installments}x de ${formatPrice(installment)}`;
const GUARANTEE_DAYS = CONFIG.offer.guaranteeDays;
const GUARANTEE = `${GUARANTEE_DAYS} dias de garantia`;

/** @type {Content} */
export const CONTENT = {
  fold: {
    label: "hipertrofia · natural",
    headline: { lines: ["Chega de", "Improviso"] },
    promise: { text: CORE_PROMISE },
    subheadline: {
      text: "Tudo o que você precisa para estruturar sua hipertrofia natural: treino, dieta e recuperação reunidos em um único aplicativo.",
    },
    cta: "Quero parar de improvisar",
    // Duas frases curtas na barra da base da dobra: o número em destaque e o que ele conta.
    highlights: [
      { valor: 3, label: "protocolos" },
      { valor: GUARANTEE_DAYS, label: "dias de garantia" },
    ],
  },
  mechanism: MECHANISM,
  intro: { label: "(protocolo 01 · hipertrofia)" },
  dock: { text: "Tenha acesso ao seu Lithium Vitalício", cta: "Garantir acesso" },
  mirror: {
    label: "o choque de realidade",
    title: "Mais 6 meses treinando para continuar invisível?",
    sub: "A diferença entre quem só frequenta academia e quem muda de físico está no sistema.",
    cta: `Quero meu protocolo de ${MECHANISM.weeks} semanas`,
    cards: [
      // imagem: tela do app Lithium
      {
        title: "Da teoria inútil ao passo a passo no bolso",
        src: "/images/image1.webp",
        after:
          "Chega de PDF perdido no celular: abra o app e execute 3 fases claras (Aprender, Construir e Consolidar), com propósito em cada série.",
        backing: "Execução guiada",
      },
      // imagem: Semana Verde e Semana Amarela
      {
        title: "Da semana perdida ao Plano de Retorno",
        src: "/images/image2.webp",
        after:
          "Faltou na academia e bateu vontade de largar tudo? O sistema de Semana Verde e Semana Amarela recalibra seu ritmo automaticamente. Você cai, ajusta e não volta para a estaca zero.",
        backing: "Blindado contra falhas",
      },
    ],
  },
  roadmap: {
    label: "como funciona na prática",
    cta: "Garantir meu acesso vitalício",
    states: [
      // imagem: tela inicial do app · leitura: App Exclusivo (PWA) · origem: CONFIG.entrega
      {
        cover: "01",
        src: "/images/image6.webp",
        position: "object-[50%_10%]",
        range: "App direto no celular",
        name: "Seu Quartel-General no Bolso",
        text: "Instalado direto na tela inicial do seu celular sem anúncios. Treino, carga, dieta e metas a um toque de distância.",
      },
      // imagem: tela do Social Vibe · leitura: Social Vibe · origem: CONFIG.valueStack
      {
        cover: "02",
        src: "/images/image7.webp",
        position: "object-[50%_10%]",
        range: "Mentalidade",
        name: "Social Vibe",
        text: "Ambiente feito para quem leva o treino a sério. Menos distração de rede social, mais cabeça no jogo e constância em silêncio.",
      },
      // imagem: tela do Checklist Integrado · leitura: Checklist Integrado · origem: CONFIG.valueStack
      {
        cover: "03",
        src: "/images/image8.webp",
        range: "Disciplina diária",
        name: "Checklist de Execução",
        text: "O aplicativo cobra o que você prometeu fazer. Marque treino, dieta e sono no dia e veja na sua cara se você está evoluindo ou dando desculpa.",
      },
    ],
    numbers: [
      { valor: TOTAL_SESSIONS, label: "TREINOS PRONTOS" },
      { valor: 3, label: "PROTOCOLOS INTEGRADOS" },
      { valor: MECHANISM.weeks, label: "SEMANAS DE EVOLUÇÃO", highlight: true },
      { valor: 1, label: "PAGAMENTO ÚNICO" },
    ],
  },
  // O celular navegando pelo app (AppShowcase.jsx): um passo por tela real do app, na ordem em que aparecem.
  demo: {
    title: "O app por dentro",
    steps: [
      {
        id: "hoje",
        name: "Hoje",
        text: "O dia em três toques: como foi a noite, o treino e o que você comeu.",
      },
      {
        id: "trilha",
        name: "Trilha",
        text: "Cada protocolo, passo a passo, uma etapa de cada vez.",
      },
      {
        id: "exercicios",
        name: "Exercícios",
        text: "O jeito certo de executar cada movimento, com o músculo trabalhado em destaque.",
      },
      {
        id: "treino",
        name: "Treino",
        text: "A ficha já vem com a carga. Marque cada série quando terminar.",
      },
    ],
  },
  // Prova social: o rótulo e o título são copy daqui; os prints e a nota vêm de CONFIG, só os publicáveis (validation.js).
  proof: {
    label: "quem já usa o app",
    title: "Usuários do app",
    assessment:
      CONFIG.assessment && !getRatingIssues(CONFIG.assessment).length
        ? {
            note: CONFIG.assessment.note,
            max: CONFIG.assessment.max,
          }
        : null,
    testimonials: getPublishableTestimonials(CONFIG.testimonials).map(({ print, alt = "" }) => ({
      src: print,
      alt,
    })),
  },
  video: {
    title: "Lithium em ação",
    sub: "Tudo o que você recebe, em 30 segundos. Ligue o som e sinta o ritmo.",
    idle: "Toque no play para começar",
  },
  spectrum: {
    title: "Espectro",
    sub: `Cinco áreas que sobem juntas quando o treino deixa de ser improviso.`,
    note: "Seu Depois se constrói treino a treino.",
    before: "Antes",
    after: "Depois",
    areas: [
      { name: "Estética", before: 30, after: 85 },
      { name: "Força", before: 35, after: 88 },
      { name: "Confiança", before: 25, after: 80 },
      { name: "Disciplina", before: 30, after: 90 },
      { name: "Foco", before: 20, after: 82 },
    ],
  },
  // Rótulos fixos do mural do app. As capas são public/images/vibe-N.webp (origem em source-media/social-vibe).
  vibe: {
    title: ["Social", "Vibe"],
    shortVideos: "Shorts",
    news: "Notícias · fisiculturismo",
    open: "Abrir",
    // Os títulos e legendas dos cartões explicam o mural: não são vídeos nem notícias reais.
    videos: [
      {
        title: "Os canais de treino que você acompanha, reunidos num só lugar",
        source: "Vídeos · atualizados 3x ao dia",
        src: "/images/vibe-1.webp",
        position: "object-[50%_25%]",
        avatar: "/images/icon6.webp",
      },
      {
        title: "Um toque e o vídeo abre no YouTube, em outra aba, fora do app",
        source: "Você volta ao treino quando quiser",
        src: "/images/vibe-2.webp",
        position: "object-[50%_20%]",
        avatar: "/images/icon7.webp",
      },
    ],
    shorts: [
      {
        title: "Shorts para ver entre uma série e outra",
        source: "Role de lado",
        src: "/images/vibe-3.webp",
        position: "object-[40%_50%]",
      },
      {
        title: "Treino em 30 segundos, sem se perder na rede social",
        source: "Abre fora do app",
        src: "/images/vibe-4.webp",
        position: "object-[50%_50%]",
      },
    ],
    newsItem: {
      title: "As notícias do fisiculturismo, sem abrir a rede social",
      summary:
        "O mural reúne vídeos, Shorts e manchetes num só lugar. Você vê o que importa, abre o que quiser e volta pro treino com a cabeça no jogo.",
      source: "Notícias · abre fora do app",
      src: "/images/vibe-5.webp",
      position: "object-[50%_30%]",
    },
  },
  batch: {
    label: "o que você leva no arsenal",
    title: "Você treina duro. Agora treine certo.",
    sub: "Treino que progride toda semana, dieta feita para quem é natural e sono que recupera de verdade. Tudo pronto no app, sem você precisar montar nada.",
    voices: [
      // imagem: tela do Protocolo Hipertrofia
      {
        name: "Protocolo Hipertrofia",
        governs: "Treino",
        where: `${MECHANISM.weeks} semanas`,
        speech:
          "Volume cirúrgico para naturais. Menos lixo no treino, mais tensão mecânica e progressão de carga toda semana.",
        src: "/images/image3.webp",
      },
      // imagem: tela do Protocolo Dieta
      {
        name: "Protocolo Dieta",
        governs: "Combustível",
        where: "no app",
        zoom: true,
        speech:
          "Comida de verdade calculada para ganhar massa densa. Sem bulking sujo que só te dá barriga e sem cardápio impossível de seguir.",
        src: "/images/image4.webp",
      },
      // imagem: tela do Protocolo Sono
      {
        name: "Protocolo Sono",
        governs: "Recuperação",
        where: "no app",
        speech:
          "Quem é natural não tem hormônio sintético para mascarar treino mal recuperado. Ajuste seu sono e transforme descanso em músculo.",
        src: "/images/image5.webp",
        position: "object-[50%_0%]",
      },
    ],
  },
  offer: {
    cta: "Quero o Lithium agora",
    guarantee: {
      title: `Risco zero: Garantia incondicional de ${GUARANTEE_DAYS} dias`,
      text: `Instale o app e teste tudo por ${GUARANTEE_DAYS} dias. Se não gostar, receba 100% do dinheiro de volta na Hotmart em um clique, sem perguntas.`,
      seals: [
        { icon: "payment", text: "Pagamento via Hotmart." },
        { icon: "protection", text: "Compra protegida." },
        { icon: "guarantee", text: `Garantia de ${GUARANTEE_DAYS} dias.` },
      ],
    },
  },
  closing: {
    // Só o último take do vídeo lê `headline`; o fechamento do site usa `title` (a primeira linha em contorno).
    headline: { lines: ["Apenas", "Faça."] },
    title: [`Mais ${MECHANISM.weeks} semanas de evolução`, "ou desculpas?"],
    label: "sua escolha",
    sub: "O tempo vai passar de qualquer jeito. A única diferença é se você vai continuar improvisando na academia ou executar um plano feito para quem é natural.",
    cta: `Começar minhas ${MECHANISM.weeks} semanas agora`,
    conditions: `Pagamento único · Acesso imediato · ${GUARANTEE}`,
  },
  objectionsLabel: "dúvidas antes de comprar",
  objectionsTitle: "Perguntas frequentes",
  footer: { tagline: "O básico bem feito, provado, sem mágica." },
  objections: [
    {
      question: "Por que tão barato? Tem pegadinha ou mensalidade escondida?",
      answer: `Nenhuma pegadinha. Você paga ${INSTALLMENTS} (ou ${PRICE} à vista) numa compra única e o acesso é vitalício. Sem assinatura sugando seu cartão todo mês. Dividido pelas ${MECHANISM.weeks} semanas, o à vista sai por ${formatPrice(Math.round((price / MECHANISM.weeks) * 100) / 100)} por semana, ou ${formatPrice(Math.round((price / TOTAL_SESSIONS) * 100) / 100)} por treino.`,
    },
    {
      question: "Eu trabalho ou estudo e não tenho tempo de morar na academia. Funciona para mim?",
      answer: `Foi feito exatamente para isso. Você precisa de apenas ${MECHANISM.requiredSessions} sessões cirúrgicas de 60 a 75 minutos por semana (com ${MECHANISM.optionalSessions} sessão extra opcional a partir da semana 5). Natural não cresce com 2 horas de treino junk volume; cresce com intensidade e recuperação.`,
    },
    {
      question: "Sou natural e já treino há meses sem ver resultado. Serve para mim?",
      answer:
        "Serve principalmente para quem já treina, mas ainda não encontrou uma estrutura consistente de treino, alimentação e recuperação.",
    },
    {
      question: "E se eu falhar uma semana por causa de prova, trabalho ou imprevisto?",
      answer:
        "Todo app comum quebra sua sequência e faz você desistir. O Lithium mede progresso por semana fechada e ativa o Plano de Retorno (Semana Verde e Semana Amarela) para você retomar o ritmo sem jogar fora o que construiu.",
    },
    {
      question: "Como recebo o acesso depois de pagar?",
      answer:
        "Na mesma hora. Assim que o Pix ou cartão aprova na Hotmart, você já é redirecionado para ativar e instalar o app direto no seu celular e começar hoje mesmo, com acesso de backup enviado também por e-mail.",
    },
    {
      question: "E se eu comprar e não gostar?",
      answer: `Você tem ${GUARANTEE_DAYS} dias de garantia incondicional pela Hotmart. Testou e não curtiu? É só solicitar o reembolso na plataforma e cada centavo volta para a sua conta.`,
    },
  ],
};
