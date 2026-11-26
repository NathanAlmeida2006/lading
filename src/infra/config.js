import { isRealEmail } from "./validation.js";

/**
 * @typedef ValueStackItem Item da pilha de valor.
 * @property {string} id - Identificador estável do item.
 * @property {string} name - Nome mostrado na tela.
 */

/**
 * @typedef ValueStackBlock Bloco `valueStack`: o que a seção de oferta mostra.
 * @property {boolean} active - `false` retira a seção do preview.
 * @property {boolean} confirmed - Só `true` libera a publicação (o build recusa sem ele).
 * @property {string} source - De onde vieram os valores.
 * @property {string} currency - Símbolo da moeda.
 * @property {string} header - Título da seção.
 * @property {ValueStackItem[]} items - O que a compra inclui (só nomes: nenhum preço avulso é mostrado).
 * @property {string} itemsTitle - Título acima da lista, no lugar de uma marca por item (ex.: "Itens inclusos").
 * @property {{label: string}} connector - Ligação entre a lista e a oferta.
 * @property {{label: string, price: number, installments: number, installmentValue: number, seal: string, subtext: string}} offer - O destaque parcelado (número e valor das parcelas), o preço à vista, o selo do pagamento único, e o detalhe do pagamento.
 */

/**
 * @typedef SampleSection Seção de amostra (RF-L08).
 * @property {boolean} active - Seção exibida.
 * @property {string|null} absenceReason - Por que a seção não aparece; `null` quando aparece.
 * @property {string|null} realExcerpt - Trecho real do miolo; `null` até haver um aprovado.
 * @property {string|null} origin - De onde o trecho veio; `null` até haver um.
 */

/**
 * @typedef Bonus Bônus da oferta, quando confirmado.
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} origin
 * @property {boolean} confirmed
 */

/**
 * @typedef PriceAnchor Ancoragem de preço, quando confirmada.
 * @property {number|string} comparisonPrice - Preço de comparação; texto no formato `1.234,56` também vale.
 * @property {string} rationale
 * @property {string} source
 * @property {boolean} confirmed
 */

/**
 * @typedef Testimonial Depoimento: um print de cliente no carrossel e a referência opaca à autorização (nenhum documento de
 * autorização nem contato privado entra no bundle). Só vai à tela, e só passa no build, sem pendência (validation.js).
 * `print: null` é a vaga reservada (placeholder): desenha um quadro vazio e não exige mais nada além do `id`.
 * @property {string} id - Identificador estável.
 * @property {string|null} print - O arquivo do print (`/images/prints/print-1.webp`); `null` enquanto é só a vaga.
 * @property {string} [alt] - O que o print mostra e diz (transcrição, para leitor de tela); obrigatório com `print`.
 * @property {string|null} [origin] - De onde o print veio (canal e data); obrigatório com `print`.
 * @property {string|null} [authorizationRef] - Referência opaca à autorização de uso do print (@, foto e conversa); obrigatória com `print`.
 * @property {boolean} [approved] - Aprovação do gerente para publicar; `true` obrigatório com `print`.
 */

/**
 * @typedef Rating Nota de avaliação dos compradores.
 * @property {number} note - A nota.
 * @property {number} max - A nota máxima.
 * @property {string|null} source - De onde a nota vem (plataforma, data, número de avaliações); `null` até ser registrada.
 * @property {boolean} approved - Aprovação do gerente para publicar.
 */

/**
 * @typedef Config Dados comerciais da instância. `null` indica informação ainda não confirmada.
 * @property {ValueStackBlock} valueStack - A seção de pilha de valor.
 * @property {string} campaign - Identificador da campanha, enviado em todo evento do pixel.
 * @property {{mapa: {active: boolean, absenceReason: string|null}, amostra: SampleSection}} sections - Seções opcionais (RF-L08).
 * @property {{available: boolean, currency: string, pix: {active: boolean, value: number|string|null, confirmed: boolean}, installmentPlan: string|null, guaranteeDays: number|null, guaranteeConditions: string|null, guaranteeChannel: string|null, bonus: Bonus[], anchoring: PriceAnchor|null}} offer - Condições da oferta.
 * @property {{format: string, channel: string|null, accessMode: string|null, deadline: string|null}} delivery - Como o produto chega ao comprador (RF-L25).
 * @property {{contact: string}} supplier - Contato: aparece no rodapé e nos documentos legais.
 * @property {{url: string, confirmedUrl: boolean, trackingParam: string|null, confirmedParam: boolean}} checkout - Destino único de todos os CTAs.
 * @property {{id: string|null}} pixel - Pixel da Meta; `null` até o id existir.
 * @property {{id: string|null}} clarity - Microsoft Clarity; `null` até o id existir.
 * @property {{key: string|null, host: string|null}} posthog - PostHog: chave pública do projeto e host de ingestão; `null` fora do build de produção ou sem a variável.
 * @property {{privacyPolicy: string, termsOfUse: string}} legal - Documentos legais.
 * @property {Testimonial[]} testimonials - Depoimentos da prova social.
 * @property {Rating|null} assessment - Nota dos compradores; `null` sem nota.
 */

