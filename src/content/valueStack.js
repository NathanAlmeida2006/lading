import { CONFIG } from "../infra/config.js";

/**
 * Lógica pura da pilha de valor: confere o bloco de dados comerciais e devolve a forma
 * apresentável. Sem Date, window ou Intl: a saída é a mesma no servidor e no cliente.
 */

/**
 * @typedef PresentableValueStack A pilha de valor pronta para a tela: todo valor já formatado.
 * @property {string} header - Título da seção.
 * @property {{id: string, name: string}[]} items - O que a compra inclui.
 * @property {string} itemsTitle - Título acima da lista.
 * @property {string} currency - Símbolo da moeda.
 * @property {{label: string}} connector - Ligação entre a lista e a oferta.
 * @property {{label: string, installments: number, installmentValue: string, totalInstallments: string, seal: string, price: string, subtext: string}} offer - O número e o valor formatado das parcelas, o preço à vista formatado, e o detalhe do pagamento.
 */

/**
 * @param {unknown} amount - Valor a conferir.
 * @returns {amount is number} `true` quando é número finito e positivo.
 */
const isValidAmount = (amount) =>
  typeof amount === "number" && Number.isFinite(amount) && amount > 0;

/**
 * Lista de erros do bloco; vazia quando o bloco pode ser exibido.
 * @param {import("../infra/config.js").ValueStackBlock|null|undefined} block - Bloco `valueStack` da configuração.
 * @returns {string[]} Mensagens de erro; vazia quando o bloco pode ser exibido.
 */
export function listValueStackErrors(block) {
  if (!block) return ["bloco pilhaDeValor ausente"];
  const errors = [];
  if (block.active !== true) errors.push("seção desativada (ativo diferente de true)");
  if (!Array.isArray(block.items) || block.items.length === 0) {
    errors.push("itens vazios");
  } else {
    block.items.forEach((item, index) => {
      if (typeof item?.name !== "string" || item.name.trim() === "")
        errors.push(`items[${index}].name ausente`);
    });
  }
  if (!isValidAmount(block.offer?.price)) errors.push("offer.price inválido");
  return errors;
}

/**
 * Inteiro sai sem centavos; o resto com vírgula e duas casas.
 * @param {number} amount - Valor em reais.
 * @returns {string} Valor formatado, com vírgula decimal quando há centavos.
 */
export const formatReais = (amount) =>
  Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace(".", ",");

/**
 * Forma pronta para a tela, com valores já formatados; `null` quando o bloco não pode ser exibido.
 * @param {import("../infra/config.js").ValueStackBlock|null|undefined} block - Bloco `valueStack` da configuração.
 * @returns {PresentableValueStack|null} A forma apresentável, ou `null` quando há erros de configuração.
 */
export function buildPresentableValueStack(block) {
  if (!block || listValueStackErrors(block).length) return null;
  return {
    header: block.header,
    items: block.items.map(({ id, name }) => ({ id, name })),
    itemsTitle: block.itemsTitle,
    currency: block.currency,
    connector: block.connector,
    offer: {
      ...block.offer,
      price: formatReais(block.offer.price),
      installmentValue: formatReais(block.offer.installmentValue),
      // Arredonda os centavos: 3 * 28,55 em ponto flutuante não fecha em 85,65.
      totalInstallments: formatReais(
        Math.round(block.offer.installments * block.offer.installmentValue * 100) / 100,
      ),
    },
  };
}

// Forma pronta da config comercial, conferida e formatada uma vez por carga.
export const READY_VALUE_STACK = buildPresentableValueStack(CONFIG.valueStack);
