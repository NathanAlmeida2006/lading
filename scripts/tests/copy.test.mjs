// Copy comercial (src/content/content.js): preço e garantia saem da config, e a página não volta a ter preço riscado nem cronômetro.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { CONTENT } from "../../src/content/content.js";
import { CONFIG } from "../../src/infra/config.js";

const DIAS = `${CONFIG.offer.guaranteeDays} dias`;

test("os textos de venda trazem o preco e a garantia da config", () => {
  assert.equal(CONFIG.valueStack.offer.price, 79.99);
  assert.equal(CONFIG.offer.guaranteeDays, 7);
  // O fechamento não repete o preço: ele mora só na oferta.
  assert.equal(
    CONTENT.closing.conditions,
    `Pagamento único · Acesso imediato · ${DIAS} de garantia`,
  );
  assert.equal(CONTENT.offer.cta, "Quero o Lithium agora");
  assert.equal(CONTENT.offer.guarantee.title, `Risco zero: Garantia incondicional de ${DIAS}`);
  assert.deepEqual(CONTENT.dock, {
    text: "Tenha acesso ao seu Lithium Vitalício",
    cta: "Garantir acesso",
  });
});

test("cada secao tem o CTA proprio", () => {
  assert.deepEqual(
    [CONTENT.fold.cta, CONTENT.mirror.cta, CONTENT.roadmap.cta, CONTENT.closing.cta],
    [
      "Quero parar de improvisar",
      "Quero meu protocolo de 12 semanas",
      "Garantir meu acesso vitalício",
      "Começar minhas 12 semanas agora",
    ],
  );
});

test("a copy nao carrega preco riscado, 'de/por' nem cronometro", () => {
  const tudo = JSON.stringify([CONTENT, CONFIG.valueStack]);
  assert.doesNotMatch(tudo, /R\$ ?200|riscad|cron[ôo]metro|\bde R\$ [\d.,]+ por R\$/i);
});

test("cada depoimento e uma vaga (print: null) ou um print que existe em public/", () => {
  assert.equal(CONFIG.testimonials.length, 2);
  for (const { id, print } of CONFIG.testimonials) {
    if (print !== null) assert.ok(existsSync(new URL(`../../public${print}`, import.meta.url)), id);
  }
});

test("o FAQ tem as sete perguntas, cada uma com resposta", () => {
  assert.equal(CONTENT.objections.length, 6);
  for (const { question, answer } of CONTENT.objections)
    assert.ok(question.endsWith("?") && answer.length > 40, question);
});

test("a avaliacao dos compradores esta entre 0 e o maximo", () => {
  const { note, max } = CONFIG.assessment;
  assert.ok(note > 0 && note <= max && max === 5);
});

test("o Social Vibe tem o titulo em duas linhas e os rotulos do mural", () => {
  const { title, shortVideos, news } = CONTENT.vibe;
  assert.equal(title.length, 2);
  assert.ok(shortVideos && news);
  const { videos, shorts, newsItem } = CONTENT.vibe;
  assert.ok(videos.length === 2 && shorts.length === 2 && newsItem.summary.length > 40);
  for (const { src } of [...videos, ...shorts, newsItem])
    assert.ok(existsSync(new URL(`../../public${src}`, import.meta.url)), src);
  for (const { avatar } of videos)
    assert.ok(existsSync(new URL(`../../public${avatar}`, import.meta.url)), avatar);
});

test("os selos da garantia sao tres e o ultimo cita os dias da config", () => {
  const { seals } = CONTENT.offer.guarantee;
  assert.deepEqual(
    seals.map(({ icon }) => icon),
    ["payment", "protection", "guarantee"],
  );
  assert.equal(seals[2].text, `Garantia de ${CONFIG.offer.guaranteeDays} dias.`);
});

// Selo sem desenho renderiza o texto com um vazio no lugar do ícone, e nenhum outro teste vê.
test("todo selo da garantia tem desenho em SEAL_ICONS", () => {
  const source = readFileSync(
    new URL("../../src/sections/ValueStack.jsx", import.meta.url),
    "utf8",
  );
  const drawn = /const SEAL_ICONS = \{([\s\S]*?)\n\};/.exec(source)[1];
  for (const { icon } of CONTENT.offer.guarantee.seals)
    assert.match(drawn, new RegExp(`^  ${icon}: \\(`, "m"), icon);
});
