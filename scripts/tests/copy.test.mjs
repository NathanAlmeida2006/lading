// Copy comercial (src/content/content.js): preco e garantia saem da config, e a pagina nao volta a ter preco riscado nem cronometro.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { CONTENT } from "../../src/content/content.js";
import { CONFIG } from "../../src/infra/config.js";

const DIAS = `${CONFIG.oferta.garantiaDias} dias`;

test("os textos de venda trazem o preco e a garantia da config", () => {
  assert.equal(CONFIG.pilhaDeValor.oferta.preco, 79.99);
  assert.equal(CONFIG.oferta.garantiaDias, 7);
  // O fechamento nao repete o preco: ele mora so na oferta.
  assert.equal(CONTENT.fechamento.condicoes, `Pagamento único · Acesso imediato · ${DIAS} de garantia`);
  assert.equal(CONTENT.oferta.cta, "Quero o Lithium agora");
  assert.equal(CONTENT.oferta.garantia.titulo, `Risco zero: Garantia incondicional de ${DIAS}`);
  assert.deepEqual(CONTENT.doca, { texto: "Tenha acesso ao seu Lithium Vitalício", cta: "Garantir acesso" });
});

test("cada secao tem o CTA proprio", () => {
  assert.deepEqual(
    [CONTENT.dobra.cta, CONTENT.espelho.cta, CONTENT.mapa.cta, CONTENT.fechamento.cta],
    ["Quero parar de improvisar", "Quero meu protocolo de 12 semanas", "Garantir meu acesso vitalício", "Começar minhas 12 semanas agora"],
  );
});

test("a copy nao carrega preco riscado, 'de/por' nem cronometro", () => {
  const tudo = JSON.stringify([CONTENT, CONFIG.pilhaDeValor]);
  assert.doesNotMatch(tudo, /R\$ ?200|riscad|cron[ôo]metro|\bde R\$ [\d.,]+ por R\$/i);
});

test("cada depoimento e uma vaga (print: null) ou um print que existe em public/", () => {
  assert.equal(CONFIG.depoimentos.length, 5);
  for (const { id, print } of CONFIG.depoimentos) {
    if (print !== null) assert.ok(existsSync(new URL(`../../public${print}`, import.meta.url)), id);
  }
});

test("o FAQ tem as sete perguntas, cada uma com resposta", () => {
  assert.equal(CONTENT.objecoes.length, 6);
  for (const { pergunta, resposta } of CONTENT.objecoes) assert.ok(pergunta.endsWith("?") && resposta.length > 40, pergunta);
});

test("a avaliacao dos compradores esta entre 0 e o maximo", () => {
  const { nota, maximo } = CONFIG.avaliacao;
  assert.ok(nota > 0 && nota <= maximo && maximo === 5);
});

test("o Social Vibe tem o titulo em duas linhas e os rotulos do mural", () => {
  const { titulo, curtos, noticias } = CONTENT.vibe;
  assert.equal(titulo.length, 2);
  assert.ok(curtos && noticias);
  const { videos, shorts, noticia } = CONTENT.vibe;
  assert.ok(videos.length === 2 && shorts.length === 2 && noticia.resumo.length > 40);
  for (const { src } of [...videos, ...shorts, noticia]) assert.ok(existsSync(new URL(`../../public${src}`, import.meta.url)), src);
  for (const { avatar } of videos) assert.ok(existsSync(new URL(`../../public${avatar}`, import.meta.url)), avatar);
});

test("os selos da garantia sao tres e o ultimo cita os dias da config", () => {
  const { selos } = CONTENT.oferta.garantia;
  assert.deepEqual(selos.map(({ icone }) => icone), ["pagamento", "protecao", "garantia"]);
  assert.equal(selos[2].texto, `Garantia de ${CONFIG.oferta.garantiaDias} dias.`);
});
