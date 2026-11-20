/**
 * Leitor de `.glb` em arestas, sem Three.js (172 KB gzip estourava o teto de JS): percorre os nós com suas matrizes e lê só as
 * primitivas de linha (modo 1). Devolve os vértices em pares, centrados na origem, e o raio da esfera do modelo.
 *
 * Só lê o que os modelos de public/models-3d usam: posições float32 VEC3 coladas (sem `byteStride`), sem índices, e a matriz
 * por nó (`matrix`). O que for diferente NAO e desenhado torto: o leitor lança um `Error` com o motivo, e quem o chama
 * (Model3D.jsx) deixa o quadro sem o objeto. Modelo exportado com índices, TRS, malha entrelaçada ou compressão Draco pede o Three de volta.
 * @param {ArrayBuffer} bin - Os bytes do arquivo `.glb`.
 * @returns {{segments: Float64Array, radius: number}} Arestas (pares de vértices, x y z) e raio da esfera do modelo.
 * @throws {Error} Quando não é glTF binário 2.0, ou usa algo que este leitor não suporta, ou o arquivo está truncado.
 */
export function parseGlbEdges(bin) {
  if (bin.byteLength < 28) throw new Error("GLB: arquivo curto demais");
  const dataView = new DataView(bin);
  if (dataView.getUint32(0, true) !== 0x46546c67 || dataView.getUint32(4, true) !== 2) throw new Error("GLB: nao e glTF binario 2.0");
  const jsonSize = dataView.getUint32(12, true);
  const data = 20 + jsonSize + 8; // cabeçalho do glb, o pedaço JSON e o cabeçalho do pedaço BIN
  if (dataView.getUint32(16, true) !== 0x4e4f534a || data > bin.byteLength) throw new Error("GLB: pedaco JSON invalido");
  const json = JSON.parse(new TextDecoder().decode(new Uint8Array(bin, 20, jsonSize)));
  const segments = [];

  const read = (index) => {
    const accessor = json.accessors[index], view = json.bufferViews[accessor.bufferView];
    if (accessor.componentType !== 5126 || accessor.type !== "VEC3" || accessor.sparse) throw new Error("GLB: posicao precisa ser VEC3 float, sem sparse");
    if (view.byteStride && view.byteStride !== 12) throw new Error(`GLB: byteStride ${view.byteStride} nao suportado`);
    const start = data + (view.byteOffset || 0) + (accessor.byteOffset || 0);
    if (!(accessor.count % 2 === 0 && start + accessor.count * 12 <= bin.byteLength)) throw new Error("GLB: acessor de linhas truncado ou com vertices impares");
    return new Float32Array(bin.slice(start, start + accessor.count * 12));
  };
  const multiply = (a, b) => { // colunas, como no glTF
    const r = new Array(16).fill(0);
    for (let c = 0; c < 4; c++) for (let l = 0; l < 4; l++) for (let k = 0; k < 4; k++) r[c * 4 + l] += a[k * 4 + l] * b[c * 4 + k];
    return r;
  };
  const visit = (index, parent, depth) => {
    const node = json.nodes[index];
    if (depth > 64) throw new Error("GLB: hierarquia de nos profunda demais");
    if (node.translation || node.rotation || node.scale) throw new Error("GLB: no com translation/rotation/scale nao suportado (so `matrix`)");
    const matrix = multiply(parent, node.matrix || [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    if (node.mesh != null) {
      for (const primitive of json.meshes[node.mesh].primitives) {
        if (primitive.mode !== 1) continue;
        if (primitive.indices != null) throw new Error("GLB: primitiva de linha com indices nao suportada");
        const p = read(primitive.attributes.POSITION);
        for (let i = 0; i < p.length; i += 3) {
          const [x, y, z] = [p[i], p[i + 1], p[i + 2]];
          segments.push(
            matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12],
            matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13],
            matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14],
          );
        }
      }
    }
    (node.children || []).forEach((child) => visit(child, matrix, depth + 1));
  };
  const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  json.scenes[json.scene || 0].nodes.forEach((n) => visit(n, identity, 0));
  if (!segments.length) throw new Error("GLB: nenhuma primitiva de linha (modo 1) para desenhar");

  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < segments.length; i++) { const e = i % 3; min[e] = Math.min(min[e], segments[i]); max[e] = Math.max(max[e], segments[i]); }
  const center = min.map((v, e) => (v + max[e]) / 2);
  for (let i = 0; i < segments.length; i++) segments[i] -= center[i % 3];
  return { segments: new Float64Array(segments), radius: Math.hypot(max[0] - min[0], max[1] - min[1], max[2] - min[2]) / 2 };
}