/**
 * Variável de rastreador do ambiente do Vite. Só vale no build de produção, ou no `npm run dev` com `VITE_ENABLE_PIXEL_DEV=1`
 * de propósito: o dev não suja as contas. É a mesma trava para Pixel, Clarity e PostHog. Fora disso, ou vazia, `null`.
 * @param {Record<string, unknown>|undefined} env - O `import.meta.env` (ausente em Node puro).
 * @param {string} name - Nome da variável.
 * @returns {string|null} O valor sem espaços nas pontas, ou `null`.
 */
export function readTrackerEnv(env, name) {
  const value = env?.[name];
  return (env?.PROD || env?.VITE_ENABLE_PIXEL_DEV) && typeof value === "string" && value.trim()
    ? value.trim()
    : null;
}

// Um acesso só ao ambiente do Vite: o build troca `import.meta.env` pelo objeto inteiro, e cada acesso seria uma cópia no bundle.
const ENV = import.meta.env;

// O prazo da garantia aparece no texto do preço e em `offer.guaranteeDays`: um número só.
const GARANTIA_DIAS = 7;

/**
 * Dados comerciais da instância. null indica informação ainda não confirmada.
 * @type {Config}
 */
export const CONFIG = {
  // Dados comerciais da seção de pilha de valor. Só `confirmed` true libera a publicação (o build recusa
  // sem ele, salvo ALLOW_UNCONFIRMED=1); `active` false retira a seção do preview. Nenhum "preço antigo" nem
  // preço avulso por item: a página só mostra o que a compra inclui e o preço real da Hotmart.
  valueStack: {
    active: true, // desliga a seção no preview
    confirmed: true, // preço à vista confirmado na Hotmart
    source: "checkout da Hotmart; preço confirmado pelo responsável em 19/11/2026",
    currency: "R$",
    header: "Tudo o que você precisa para mudar de patamar",
    items: [
      { id: "protocolo-hipertrofia", name: "Protocolo Hipertrofia" },
      { id: "protocolo-dieta", name: "Protocolo Dieta para Naturais" },
      { id: "protocolo-sono", name: "Protocolo Sono e Recuperação" },
      { id: "app", name: "App Lithium Vitalício" },
      { id: "checklist-integrado", name: "Checklist de Execução + Social Vibe" },
      { id: "plano-retorno", name: "Plano de retorno" },
    ],
    itemsTitle: "Itens inclusos",
    connector: { label: "Vitalício" },
    offer: {
      label: "Acesso vitalício por:",
      // O cartão na Hotmart tem juros: 3 x 28,55 não é 79,99 / 3. O valor da parcela vem do checkout, não de conta.
      installments: 3,
      installmentValue: 28.55,
      price: 79.99,
      seal: "Pagamento único", // em destaque, logo abaixo do preço: quebra a objeção de assinatura
      subtext: `Sem assinaturas ou cobranças recorrentes · ${GARANTIA_DIAS} dias de garantia`,
    },
  },

  campaign: "cmp-2026-10-teto-natural",

  // RF-L08: o mapa existe; a amostra espera um trecho real do miolo.
  sections: {
    mapa: { active: true, absenceReason: null },
    amostra: {
      active: false,
      absenceReason:
        "Ainda não há trecho real do miolo aprovado para exibição (Marco 4 do Lithium).",
      realExcerpt: null,
      origin: null,
    },
  },

  offer: {
    available: true, // oferta-base; false retira os CTAs fora de uma condição vigente
    // O preço à vista mora em `valueStack.offer.price` (RF-L23): a tela e a trava do build leem dele.
    currency: "R$",
    // O valor do Pix tem de ser igual ao preço à vista da pilha (o build confere); a doca o lê daqui.
    pix: { active: true, value: 79.99, confirmed: true },
    installmentPlan: null, // opcional, quando confirmado
    guaranteeDays: GARANTIA_DIAS,
    guaranteeConditions: "Incondicional",
    guaranteeChannel: "Direto pela plataforma Hotmart",
    bonus: [], // { id, name, description, origin, confirmed }
    anchoring: null, // { comparisonPrice, rationale, source, confirmed }
  },

  delivery: {
    format: "app", // RF-L25
    channel: "Web App (PWA) com e-mail de backup",
    accessMode: "Redirecionamento imediato pós-compra",
    deadline: "Imediato após aprovação do pagamento",
  },

  // Contato do fornecedor: rodapé e documentos legais (privacy.html, terms.html, pelo vite) leem daqui.
  supplier: {
    contact: "suportelithiumbr@gmail.com", // e-mail de suporte: aparece no fechamento, no rodapé e nos documentos legais
  },

  checkout: {
    url: "https://pay.hotmart.com/Y108171272A", // checkout da Hotmart: único destino de todos os CTAs
    confirmedUrl: true,
    trackingParam: "sck", // Hotmart: sck recebe utm_content (ou utm_campaign), ver buildCheckoutUrl
    confirmedParam: true,
  },

  // Só IDs públicos (nunca token da API de Conversões nem chave pessoal do PostHog). Fora do build de produção ficam `null`
  // (`readTrackerEnv`), para o `npm run dev` não sujar as contas; `VITE_ENABLE_PIXEL_DEV=1` liga de propósito.
  pixel: { id: readTrackerEnv(ENV, "VITE_META_PIXEL_ID") },
  clarity: { id: readTrackerEnv(ENV, "VITE_CLARITY_ID") },
  // PostHog: chave pública do projeto e host de ingestão.
  posthog: {
    key: readTrackerEnv(ENV, "VITE_POSTHOG_KEY"),
    host: readTrackerEnv(ENV, "VITE_POSTHOG_HOST"),
  },

  legal: {
    // Arquivos estáticos em public/ (ou URL HTTPS real). O build valida que existem.
    privacyPolicy: "/privacy.html",
    termsOfUse: "/terms.html",
  },

  // Prova social: o carrossel de prints de clientes. Print e nota só vão à tela, e só passam no build, com lastro e aprovação
  // registrados (validation.js). Cada print: o arquivo em public/images/prints/, a transcrição (`alt`, sem nomes), a origem
  // (canal e data), a referência opaca da autorização de uso e `approved: true` (aprovação do gerente). Enquanto algum desses
  // campos faltar, o build recusa e a tela não mostra o print. Os cinco relatos em texto da versão anterior ficam no histórico do git.
  testimonials: [
    {
      id: "dep1",
      print: "/images/prints/dep1.webp",
      alt: "Conversa no app: o cliente diz que gostou dos objetos 3D para interagir e do conteúdo, que está resumido sem perder nada importante, e que o que mais curtiu é o sistema de dieta com meta de carboidrato, a parte mais complexa, principalmente a definição da dieta para magrelos e gordos.",
      origin: "print de conversa de chat enviado pelo gerente em 25/11/2026",
      authorizationRef: "gerente-2026-11-25", // pedido do gerente para publicar; autorização do cliente sem registro no repo
      approved: true,
    },
    {
      id: "dep2",
      print: "/images/prints/dep2.webp",
      alt: "Conversa no app: quando perguntado o que mais gostou, o cliente responde que a melhor coisa é a calculadora e o roadmap, algo que ajuda a fazer cálculos que ele nem saberia que existem, e que se fosse só o roadmap já estaria bem. Conta que estava fazendo uma dieta e envia uma figura de gato.",
      origin: "print de conversa de chat enviado pelo gerente em 25/11/2026",
      authorizationRef: "gerente-2026-11-25", // pedido do gerente para publicar; autorização do cliente sem registro no repo
      approved: true,
    },
  ],
  assessment: {
    note: 4.5,
    max: 5,
    source:
      "informada pelo gerente em 23/11/2026; plataforma e total de avaliações não registrados",
    approved: true,
  },
};

// E-mail público único: o fechamento e o rodapé leem daqui. Nulo quando o e-mail não é válido.
export const PUBLIC_CONTACT = isRealEmail(CONFIG.supplier.contact)
  ? CONFIG.supplier.contact.trim()
  : null;

// O rótulo padrão do CTA: vale para o botão que não traz rótulo próprio (o do vídeo e o do rodapé). Os demais
// levam o texto da sua seção, em src/content/content.js.
export const CTA_SHORT_VERB = "Quero o Lithium vitalício";
