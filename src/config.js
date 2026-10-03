/**
 * Tudo o que muda de uma landing para outra vive aqui.
 *
 * Uma landing nova sai por troca deste arquivo e do acento do protocolo, sem
 * fork de codigo (RNF-L29). O que estiver `[A DEFINIR]` esta na tabela de
 * campos em aberto de `02-fluor/landing/requisitos-landing.md` §6, e trava a
 * publicacao: nao ha default seguro para preco nem para prazo de garantia.
 * `scripts/prerender.mjs` lista os pendentes a cada build e, com `PUBLICAR=1`,
 * recusa o build (e o que deve ligar o ambiente de producao).
 *
 * `angulo`, `protocolo`, `campanha` e `lastro` identificam a landing: nenhum codigo
 * da pagina os le, e ficam aqui como registro.
 */
export const config = {
  angulo: "teto-natural",
  protocolo: "hipertrofia",
  campanha: "cmp-0000-00-definir",
  lastro: "dossie-hipertrofia §5.3 e §5.1",

  // O acento (um por pagina, o do protocolo que ela vende, RF-G09) nao mora aqui:
  // e o token `--acento` de tokens/cor.css. hipertrofia -> --rubro · dieta-basica ->
  // --praga · sono -> --vigilia.

  oferta: {
    preco: null,            // [A DEFINIR] · RF-L23, herdado do TAP
    moeda: "R$",
    parcelamento: null,     // [A DEFINIR]
    garantiaDias: null,     // [A DEFINIR] · RF-L24
  },

  // RF-L20: o checkout e servico contratado e nao e entrega deste projeto.
  // A pagina invoca, nunca reimplementa.
  checkout: {
    url: "https://payfast.greenn.com.br/DEFINIR",   // [A DEFINIR] · URL da Ticto
    // [A CONFIRMAR na conta antes de F-1] · RF-L26. O nome do parametro de
    // rastreio da Ticto entra aqui, e e ele que torna a venda atribuivel ao
    // criativo que a gerou. Errado, o ledger registra receita sem origem.
    parametroRastreio: "src",
  },

  pixel: {
    id: null,               // [A DEFINIR] · RF-L27
  },

  legal: {
    responsavel: "[A DEFINIR]",
    documento: "[A DEFINIR]",     // CNPJ ou CPF do emissor
    contato: "[A DEFINIR]",
    politicaPrivacidade: "/privacidade", // [A DEFINIR] a rota ainda nao existe no build
    termosDeUso: "/termos", // [A DEFINIR] idem
  },

  // RF-L08: a secao Amostra e opcional, e depende do Marco 4 do Lithium
  // (protocolos finalizados, 31/08/2026). Ligue quando houver miolo real para
  // mostrar; ate la, mostrar amostra inventada quebraria RF-L12.
  mostrarAmostra: false,
};

/** O verbo do botao e um so, em toda a pagina (RF-L10). */
export const VERBO_ACAO = "Começar o protocolo";
