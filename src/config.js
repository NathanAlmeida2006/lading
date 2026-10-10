/** Dados comerciais da instância. null indica informação ainda não confirmada. */
export const config = {
  angulo: "teto-natural",
  protocolo: "hipertrofia",
  campanha: "cmp-2026-10-teto-natural",
  lastro: "dossie-hipertrofia §5.3 e §5.1",

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

export const VERBO_ACAO = "Começar o protocolo";
