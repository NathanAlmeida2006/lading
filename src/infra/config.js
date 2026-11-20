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
 * @property {{rotulo: string, preco: number, comparacao: string, subtexto: string}} oferta - O preço à vista, a comparação sob ele e o detalhe do pagamento.
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
 * @property {{disponivel: boolean, moeda: string, pix: {ativo: boolean, valor: number|string|null, confirmado: boolean}, parcelamento: string|null, garantiaDias: number|null, garantiaCondicoes: string|null, garantiaCanal: string|null, bonus: Bonus[], ancoragem: PriceAnchor|null}} oferta - Condições da oferta.
 * @property {{formato: string, canal: string|null, modoDeAcesso: string|null, prazo: string|null}} entrega - Como o produto chega ao comprador (RF-L25).
 * @property {{contato: string}} fornecedor - Contato: aparece no rodapé e nos documentos legais.
 * @property {{url: string, urlConfirmada: boolean, parametroRastreio: string|null, parametroConfirmado: boolean}} checkout - Destino único de todos os CTAs.
 * @property {{id: string|null}} pixel - Pixel da Meta; `null` até o id existir.
 * @property {{id: string|null}} clarity - Microsoft Clarity; `null` até o id existir.
 * @property {{politicaPrivacidade: string, termosDeUso: string}} legal - Documentos legais.
 * @property {Testimonial[]} depoimentos - Depoimentos aprovados.
 */

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
    ],
    tituloItens: "Itens inclusos",
    conector: { rotulo: "Vitalício" },
    oferta: {
      rotulo: "Acesso vitalício por pagamento único de:",
      preco: 79.99,
      // "Menos de R$ 2,25" vale para 79,99 / 36 treinos = 2,22; scripts/tests/faq.test.mjs trava a conta se o preço mudar.
      comparacao: "Menos de R$ 2,25 por treino. Mais barato que um pote de creatina que acaba em 30 dias.",
      subtexto: "Pix ou cartão via Hotmart · Acesso imediato · Zero mensalidades",
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
    garantiaDias: 7,
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

  // Só IDs públicos (nunca token da API de Conversões). Fora do build de produção ficam `null`, para o
  // `npm run dev` não sujar as contas; `VITE_ENABLE_PIXEL_DEV=1` liga de propósito.
  // `?.` porque os testes importam este arquivo em Node puro, onde `import.meta.env` não existe.
  pixel: { id: (import.meta.env?.PROD || import.meta.env?.VITE_ENABLE_PIXEL_DEV) && import.meta.env?.VITE_META_PIXEL_ID || null },
  clarity: { id: (import.meta.env?.PROD || import.meta.env?.VITE_ENABLE_PIXEL_DEV) && import.meta.env?.VITE_CLARITY_ID || null },

  legal: {
    // Arquivos estáticos em public/ (ou URL HTTPS real). O build valida que existem.
    politicaPrivacidade: "/privacy.html",
    termosDeUso: "/terms.html",
  },

  // Apenas texto público aprovado e referência opaca à autorização; nenhum
  // documento de autorização nem contato privado entra no bundle.
  depoimentos: [], // { id, texto, identificacao, contexto, origem, autorizacaoRef, aprovado }
};

// E-mail público único: o fechamento e o rodapé leem daqui. Nulo quando o e-mail não é válido.
export const PUBLIC_CONTACT = isRealEmail(CONFIG.fornecedor.contato) ? CONFIG.fornecedor.contato.trim() : null;

// O rótulo padrão do CTA: vale para o botão que não traz rótulo próprio (o do vídeo e o do rodapé). Os demais
// levam o texto da sua seção, em src/content/content.js.
export const CTA_SHORT_VERB = "Quero o Lithium vitalício";
