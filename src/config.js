import { reais } from "./pilha.js";

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
    referenciaComercial: null, // referência opaca da configuração comercial aprovada
    preco: null, // valor à vista em reais; RF-L23
    moeda: "R$",
    pix: { ativo: true, valor: null },
    parcelamento: null, // opcional, quando confirmado
    garantiaDias: null,
    garantiaCondicoes: null,
    garantiaCanal: null,
    bonus: [], // { id, nome, descricao, origem, confirmado }
    ancoragem: null, // { precoComparativo, fundamento, fonte, confirmado }
    condicaoOferta: null, // { texto, fonte, inicio, fim, fuso, referenciaComercial, confirmado, dataConfirmacao, identificadorCheckout }
  },

  entrega: {
    formato: "app", // RF-L25; canal, modo e prazo ainda requerem confirmação
    canal: null,
    modoDeAcesso: null,
    prazo: null,
  },

  checkout: {
    identificadorOferta: null, // ID da oferta correspondente na Ticto, quando confirmado
    url: "#oferta", // âncora segura do preview; substituir pela URL real da Ticto
    urlConfirmada: false,
    parametroRastreio: null,
    parametroConfirmado: false,
  },

  pixel: { id: null },

  legal: {
    responsavel: null,
    documento: null,
    contato: null,
    // Preencher somente com documentos aprovados: /privacidade.html,
    // /termos.html ou URLs HTTPS reais confirmadas. PUBLICAR=1 valida os arquivos.
    politicaPrivacidade: null,
    termosDeUso: null,
  },

  // Apenas texto público aprovado e referência opaca à autorização; nenhum
  // documento de autorização nem contato privado entra no bundle.
  depoimentos: [], // { id, texto, identificacao, contexto, origem, autorizacaoRef, aprovado }
};

// O verbo do CTA (RF-L10). O preço sai da pilha de valor, o mesmo número do recibo: mudou lá, muda aqui.
// A dobra usa a forma curta, sem o preço.
export const VERBO_CURTO = "Quero o Lithium vitalício";
export const VERBO_ACAO = `${VERBO_CURTO} por ${config.pilhaDeValor.moeda} ${reais(config.pilhaDeValor.oferta.preco)}`;
