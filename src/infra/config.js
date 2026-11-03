import { emailReal } from "./validacao.js";

/** Dados comerciais da instância. null indica informação ainda não confirmada. */
export const config = {
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
    preco: null, // valor à vista em reais; RF-L23
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
    parametroRastreio: null,
    parametroConfirmado: false,
  },

  pixel: { id: null },

  legal: {
    contato: "suportelithiumbr@gmail.com", // e-mail de suporte: aparece no fechamento e no rodapé legal
    // Arquivos estáticos em public/ (ou URL HTTPS real). PUBLICAR=1 valida que existem no build.
    politicaPrivacidade: "/privacidade.html",
    termosDeUso: "/termos.html",
  },

  // Apenas texto público aprovado e referência opaca à autorização; nenhum
  // documento de autorização nem contato privado entra no bundle.
  depoimentos: [], // { id, texto, identificacao, contexto, origem, autorizacaoRef, aprovado }
};

// E-mail público único: o fechamento e o rodapé leem daqui. Nulo quando o e-mail não é válido.
export const contatoPublico = emailReal(config.legal.contato) ? config.legal.contato.trim() : null;

// O verbo do CTA (RF-L10). Nenhum botão mostra o preço: o valor fica na pilha de oferta.
export const VERBO_CURTO = "Quero o Lithium vitalício";
