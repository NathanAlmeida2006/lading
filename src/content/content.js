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
 * @typedef VibeCard Cartão do mural Social Vibe.
 * @property {string} titulo - Título do cartão.
 * @property {string} fonte - Legenda (o lugar do canal).
 * @property {string} src - Capa do cartão.
 * @property {string} pos - Classe de enquadramento da capa (`object-[...]`).
 */

/**
 * @typedef Seal Selo da garantia.
 * @property {"pagamento"|"protecao"|"garantia"} icone - Ícone do selo (o desenho fica em ValueStack.jsx).
 * @property {string} texto - O que o selo diz.
 */

/**
 * @typedef Content O texto público das seções.
 * @property {{rotulo: string, cta: string, destaques: {valor: number|null, rotulo: string}[], headline: {linhas: string[]}, promessa: {texto: string}, subheadline: {texto: string}}} dobra - `promessa` alimenta o take 1 do vídeo.
 * @property {{semanas: number, sessoesObrigatorias: number, sessoesOpcionais: number}} mecanismo
 * @property {{rotulo: string}} intro
 * @property {{texto: string, cta: string}} doca
 * @property {{rotulo: string, titulo: string, sub: string, cta: string, cartas: MirrorCard[]}} espelho
 * @property {{titulo: string, passos: {id: string, nome: string, texto: string}[]}} demo
 * @property {{rotulo: string, titulo: string, avaliacao: {nota: number, maximo: number, rotulo: string}, depoimentos: {texto: string, nome: string, contexto: string, src: string}[]}} prova - `nome` é o @ de quem falou; `src`, o avatar dele (`/images/iconN.webp`, 192 px).
 * @property {{titulo: string[], curtos: string, noticias: string, abrir: string, videos: (VibeCard & {avatar: string})[], shorts: VibeCard[], noticia: VibeCard & {resumo: string}, aviso: string}} vibe
 * @property {{titulo: string, antes: string, depois: string, areas: {nome: string, antes: number, depois: number}[]}} espectro
 * @property {{rotulo: string, estados: MapState[], numeros: MapNumber[], cta: string}} mapa
 * @property {{rotulo: string, vozes: Voice[]}} leva
 * @property {{cta: string, garantia: {titulo: string, texto: string, selos: Seal[]}}} oferta
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
    cta: "Quero parar de improvisar",
    // Duas frases curtas na barra da base da dobra: o número em destaque e o que ele conta.
    destaques: [
      { valor: 3, rotulo: "protocolos" },
      { valor: GUARANTEE_DAYS, rotulo: "dias de garantia" },
    ],
  },
  mecanismo: MECHANISM,
  intro: { rotulo: "(protocolo 01 · hipertrofia)" },
  doca: { texto: "Tenha acesso ao seu Lithium Vitalício", cta: "Garantir acesso" },
  espelho: {
    rotulo: "o choque de realidade",
    titulo: "Mais 6 meses treinando para continuar invisível?",
    sub: "A diferença entre quem só frequenta academia e quem muda de físico está no sistema.",
    cta: `Quero meu protocolo de ${MECHANISM.semanas} semanas`,
    cartas: [
      // imagem: ebook genérico × protocolo Lithium
      { titulo: "Do treino aleatório ao protocolo de guerra", depois: `Sem improviso ou fichas genéricas: ${TOTAL_SESSIONS} treinos prontos em ${MECHANISM.semanas} semanas com a progressão exata para naturais.`, lastro: "Fim do achismo" },
      // imagem: tela do app Lithium
      { titulo: "Da teoria inútil ao passo a passo no bolso", src: "/images/image1.webp", depois: "Chega de PDF perdido no celular: abra o app e execute 3 fases claras (Aprender, Construir e Consolidar), com propósito em cada série.", lastro: "Execução guiada" },
      // imagem: Semana Verde e Semana Amarela
      { titulo: "Da semana perdida ao Plano de Retorno", src: "/images/image2.webp", depois: "Faltou na academia e bateu vontade de largar tudo? O sistema de Semana Verde e Semana Amarela recalibra seu ritmo automaticamente. Você cai, ajusta e não volta para a estaca zero.", lastro: "Blindado contra falhas" },
    ],
  },
  mapa: {
    rotulo: "como funciona na prática",
    cta: "Garantir meu acesso vitalício",
    estados: [
      // imagem: tela inicial do app · leitura: App Exclusivo (PWA) · origem: CONFIG.entrega
      { capa: "01", src: "/images/image6.webp", pos: "object-[50%_10%]", faixa: "App direto no celular", nome: "Seu Quartel-General no Bolso", texto: "Instalado direto na tela inicial do seu celular, sem precisar de loja de aplicativos e sem anúncios. Treino, carga, dieta e metas a um toque de distância." },
      // imagem: tela do Social Vibe · leitura: Social Vibe · origem: CONFIG.pilhaDeValor
      { capa: "02", src: "/images/image7.webp", pos: "object-[50%_10%]", faixa: "Mentalidade", nome: "Social Vibe", texto: "Ambiente feito para quem leva o treino a sério. Menos distração de rede social, mais cabeça no jogo e constância em silêncio." },
      // imagem: tela do Checklist Integrado · leitura: Checklist Integrado · origem: CONFIG.pilhaDeValor
      { capa: "03", src: "/images/image8.webp", faixa: "Disciplina diária", nome: "Checklist de Execução", texto: "O aplicativo cobra o que você prometeu fazer. Marque treino, dieta e sono no dia e veja na sua cara se você está evoluindo ou dando desculpa." },
    ],
    numeros: [
      { valor: TOTAL_SESSIONS, rotulo: "TREINOS PRONTOS" },
      { valor: 3, rotulo: "PROTOCOLOS INTEGRADOS" },
      { valor: MECHANISM.semanas, rotulo: "SEMANAS DE EVOLUÇÃO", destaque: true },
      { valor: 1, rotulo: "PAGAMENTO ÚNICO" },
    ],
  },
  // O celular navegando pelo app (AppShowcase.jsx): um passo por tela real do app, na ordem em que aparecem.
  demo: {
    titulo: "O app por dentro",
    passos: [
      { id: "hoje", nome: "Hoje", texto: "O dia em três toques: como foi a noite, o treino e o que você comeu." },
      { id: "trilha", nome: "Trilha", texto: "Cada protocolo, passo a passo, uma etapa de cada vez." },
      { id: "exercicios", nome: "Exercícios", texto: "O jeito certo de executar cada movimento, com o músculo trabalhado em destaque." },
      { id: "treino", nome: "Treino", texto: "A ficha já vem com a carga. Marque cada série quando terminar." },
    ],
  },
  // Relatos reais de usuarios do app, na ordem do `iconN.webp` de cada um (public/images; os JPG de origem
  // ficam em source-media/avatares). Texto exato de quem escreveu: nao reescrever. `nome` e o @ publico; `contexto`, o tempo de uso.
  prova: {
    rotulo: "quem já usa o app",
    titulo: "Usuários do app",
    avaliacao: { nota: 4.8, maximo: 5, rotulo: "Avaliação dos compradores" },
    depoimentos: [
      { texto: "Eu ficava quase 2h na academia copiando treino do TikTok e nunca subia peso. Agora resolvo em 1h e finalmente tô vendo a carga andar toda semana.", nome: "@rafa.moura04", contexto: "Semana 6", src: "/images/icon1.webp" },
      { texto: "Sempre começava animado na segunda e largava na quinta. Só de abrir a tela e ver o dia em aberto no checklist já me segurou, fechei o primeiro mês sem furar.", nome: "@lucas.alvesz", contexto: "Treina há 1 ano", src: "/images/icon2.webp" },
      { texto: "Bem direto ao ponto. Não fica travando nem enchendo o saco com propaganda igual esses apps gringos, no descanso da série já bato o olho e sei exatamente quanto colocar.", nome: "@thiago.sntos_", contexto: "Semana 4", src: "/images/icon3.webp" },
      { texto: "Achava frescura esse negócio de controlar sono, mas fui testar o que tá lá. Na segunda semana já parei de chegar moído no treino de quarta.", nome: "@bruno_csta02", contexto: "Treina há 2 anos", src: "/images/icon4.webp" },
      { texto: "Semana passada apertei com prova e trabalho e quase larguei de mão de novo. Usei o ajuste de retorno, voltei sem neura e não perdi o ritmo.", nome: "@felipe.rbr_", contexto: "Semana 5", src: "/images/icon5.webp" },
    ],
  },
  espectro: {
    titulo: "Espectro",
    antes: "Antes",
    depois: "Depois",
    areas: [
      { nome: "Estética", antes: 30, depois: 85 },
      { nome: "Força", antes: 35, depois: 88 },
      { nome: "Confiança", antes: 25, depois: 80 },
      { nome: "Disciplina", antes: 30, depois: 90 },
      { nome: "Foco", antes: 20, depois: 82 },
    ],
  },
  // Rotulos fixos do mural do app. As capas sao public/images/vibe-N.webp (origem em source-media/social-vibe).
  vibe: {
    titulo: ["Social", "Vibe"],
    curtos: "Shorts",
    noticias: "Notícias · fisiculturismo",
    abrir: "Abrir",
    // Os titulos e legendas dos cartoes explicam o mural: nao sao videos nem noticias reais.
    videos: [
      { titulo: "Os canais de treino que você acompanha, reunidos num só lugar", fonte: "Vídeos · atualizados 3x ao dia", src: "/images/vibe-1.webp", pos: "object-[50%_25%]", avatar: "/images/icon6.webp" },
      { titulo: "Um toque e o vídeo abre no YouTube, em outra aba, fora do app", fonte: "Você volta ao treino quando quiser", src: "/images/vibe-2.webp", pos: "object-[50%_20%]", avatar: "/images/icon7.webp" },
    ],
    shorts: [
      { titulo: "Shorts para ver entre uma série e outra", fonte: "Role de lado", src: "/images/vibe-3.webp", pos: "object-[40%_50%]" },
      { titulo: "Treino em 30 segundos, sem se perder na rede social", fonte: "Abre fora do app", src: "/images/vibe-4.webp", pos: "object-[50%_50%]" },
    ],
    noticia: {
      titulo: "As notícias do fisiculturismo, sem abrir a rede social",
      resumo: "O mural reúne vídeos, Shorts e manchetes num só lugar. Você vê o que importa, abre o que quiser e volta pro treino com a cabeça no jogo.",
      fonte: "Notícias · abre fora do app",
      src: "/images/vibe-5.webp",
      pos: "object-[50%_30%]",
    },
    aviso: "Ilustração do mural. O conteúdo é atualizado dentro do app.",
  },
  leva: {
    rotulo: "o que você leva no arsenal",
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
      selos: [
        { icone: "pagamento", texto: "Pagamento via Hotmart." },
        { icone: "protecao", texto: "Compra protegida." },
        { icone: "garantia", texto: `Garantia de ${GUARANTEE_DAYS} dias.` },
      ],
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
    { pergunta: "Por que tão barato? Tem pegadinha ou mensalidade escondida?", resposta: `Nenhuma pegadinha. Você paga ${PRICE} uma única vez e o acesso é vitalício. Sem assinatura sugando seu cartão todo mês. Dividido pelas ${MECHANISM.semanas} semanas, sai por ${formatPrice(Math.round((price / MECHANISM.semanas) * 100) / 100)} por semana, ou ${formatPrice(Math.round((price / TOTAL_SESSIONS) * 100) / 100)} por treino.` },
    { pergunta: "Isso não é só mais um e-book enfeitado?", resposta: `E-book é PDF morto que você lê 5 páginas e larga. O Lithium é um aplicativo de execução diária no seu celular, com ${MECHANISM.semanas} semanas estruturadas, Regra do 12, Portão da Semana 9, checklist diário e Plano de Retorno.` },
    { pergunta: "Eu trabalho ou estudo e não tenho tempo de morar na academia. Funciona para mim?", resposta: `Foi feito exatamente para isso. Você precisa de apenas ${MECHANISM.sessoesObrigatorias} sessões cirúrgicas de 60 a 75 minutos por semana (com ${MECHANISM.sessoesOpcionais} sessão extra opcional a partir da semana 5). Natural não cresce com 2 horas de treino junk volume; cresce com intensidade e recuperação.` },
    { pergunta: "Sou natural e já treino há meses sem ver resultado. Serve para mim?", resposta: "Serve principalmente para você. O Lithium não vende milagre genético nem promessa de físico hormonizado. Ele elimina os erros de volume, carga e constância que travam 90% dos naturais." },
    { pergunta: "E se eu falhar uma semana por causa de prova, trabalho ou imprevisto?", resposta: "Todo app comum quebra sua sequência e faz você desistir. O Lithium mede progresso por semana fechada e ativa o Plano de Retorno (Semana Verde e Semana Amarela) para você retomar o ritmo sem jogar fora o que construiu." },
    { pergunta: "Como recebo o acesso depois de pagar?", resposta: "Na mesma hora. Assim que o Pix ou cartão aprova na Hotmart, você já é redirecionado para ativar e instalar o app direto no seu celular e começar hoje mesmo, com acesso de backup enviado também por e-mail." },
    { pergunta: "E se eu comprar e não gostar?", resposta: `Você tem ${GUARANTEE_DAYS} dias de garantia incondicional pela Hotmart. Testou e não curtiu? É só solicitar o reembolso na plataforma e cada centavo volta para a sua conta.` },
  ],
};
