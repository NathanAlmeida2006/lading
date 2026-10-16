/**
 * Lógica pura da pilha de valor: confere o bloco de dados comerciais e devolve a forma
 * apresentável. Sem Date, window ou Intl: a saída é a mesma no servidor e no cliente.
 */

const centavos = (valor) => Math.round(valor * 100);

const valido = (valor) => typeof valor === "number" && Number.isFinite(valor) && valor > 0;

/** Lista de erros do bloco; vazia quando o bloco pode ser exibido. */
export function errosPilha(bloco) {
  if (!bloco) return ["bloco pilhaDeValor ausente"];
  const erros = [];
  if (bloco.ativo !== true) erros.push("seção desativada (ativo diferente de true)");
  if (!Array.isArray(bloco.itens) || bloco.itens.length === 0) {
    erros.push("itens vazios");
  } else {
    bloco.itens.forEach((item, indice) => {
      if (!valido(item.valor)) erros.push(`itens[${indice}].valor não finito ou não positivo`);
    });
  }
  if (!valido(bloco.oferta?.preco)) erros.push("oferta.preco inválido");
  if (!valido(bloco.totalDeclarado)) {
    erros.push("totalDeclarado inválido");
  } else if (Array.isArray(bloco.itens)) {
    const soma = bloco.itens.reduce((total, item) => total + centavos(item.valor), 0);
    if (soma !== centavos(bloco.totalDeclarado)) erros.push(`soma dos itens (${soma / 100}) diverge do total declarado (${bloco.totalDeclarado})`);
  }
  return erros;
}

/** Inteiro sai sem centavos; o resto com vírgula e duas casas. */
const reais = (valor) => (Number.isInteger(valor) ? String(valor) : valor.toFixed(2).replace(".", ","));

/** Forma pronta para a tela, com valores já formatados; `null` quando o bloco não pode ser exibido. */
export function pilhaApresentavel(bloco) {
  if (errosPilha(bloco).length) return null;
  return {
    cabecalho: bloco.cabecalho,
    itens: bloco.itens.map(({ id, nome, valor }) => ({ id, nome, valor: reais(valor) })),
    totalRotulo: bloco.totalRotulo,
    total: reais(bloco.totalDeclarado),
    moeda: bloco.moeda,
    conector: bloco.conector,
    oferta: { rotulo: bloco.oferta.rotulo, preco: reais(bloco.oferta.preco), subtexto: bloco.oferta.subtexto },
  };
}
