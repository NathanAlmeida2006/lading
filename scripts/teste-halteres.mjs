/**
 * Confere a gravacao dos halteres (src/motion/halteres.js) sem navegador: `npm run teste:halteres`.
 * Falha se a pilha nao assenta, se algo escapa da tela, se os halteres se interpenetram, se o
 * fim da gravacao ainda treme, se a simulacao nao e deterministica ou se algum haltere "voa".
 */
import assert from "node:assert/strict";
import { assar, poseDe, quantidadeDePresets } from "../src/motion/halteres.js";

assert.equal(quantidadeDePresets, 10);
// Todos os presets em desktop, mais dois em celular e em tela grande.
const casos = [
  ...Array.from({ length: quantidadeDePresets }, (_, p) => [1280, 800, p]),
  [390, 844, 6], [390, 844, 9], [1920, 1080, 8],
];
const finais = [];
for (const [LARGURA, ALTURA, PRESET] of casos) {
  const t0 = performance.now();
  const sim = assar(LARGURA, ALTURA, 1234, PRESET);
  const ms = performance.now() - t0;
  const { L, total, quadros, inicio, circulos } = sim;
  if (LARGURA === 1280) finais.push(sim.poses.slice(100 * total * 3, 101 * total * 3)); // quadro 100: queda em curso
  const pose = (q, i) => {
    const o = (q * total + i) * 3;
    return { x: sim.poses[o], y: sim.poses[o + 1], a: sim.poses[o + 2] };
  };
  assert.ok(quadros < 1500, "a pilha nao assentou");

  // Ultimo quadro: dentro das paredes e do chao, sem interpenetracao relevante, tela cheia.
  const mundo = [];
  for (let i = 0; i < total; i++) {
    const { x, y, a } = pose(quadros - 1, i);
    const co = Math.cos(a), si = Math.sin(a);
    for (const [lx, ly, r] of circulos) mundo.push({ i, r, x: x + co * lx - si * ly, y: y + si * lx + co * ly });
  }
  let pior = 0;
  for (const c of mundo) {
    assert.ok(c.x >= c.r - 1 && c.x <= LARGURA - c.r + 1, "fora das paredes");
    assert.ok(c.y <= ALTURA - c.r + 1, "abaixo do chao");
  }
  for (let i = 0; i < mundo.length; i++) for (let j = i + 1; j < mundo.length; j++) {
    if (mundo[i].i === mundo[j].i) continue;
    pior = Math.max(pior, mundo[i].r + mundo[j].r - Math.hypot(mundo[i].x - mundo[j].x, mundo[i].y - mundo[j].y));
  }
  assert.ok(pior < L * 0.06, `interpenetracao de ${pior.toFixed(1)} px`);
  // Toda a largura recebe pilha: em cada oitava parte da tela algum haltere passa de 70% da altura.
  for (let k = 0; k < 8; k++) {
    const altoDaFaixa = Math.min(...mundo.filter((c) => Math.floor((c.x / LARGURA) * 8) === k).map((c) => c.y - c.r));
    assert.ok(altoDaFaixa < ALTURA * 0.7, `faixa ${k}/8 vazia (topo em ${altoDaFaixa.toFixed(0)} px)`);
  }
  const topo = Math.min(...mundo.map((c) => c.y - c.r));
  assert.ok(topo >= -L && topo < ALTURA * 0.35, `tela nao encheu / haltere preso: topo em ${topo.toFixed(0)} px`);

  // Sem tremulidade: no fim (15 quadros quietos antes de todos dormirem) ninguem anda 0,8 px/quadro.
  let tremor = 0;
  for (let q = Math.max(1, quadros - 10); q < quadros; q++) {
    for (let i = 0; i < total; i++) {
      const a = pose(q - 1, i), b = pose(q, i);
      tremor = Math.max(tremor, Math.hypot(b.x - a.x, b.y - a.y), Math.abs(b.a - a.a) * L * 0.4);
    }
  }
  assert.ok(tremor < 0.85, `ainda treme no fim: ${tremor.toFixed(2)} px/quadro`);

  // Ninguem e arremessado: velocidade maxima razoavel (< L por quadro) e tudo entra de cima.
  let rapido = 0;
  for (let i = 0; i < total; i++) {
    assert.ok(pose(inicio[i], i).y < 0, "haltere nasceu dentro da tela");
    for (let q = inicio[i] + 1; q < quadros; q++) {
      const a = pose(q - 1, i), b = pose(q, i);
      rapido = Math.max(rapido, Math.hypot(b.x - a.x, b.y - a.y));
    }
  }
  assert.ok(rapido < L * 0.5, `haltere arremessado: ${rapido.toFixed(0)} px/quadro`);

  // Leitura: u=0 nada entrou, u=1 e o ultimo quadro, e a interpolacao fica entre os vizinhos.
  const s = { x: 0, y: 0, a: 0 };
  assert.equal(poseDe(sim, total - 1, 0, s), false);
  assert.ok(poseDe(sim, 0, 1, s));
  assert.deepEqual([s.x, s.y], [pose(quadros - 1, 0).x, pose(quadros - 1, 0).y]);

  if (LARGURA !== 1280 || PRESET !== 0) {
    console.log(`${LARGURA}x${ALTURA} preset ${PRESET}: ${total} halteres, ${quadros} quadros, ${ms.toFixed(0)} ms, interpenetracao ${pior.toFixed(1)} px, topo ${topo.toFixed(0)} px, tremor ${tremor.toFixed(2)}, vel.max ${rapido.toFixed(0)} px/q`);
    continue;
  }
  // Deterministica por semente; outra semente muda o ragdoll, nao a entrada (cores e ordem).
  assert.deepEqual(assar(LARGURA, ALTURA, 1234, PRESET).poses, sim.poses);
  const outra = assar(LARGURA, ALTURA, 777, PRESET);
  assert.deepEqual(outra.cores, sim.cores, "a entrada mudou entre quedas");
  assert.notDeepEqual(outra.poses, sim.poses, "o ragdoll nao variou");
  const final = (q, o) => Array.from({ length: total }, (_, i) => o.poses[((q - 1) * total + i) * 3]);
  const iguais = final(sim.quadros, sim).filter((x, i) => Math.abs(x - final(outra.quadros, outra)[i]) < 1).length;
  assert.ok(iguais < total * 0.5, "a pilha final quase nao variou");
  console.log(`${LARGURA}x${ALTURA} preset ${PRESET}: ${total} halteres, ${quadros} quadros, ${ms.toFixed(0)} ms, interpenetracao ${pior.toFixed(1)} px, topo ${topo.toFixed(0)} px, tremor ${tremor.toFixed(2)}, vel.max ${rapido.toFixed(0)} px/q`);
}
// Presets diferentes entram de forma diferente (as primeiras poses gravadas nao coincidem).
const chaves = new Set(finais.map((f) => Array.from(f).map((v) => v.toFixed(1)).join()));
assert.equal(chaves.size, quantidadeDePresets, "dois presets geraram a mesma queda");
console.log("ok");
