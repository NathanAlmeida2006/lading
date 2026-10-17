// Confere a lógica pura da pilha de valor: soma, formatação e portas de exibição.
// Os valores esperados saem da própria config (com o Intl como formatador independente),
// para o teste não envelhecer a cada mudança de preço.
import assert from "node:assert/strict";
import { config, VERBO_ACAO } from "../src/config.js";
import { conteudo } from "../src/conteudo.js";
import { errosPilha, pilhaApresentavel } from "../src/pilha.js";

const bloco = config.pilhaDeValor;
const centavos = (valor) => Math.round(valor * 100);
const reais = (valor) => valor.toLocaleString("pt-BR", {
  minimumFractionDigits: Number.isInteger(valor) ? 0 : 2, maximumFractionDigits: 2, useGrouping: false,
});

const soma = bloco.itens.reduce((total, item) => total + centavos(item.valor), 0);
assert.equal(soma, centavos(bloco.totalDeclarado), "soma dos itens deve bater com o total declarado");

const apresentado = pilhaApresentavel(bloco);
assert.notEqual(apresentado, null, "bloco válido deve ser apresentável");
assert.equal(apresentado.total, reais(bloco.totalDeclarado));
assert.equal(apresentado.oferta.preco, reais(bloco.oferta.preco));

const adulterado = { ...bloco, itens: bloco.itens.map((item, i) => (i === 0 ? { ...item, valor: item.valor + 1 } : item)) };
assert.equal(pilhaApresentavel(adulterado), null, "soma divergente não pode ser exibida");
assert.ok(errosPilha(adulterado).length > 0);

assert.equal(pilhaApresentavel({ ...bloco, ativo: false }), null, "seção desativada não pode ser exibida");

// O CTA e o FAQ citam o mesmo preço do recibo (derivados de `config.pilhaDeValor`, não digitados).
const preco = `${bloco.moeda} ${reais(bloco.oferta.preco)}`;
assert.ok(VERBO_ACAO.endsWith(preco), `o verbo do CTA deve citar ${preco}`);
assert.ok(conteudo.objecoes.some(({ resposta }) => resposta.includes(preco)), `o FAQ deve citar ${preco}`);

console.log(`verificar-pilha-dados  ok: soma ${apresentado.total}, preço ${apresentado.oferta.preco}, portas de exibição`);
