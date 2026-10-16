// Confere a lógica pura da pilha de valor: soma, formatação e portas de exibição.
import assert from "node:assert/strict";
import { config } from "../src/config.js";
import { errosPilha, pilhaApresentavel } from "../src/pilha.js";

const bloco = config.pilhaDeValor;
const soma = bloco.itens.reduce((total, item) => total + item.valor, 0);
assert.equal(soma, 600, "soma dos itens deve ser 600");

const apresentado = pilhaApresentavel(bloco);
assert.notEqual(apresentado, null, "bloco válido deve ser apresentável");
assert.equal(apresentado.total, "600");
assert.equal(apresentado.oferta.preco, "77,99");

const adulterado = { ...bloco, itens: bloco.itens.map((item, i) => (i === 0 ? { ...item, valor: 91 } : item)) };
assert.equal(pilhaApresentavel(adulterado), null, "soma divergente não pode ser exibida");
assert.ok(errosPilha(adulterado).length > 0);

assert.equal(pilhaApresentavel({ ...bloco, ativo: false }), null, "seção desativada não pode ser exibida");

console.log("verificar-pilha-dados  ok: soma 600, formatação 77,99, portas de exibição");
