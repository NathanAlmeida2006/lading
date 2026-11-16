import { CONFIG } from "../infra/config.js";

/**
 * Lógica pura da pilha de valor: confere o bloco de dados comerciais e devolve a forma
 * apresentável. Sem Date, window ou Intl: a saída é a mesma no servidor e no cliente.
 */

/**
 * @typedef PresentableValueStack A pilha de valor pronta para a tela: todo valor já formatado.
 * @property {string} cabecalho - Título da seção.
 * @property {{id: string, nome: string, valor: string}[]} itens - Itens, com o valor formatado.
 * @property {string} totalRotulo - Rótulo do total declarado.
 * @property {string} total - Total declarado, formatado.
 * @property {string} moeda - Símbolo da moeda.
 * @property {{rotulo: string}} conector - Ligação entre o total e a oferta.
 * @property {{rotulo: string, preco: string, subtexto: string}} oferta - O preço à vista, formatado, e o texto que o acompanha.
 */

/**
 * @param {number} amount - Valor em reais.
 * @returns {number} O valor em centavos, inteiro.
 */
const toCents = (amount) => Math.round(amount * 100);

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
      if (!isValidAmount(item.valor)) errors.push(`itens[${index}].valor não finito ou não positivo`);
    });
  }
  if (!isValidAmount(block.oferta?.preco)) errors.push("oferta.preco inválido");
  if (!isValidAmount(block.totalDeclarado)) {
    errors.push("totalDeclarado inválido");
  } else if (Array.isArray(block.itens)) {
    const sum = block.itens.reduce((total, item) => total + toCents(item.valor), 0);
    if (sum !== toCents(block.totalDeclarado)) errors.push(`soma dos itens (${sum / 100}) diverge do total declarado (${block.totalDeclarado})`);
  }
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
    itens: block.itens.map(({ id, nome, valor: amount }) => ({ id, nome, valor: formatReais(amount) })),
    totalRotulo: block.totalRotulo,
    total: formatReais(block.totalDeclarado),
    moeda: block.moeda,
    conector: block.conector,
    oferta: { rotulo: block.oferta.rotulo, preco: formatReais(block.oferta.preco), subtexto: block.oferta.subtexto },
  };
}

// Forma pronta da config comercial, conferida e formatada uma vez por carga.
export const READY_VALUE_STACK = buildPresentableValueStack(CONFIG.pilhaDeValor);
