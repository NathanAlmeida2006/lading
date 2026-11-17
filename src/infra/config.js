import { isRealEmail } from "./validation.js";

/**
 * @typedef ValueStackItem Item da pilha de valor.
 * @property {string} id - Identificador estável do item.
 * @property {string} nome - Nome mostrado na tela.
 * @property {number} valor - Valor avulso, em reais.
 */

/**
 * @typedef ValueStackBlock Bloco `pilhaDeValor`: o que a seção de oferta mostra.
 * @property {boolean} ativo - `false` retira a seção do preview.
 * @property {boolean} confirmado - Só `true` libera a publicação (`PUBLICAR=1`).
 * @property {string} fonte - De onde vieram os valores.
 * @property {string} moeda - Símbolo da moeda.
 * @property {string} cabecalho - Título da seção.
 * @property {ValueStackItem[]} itens - Itens da pilha.
 * @property {string} totalRotulo - Rótulo do total declarado.
 * @property {number} totalDeclarado - Total declarado, em reais; precisa bater com a soma dos itens.
 * @property {{rotulo: string}} conector - Ligação entre o total e a oferta.
 * @property {{rotulo: string, preco: number, subtexto: string}} oferta - O preço à vista e o texto que o acompanha.
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
 * @typedef Testimonial Depoimento aprovado: só texto público e referência opaca à autorização.
 * @property {string} id
 * @property {string} texto
 * @property {string} identificacao
 * @property {string} contexto
 * @property {string} origem
 * @property {string} autorizacaoRef
 * @property {boolean} aprovado
 */

/**
 * @typedef Config Dados comerciais da instância. `null` indica informação ainda não confirmada.
 * @property {ValueStackBlock} pilhaDeValor - A seção de pilha de valor.
 * @property {string} campanha - Identificador da campanha, enviado em todo evento do pixel.
 * @property {{mapa: {ativo: boolean, justificativaAusencia: string|null}, amostra: SampleSection}} secoes - Seções opcionais (RF-L08).
 * @property {{disponivel: boolean, moeda: string, pix: {ativo: boolean, valor: number|string|null}, parcelamento: string|null, garantiaDias: number|null, garantiaCondicoes: string|null, garantiaCanal: string|null, bonus: Bonus[], ancoragem: PriceAnchor|null}} oferta - Condições da oferta.
 * @property {{formato: string, canal: string|null, modoDeAcesso: string|null, prazo: string|null}} entrega - Como o produto chega ao comprador (RF-L25).
 * @property {{url: string, urlConfirmada: boolean, parametroRastreio: string|null, parametroConfirmado: boolean}} checkout - Destino único de todos os CTAs.
 * @property {{id: string|null}} pixel - Pixel da Meta; `null` até o id existir.
 * @property {{id: string|null}} clarity - Microsoft Clarity; `null` até o id existir.
 * @property {{contato: string, politicaPrivacidade: string, termosDeUso: string}} legal - Contato público e documentos legais.
 * @property {Testimonial[]} depoimentos - Depoimentos aprovados.
 */

/**
 * Dados comerciais da instância. null indica informação ainda não confirmada.
 * @type {Config}
 */
export const CONFIG = {
  // Dados comerciais da seção de pilha de valor. null indica valor não confirmado. Só `confirmado`
  // true libera a publicação (PUBLICAR=1); `ativo` false retira a seção do preview.
  pilhaDeValor: {
    ativo: true, // desliga a seção no preview
    confirmado: false, // só barra PUBLICAR=1; vira true quando o gerente confirmar valores e fonte
    fonte: "informado pelo usuário em 15/10/2026; sem lastro na base",
    moeda: "R$",
    cabecalho: "Veja tudo que você terá direito",
    itens: [
      { id: "protocolo-hipertrofia", nome: "Protocolo Hipertrofia", valor: 90 },
      { id: "protocolo-dieta", nome: "Protocolo Dieta", valor: 70 },
      { id: "protocolo-sono", nome: "Protocolo Sono", valor: 55 },
      { id: "social-vibe", nome: "Social Vibe", valor: 35 },
      { id: "checklist-integrado", nome: "Checklist Integrado", valor: 50 },
      { id: "app", nome: "App", valor: 300 },
    ],
    totalRotulo: "Preço antigo:",
    totalDeclarado: 600,
    conector: { rotulo: "Vitalício" },
    oferta: { rotulo: "por apenas:", preco: 79.99, subtexto: "pagamento único / acesso vitalício" },
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
    // O preço à vista mora em `pilhaDeValor.oferta.preco` (RF-L23): a tela e a trava do PUBLICAR=1 leem dele.
    moeda: "R$",
    pix: { ativo: true, valor: null },
    parcelamento: null, // opcional, quando confirmado
    garantiaDias: null,
    garantiaCondicoes: null,
    garantiaCanal: null,
    bonus: [], // { id, nome, descricao, origem, confirmado }
    ancoragem: null, // { precoComparativo, fundamento, fonte, confirmado }
  },

  entrega: {
    formato: "app", // RF-L25; canal, modo e prazo ainda requerem confirmação
    canal: null,
    modoDeAcesso: null,
    prazo: null,
  },

  checkout: {
    url: "https://pay.hotmart.com/Y108171272A", // checkout da Hotmart: único destino de todos os CTAs
    urlConfirmada: true,
    parametroRastreio: "sck", // Hotmart: sck recebe utm_content (ou utm_campaign), ver buildCheckoutUrl
    parametroConfirmado: true,
  },

  // Só IDs públicos (nunca token da API de Conversões). Fora do build de produção ficam `null`, para o
  // `npm run dev` não sujar as contas; `VITE_ENABLE_PIXEL_DEV=1` liga de propósito.
  // `?.` porque os testes importam este arquivo em Node puro, onde `import.meta.env` não existe.
  pixel: { id: (import.meta.env?.PROD || import.meta.env?.VITE_ENABLE_PIXEL_DEV) && import.meta.env?.VITE_META_PIXEL_ID || null },
  clarity: { id: (import.meta.env?.PROD || import.meta.env?.VITE_ENABLE_PIXEL_DEV) && import.meta.env?.VITE_CLARITY_ID || null },

  legal: {
    contato: "suportelithiumbr@gmail.com", // e-mail de suporte: aparece no fechamento e no rodapé legal
    // Arquivos estáticos em public/ (ou URL HTTPS real). PUBLICAR=1 valida que existem no build.
    politicaPrivacidade: "/privacy.html",
    termosDeUso: "/terms.html",
  },

  // Apenas texto público aprovado e referência opaca à autorização; nenhum
  // documento de autorização nem contato privado entra no bundle.
  depoimentos: [], // { id, texto, identificacao, contexto, origem, autorizacaoRef, aprovado }
};

// E-mail público único: o fechamento e o rodapé leem daqui. Nulo quando o e-mail não é válido.
export const PUBLIC_CONTACT = isRealEmail(CONFIG.legal.contato) ? CONFIG.legal.contato.trim() : null;

// O verbo do CTA (RF-L10). Nenhum botão mostra o preço: o valor fica na pilha de oferta.
export const CTA_SHORT_VERB = "Quero o Lithium vitalício";
