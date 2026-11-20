import { CONFIG } from "../infra/config.js";

/**
 * Lógica pura da pilha de valor: confere o bloco de dados comerciais e devolve a forma
 * apresentável. Sem Date, window ou Intl: a saída é a mesma no servidor e no cliente.
 */

/**
 * @typedef PresentableValueStack A pilha de valor pronta para a tela: todo valor já formatado.
 * @property {string} cabecalho - Título da seção.
 * @property {{id: string, nome: string}[]} itens - O que a compra inclui.
 * @property {string} tituloItens - Título acima da lista.
 * @property {string} moeda - Símbolo da moeda.
 * @property {{rotulo: string}} conector - Ligação entre a lista e a oferta.
 * @property {{rotulo: string, preco: string, comparacao: string, subtexto: string}} oferta - O preço à vista, formatado, a comparação sob ele e o detalhe do pagamento.
 */

/**
 * @param {unknown} amount - Valor a conferir.
 * @returns {amount is number} `true` quando é número finito e positivo.
 */
const isValidAmount = (amount) => typeof amount === "number" && Number.isFinite(amount) && amount > 0;

/**
 * Lista de erros do bloco; vazia quando o bloco pode ser exibido.
 * @param {import("../infra/config.js").ValueStackBlock|null|undefined} block - Bloco `pilhaDeValor` da configuração.
 * @returns {string[]} Mensagens de erro; vazia quando o bloco pode ser exibido.
 */
export function listValueStackErrors(block) {
  if (!block) return ["bloco pilhaDeValor ausente"];
  const errors = [];
  if (block.ativo !== true) errors.push("seção desativada (ativo diferente de true)");
  if (!Array.isArray(block.itens) || block.itens.length === 0) {
    errors.push("itens vazios");
  } else {
    block.itens.forEach((item, index) => {
      if (typeof item?.nome !== "string" || item.nome.trim() === "") errors.push(`itens[${index}].nome ausente`);
    });
  }
  if (!isValidAmount(block.oferta?.preco)) errors.push("oferta.preco inválido");
  return errors;
}

/**
 * Inteiro sai sem centavos; o resto com vírgula e duas casas.
 * @param {number} amount - Valor em reais.
 * @returns {string} Valor formatado, com vírgula decimal quando há centavos.
 */
export const formatReais = (amount) => (Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace(".", ","));

/**
 * Forma pronta para a tela, com valores já formatados; `null` quando o bloco não pode ser exibido.
 * @param {import("../infra/config.js").ValueStackBlock|null|undefined} block - Bloco `pilhaDeValor` da configuração.
 * @returns {PresentableValueStack|null} A forma apresentável, ou `null` quando há erros de configuração.
 */
export function buildPresentableValueStack(block) {
  if (!block || listValueStackErrors(block).length) return null;
  return {
    cabecalho: block.cabecalho,
    itens: block.itens.map(({ id, nome }) => ({ id, nome })),
    tituloItens: block.tituloItens,
    moeda: block.moeda,
    conector: block.conector,
    oferta: { rotulo: block.oferta.rotulo, preco: formatReais(block.oferta.preco), comparacao: block.oferta.comparacao, subtexto: block.oferta.subtexto },
  };
}

// Forma pronta da config comercial, conferida e formatada uma vez por carga.
export const READY_VALUE_STACK = buildPresentableValueStack(CONFIG.pilhaDeValor);
