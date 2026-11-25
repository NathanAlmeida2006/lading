import { isRealEmail } from "./validation.js";

/**
 * @typedef ValueStackItem Item da pilha de valor.
 * @property {string} id - Identificador estável do item.
 * @property {string} nome - Nome mostrado na tela.
 */

/**
 * @typedef ValueStackBlock Bloco `pilhaDeValor`: o que a seção de oferta mostra.
 * @property {boolean} ativo - `false` retira a seção do preview.
 * @property {boolean} confirmado - Só `true` libera a publicação (o build recusa sem ele).
 * @property {string} fonte - De onde vieram os valores.
 * @property {string} moeda - Símbolo da moeda.
 * @property {string} cabecalho - Título da seção.
 * @property {ValueStackItem[]} itens - O que a compra inclui (só nomes: nenhum preço avulso é mostrado).
 * @property {string} tituloItens - Título acima da lista, no lugar de uma marca por item (ex.: "Itens inclusos").
 * @property {{rotulo: string}} conector - Ligação entre a lista e a oferta.
 * @property {{rotulo: string, preco: number, parcelas: number, valorParcela: number, selo: string, comparacao: string, subtexto: string}} oferta - O destaque parcelado (número e valor das parcelas), o preço à vista, o selo do pagamento único, a comparação e o detalhe do pagamento.
 */

/**
 * @typedef SampleSection Seção de amostra (RF-L08).
 * @property {boolean} ativo - Seção exibida.
 * @property {string|null} justificativaAusencia - Por que a seção não aparece; `null` quando aparece.
 * @property {string|null} trechoReal - Trecho real do miolo; `null` até haver um aprovado.
 * @property {string|null} origem - De onde o trecho veio; `null` até haver um.
 */

/**
 * @typedef Bonus Bônus da oferta, quando confirmado.
 * @property {string} id
 * @property {string} nome
 * @property {string} descricao
 * @property {string} origem
 * @property {boolean} confirmado
 */

/**
 * @typedef PriceAnchor Ancoragem de preço, quando confirmada.
 * @property {number|string} precoComparativo - Preço de comparação; texto no formato `1.234,56` também vale.
 * @property {string} fundamento
 * @property {string} fonte
 * @property {boolean} confirmado
 */

/**
 * @typedef Testimonial Depoimento: um print de cliente no carrossel e a referência opaca à autorização (nenhum documento de
 * autorização nem contato privado entra no bundle). Só vai à tela, e só passa no build, sem pendência (validation.js).
 * `print: null` é a vaga reservada (placeholder): desenha um quadro vazio e não exige mais nada além do `id`.
 * @property {string} id - Identificador estável.
 * @property {string|null} print - O arquivo do print (`/images/prints/print-1.webp`); `null` enquanto é só a vaga.
 * @property {string} [alt] - O que o print mostra e diz (transcrição, para leitor de tela); obrigatório com `print`.
 * @property {string|null} [origem] - De onde o print veio (canal e data); obrigatório com `print`.
 * @property {string|null} [autorizacaoRef] - Referência opaca à autorização de uso do print (@, foto e conversa); obrigatória com `print`.
 * @property {boolean} [aprovado] - Aprovação do gerente para publicar; `true` obrigatório com `print`.
 */

/**
 * @typedef Rating Nota de avaliação dos compradores.
 * @property {number} nota - A nota.
 * @property {number} maximo - A nota máxima.
 * @property {string|null} fonte - De onde a nota vem (plataforma, data, número de avaliações); `null` até ser registrada.
 * @property {boolean} aprovado - Aprovação do gerente para publicar.
 */

