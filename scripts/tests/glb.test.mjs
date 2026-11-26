// Leitor de .glb em arestas (src/sections/video/glb.js): os 12 modelos que o site entrega passam, e o que o leitor não
// suporta (indices, byteStride, TRS, arquivo truncado) lança um Error com o motivo, em vez de desenhar torto.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseGlbEdges } from "../../src/sections/video/glb.js";

const modelos = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "public", "models-3d");
const paraBuffer = (arquivo) => {
  const b = readFileSync(join(modelos, arquivo));
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
};

// Monta um GLB 2.0 mínimo: `json` e os bytes do pedaço BIN (padding de 4 em 4, como manda o formato).
function montar(json, floats = [0, 0, 0, 1, 0, 0]) {
  const text = new TextEncoder().encode(JSON.stringify(json));
  const jsonBytes = new Uint8Array(Math.ceil(text.length / 4) * 4).fill(0x20);
  jsonBytes.set(text);
  const binBytes = new Uint8Array(new Float32Array(floats).buffer);
  const total = 12 + 8 + jsonBytes.length + 8 + binBytes.length;
  const saida = new ArrayBuffer(total);
  const dv = new DataView(saida);
  const bytes = new Uint8Array(saida);
  dv.setUint32(0, 0x46546c67, true);
  dv.setUint32(4, 2, true);
  dv.setUint32(8, total, true);
  dv.setUint32(12, jsonBytes.length, true);
  dv.setUint32(16, 0x4e4f534a, true);
  bytes.set(jsonBytes, 20);
  const bin = 20 + jsonBytes.length;
  dv.setUint32(bin, binBytes.length, true);
  dv.setUint32(bin + 4, 0x004e4942, true);
  bytes.set(binBytes, bin + 8);
  return saida;
}
const base = (extra = {}) => ({
  asset: { version: "2.0" },
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes: [{ mesh: 0, ...extra.node }],
  meshes: [{ primitives: [{ mode: 1, attributes: { POSITION: 0 }, ...extra.primitive }] }],
  accessors: [{ bufferView: 0, componentType: 5126, count: 2, type: "VEC3", ...extra.accessor }],
  bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 24, ...extra.view }],
});

test("os 12 modelos de public/models-3d passam: arestas em pares, centradas, com raio finito", () => {
  const arquivos = readdirSync(modelos).filter((name) => name.endsWith(".glb"));
  assert.equal(arquivos.length, 12);
  for (const arquivo of arquivos) {
    const { segments, radius } = parseGlbEdges(paraBuffer(arquivo));
    assert.ok(segments.length > 0 && segments.length % 6 === 0, `${arquivo}: arestas em pares`);
    assert.ok(Number.isFinite(radius) && radius > 0, `${arquivo}: raio`);
    assert.ok(segments.every(Number.isFinite), `${arquivo}: sem NaN`);
  }
});

test("modelo minimo: uma aresta de (0,0,0) a (1,0,0) sai centrada, com raio 0,5", () => {
  const { segments, radius } = parseGlbEdges(montar(base()));
  assert.deepEqual([...segments], [-0.5, 0, 0, 0.5, 0, 0]);
  assert.equal(radius, 0.5);
});

test("recusa, com o motivo, o que nao suporta", () => {
  const casos = [
    ["arquivo que nao e glb", new Uint8Array(40).buffer, /glTF binario 2\.0/],
    ["arquivo curto", new ArrayBuffer(8), /curto demais/],
    ["linha com indices", montar(base({ primitive: { indices: 1 } })), /indices/],
    ["byteStride de 16", montar(base({ view: { byteStride: 16 } })), /byteStride 16/],
    [
      "no com translation",
      montar(base({ node: { translation: [0, 1, 0] } })),
      /translation\/rotation\/scale/,
    ],
    ["posicao que nao e float", montar(base({ accessor: { componentType: 5123 } })), /VEC3 float/],
    ["acessor maior que o arquivo", montar(base({ accessor: { count: 100 } })), /truncado/],
    ["numero impar de vertices", montar(base({ accessor: { count: 1 } })), /impares/],
    [
      "sem nenhuma primitiva de linha",
      montar(base({ primitive: { mode: 4 } })),
      /nenhuma primitiva de linha/,
    ],
  ];
  for (const [name, entrada, motivo] of casos)
    assert.throws(() => parseGlbEdges(entrada), motivo, name);
});

test("byteStride igual a 12 (posicao colada) continua valendo", () => {
  assert.doesNotThrow(() => parseGlbEdges(montar(base({ view: { byteStride: 12 } }))));
});
