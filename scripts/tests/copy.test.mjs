// Copy comercial (src/content/content.js): preco e garantia saem da config, e a pagina nao volta a ter preco riscado nem cronometro.
import { test } from "node:test";
import assert from "node:assert/strict";
import { CONTENT } from "../../src/content/content.js";
import { CONFIG } from "../../src/infra/config.js";

const PRECO = "R$ 79,99";
const DIAS = `${CONFIG.oferta.garantiaDias} dias`;

test("os textos de venda trazem o preco e a garantia da config", () => {
  assert.equal(CONFIG.pilhaDeValor.oferta.preco, 79.99);
  assert.equal(CONFIG.oferta.garantiaDias, 7);
  for (const texto of [CONTENT.fechamento.condicoes]) {
    assert.ok(texto.includes(PRECO) && texto.includes(`${DIAS} de garantia`), texto);
  }
  assert.equal(CONTENT.oferta.cta, `Quero o Lithium agora por ${PRECO}`);
  assert.equal(CONTENT.oferta.garantia.titulo, `Risco zero: Garantia incondicional de ${DIAS}`);
  assert.deepEqual(CONTENT.doca, { nome: "Lithium Vitalício", garantia: `${DIAS} de garantia`, cta: "Garantir acesso" });
});

test("cada secao tem o CTA proprio", () => {
  assert.deepEqual(
    [CONTENT.dobra.cta, CONTENT.espelho.cta, CONTENT.mapa.cta, CONTENT.fechamento.cta],
    ["Acesso imediato · 7 dias de garantia", "Quero meu protocolo de 12 semanas", "Garantir meu acesso vitalício", "Começar minhas 12 semanas agora"],
  );
});

test("a copy nao carrega preco riscado, 'de/por' nem cronometro", () => {
  const tudo = JSON.stringify([CONTENT, CONFIG.pilhaDeValor]);
  assert.doesNotMatch(tudo, /R\$ ?200|riscad|cron[ôo]metro|\bde R\$ [\d.,]+ por R\$/i);
});

test("o FAQ tem as sete perguntas, cada uma com resposta", () => {
  assert.equal(CONTENT.objecoes.length, 7);
  for (const { pergunta, resposta } of CONTENT.objecoes) assert.ok(pergunta.endsWith("?") && resposta.length > 40, pergunta);
});