/**
 * @typedef Config Dados comerciais da instância. `null` indica informação ainda não confirmada.
 * @property {ValueStackBlock} pilhaDeValor - A seção de pilha de valor.
 * @property {string} campanha - Identificador da campanha, enviado em todo evento do pixel.
 * @property {{mapa: {ativo: boolean, justificativaAusencia: string|null}, amostra: SampleSection}} secoes - Seções opcionais (RF-L08).
 * @property {{disponivel: boolean, moeda: string, pix: {ativo: boolean, valor: number|string|null, confirmado: boolean}, parcelamento: string|null, garantiaDias: number|null, garantiaCondicoes: string|null, garantiaCanal: string|null, bonus: Bonus[], ancoragem: PriceAnchor|null}} oferta - Condições da oferta.
 * @property {{formato: string, canal: string|null, modoDeAcesso: string|null, prazo: string|null}} entrega - Como o produto chega ao comprador (RF-L25).
 * @property {{contato: string}} fornecedor - Contato: aparece no rodapé e nos documentos legais.
 * @property {{url: string, urlConfirmada: boolean, parametroRastreio: string|null, parametroConfirmado: boolean}} checkout - Destino único de todos os CTAs.
 * @property {{id: string|null}} pixel - Pixel da Meta; `null` até o id existir.
 * @property {{id: string|null}} clarity - Microsoft Clarity; `null` até o id existir.
 * @property {{key: string|null, host: string|null}} posthog - PostHog: chave pública do projeto e host de ingestão; `null` fora do build de produção ou sem a variável.
 * @property {{politicaPrivacidade: string, termosDeUso: string}} legal - Documentos legais.
 * @property {Testimonial[]} depoimentos - Depoimentos da prova social.
 * @property {Rating|null} avaliacao - Nota dos compradores; `null` sem nota.
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
  return (env?.PROD || env?.VITE_ENABLE_PIXEL_DEV) && typeof value === "string" && value.trim() ? value.trim() : null;
}

// Um acesso só ao ambiente do Vite: o build troca `import.meta.env` pelo objeto inteiro, e cada acesso seria uma cópia no bundle.
const ENV = import.meta.env;

// O prazo da garantia aparece no texto do preço e em `oferta.garantiaDias`: um número só.
const GARANTIA_DIAS = 7;

/**
 * Dados comerciais da instância. null indica informação ainda não confirmada.
 * @type {Config}
 */
export const CONFIG = {
  // Dados comerciais da seção de pilha de valor. Só `confirmado` true libera a publicação (o build recusa
  // sem ele, salvo ALLOW_UNCONFIRMED=1); `ativo` false retira a seção do preview. Nenhum "preço antigo" nem
  // preço avulso por item: a página só mostra o que a compra inclui e o preço real da Hotmart.
  pilhaDeValor: {
    ativo: true, // desliga a seção no preview
    confirmado: true, // preço à vista confirmado na Hotmart
    fonte: "checkout da Hotmart; preço confirmado pelo responsável em 19/11/2026",
    moeda: "R$",
    cabecalho: "Tudo o que você precisa para mudar de patamar",
    itens: [
      { id: "protocolo-hipertrofia", nome: "Protocolo Hipertrofia" },
      { id: "protocolo-dieta", nome: "Protocolo Dieta para Naturais" },
      { id: "protocolo-sono", nome: "Protocolo Sono e Recuperação" },
      { id: "app", nome: "App Lithium Vitalício" },
      { id: "checklist-integrado", nome: "Checklist de Execução + Social Vibe" },
      { id: "plano-retorno", nome: "Plano de retorno" },
    ],
    tituloItens: "Itens inclusos",
    conector: { rotulo: "Vitalício" },
    oferta: {
      rotulo: "Acesso vitalício por:",
      // O cartão na Hotmart tem juros: 3 x 28,55 não é 79,99 / 3. O valor da parcela vem do checkout, não de conta.
      parcelas: 3,
      valorParcela: 28.55,
      preco: 79.99,
      // "Menos de R$ 2,23" vale para 79,99 / 36 treinos = 2,22; scripts/tests/faq.test.mjs trava a conta (preço, 36 treinos e 12 semanas).
      comparacao: "Menos de R$ 2,23 por treino, considerando 36 treinos ao longo das 12 semanas.",
      selo: "Pagamento único", // em destaque, logo abaixo do preço: quebra a objeção de assinatura
      subtexto: `Sem assinaturas ou cobranças recorrentes · ${GARANTIA_DIAS} dias de garantia`,
    },
  },

  campanha: "cmp-2026-10-teto-natural",

  // RF-L08: o mapa existe; a amostra espera um trecho real do miolo.
  secoes: {
    mapa: { ativo: true, justificativaAusencia: null },
    amostra: {
      ativo: false,
      justificativaAusencia: "Ainda não há trecho real do miolo aprovado para exibição (Marco 4 do Lithium).",
      trechoReal: null,
      origem: null,
    },
  },

  oferta: {
    disponivel: true, // oferta-base; false retira os CTAs fora de uma condição vigente
    // O preço à vista mora em `pilhaDeValor.oferta.preco` (RF-L23): a tela e a trava do build leem dele.
    moeda: "R$",
    // O valor do Pix tem de ser igual ao preço à vista da pilha (o build confere); a doca o lê daqui.
    pix: { ativo: true, valor: 79.99, confirmado: true },
    parcelamento: null, // opcional, quando confirmado
    garantiaDias: GARANTIA_DIAS,
    garantiaCondicoes: "Incondicional",
    garantiaCanal: "Direto pela plataforma Hotmart",
    bonus: [], // { id, nome, descricao, origem, confirmado }
    ancoragem: null, // { precoComparativo, fundamento, fonte, confirmado }
  },

  entrega: {
    formato: "app", // RF-L25
    canal: "Web App (PWA) com e-mail de backup",
    modoDeAcesso: "Redirecionamento imediato pós-compra",
    prazo: "Imediato após aprovação do pagamento",
  },

  // Contato do fornecedor: rodapé e documentos legais (privacy.html, terms.html, pelo vite) leem daqui.
  fornecedor: {
    contato: "suportelithiumbr@gmail.com", // e-mail de suporte: aparece no fechamento, no rodapé e nos documentos legais
  },

  checkout: {
    url: "https://pay.hotmart.com/Y108171272A", // checkout da Hotmart: único destino de todos os CTAs
    urlConfirmada: true,
    parametroRastreio: "sck", // Hotmart: sck recebe utm_content (ou utm_campaign), ver buildCheckoutUrl
    parametroConfirmado: true,
  },

  // Só IDs públicos (nunca token da API de Conversões nem chave pessoal do PostHog). Fora do build de produção ficam `null`
  // (`readTrackerEnv`), para o `npm run dev` não sujar as contas; `VITE_ENABLE_PIXEL_DEV=1` liga de propósito.
  pixel: { id: readTrackerEnv(ENV, "VITE_META_PIXEL_ID") },
  clarity: { id: readTrackerEnv(ENV, "VITE_CLARITY_ID") },
  // PostHog: chave pública do projeto e host de ingestão.
  posthog: { key: readTrackerEnv(ENV, "VITE_POSTHOG_KEY"), host: readTrackerEnv(ENV, "VITE_POSTHOG_HOST") },

  legal: {
    // Arquivos estáticos em public/ (ou URL HTTPS real). O build valida que existem.
    politicaPrivacidade: "/privacy.html",
    termosDeUso: "/terms.html",
  },

  // Prova social: o carrossel de prints de clientes. Print e nota so vao a tela, e so passam no build, com lastro e aprovacao
  // registrados (validation.js). Por ora sao cinco vagas (`print: null`, quadro vazio). Para publicar um print, ponha o arquivo em
  // public/images/prints/ e troque a vaga por:
  //   { id: "print-1", print: "/images/prints/print-1.webp", alt: "o que o print mostra e diz", origem: "canal e data",
  //     autorizacaoRef: "referencia da autorizacao do cliente", aprovado: true }
  // Os cinco relatos em texto da versao anterior (aprovados pelo gerente em 23/11/2026) ficam no historico do git.
  depoimentos: [
    { id: "print-1", print: null },
    { id: "print-2", print: null },
    { id: "print-3", print: null },
    { id: "print-4", print: null },
    { id: "print-5", print: null },
  ],
  avaliacao: { nota: 4.5, maximo: 5, fonte: "informada pelo gerente em 23/11/2026; plataforma e total de avaliações não registrados", aprovado: true },
};

// E-mail público único: o fechamento e o rodapé leem daqui. Nulo quando o e-mail não é válido.
export const PUBLIC_CONTACT = isRealEmail(CONFIG.fornecedor.contato) ? CONFIG.fornecedor.contato.trim() : null;

// O rótulo padrão do CTA: vale para o botão que não traz rótulo próprio (o do vídeo e o do rodapé). Os demais
// levam o texto da sua seção, em src/content/content.js.
export const CTA_SHORT_VERB = "Quero o Lithium vitalício";
