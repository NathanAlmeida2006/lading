import { useEffect, useRef } from "react";
import { isMotionReduced } from "../../sensory/tokens.js";

// Vem do app-lithium (src/componentes/Modelo3D.jsx): o leitor de `.glb` em arestas e o desenho em canvas 2D,
// sem Three.js. Aqui sem arrasto e sem fundo: o video so precisa do objeto girando, e a pose inicial e a
// mesma em todo corte (o tempo conta de `origin`), que e o que faz o corte casar.
const FOV = 35 * Math.PI / 180;

/**
 * As arestas de um `.glb`, em coordenadas do mundo: percorre os nós com suas matrizes e lê só as
 * primitivas de linha (modo 1). Devolve os vértices em pares, o centro e o raio da esfera do modelo.
 * ponytail: sem Three.js (172 KB gzip estourava o teto de JS); só lê o que estes modelos usam
 * (matriz por nó, posições float32 em linhas). Modelo com malha rala ou compressão Draco pede o Three de volta.
 * @param {string} url - Endereço do .glb.
 * @returns {Promise<{segments: Float64Array, radius: number}>} Arestas e raio da esfera do modelo.
 */
const models = new Map();
function getGlbEdges(url) {
  if (!models.has(url)) models.set(url, decodeGlb(url).catch((error) => { models.delete(url); throw error; }));
  return models.get(url);
}
const getModelUrl = (model) => `/models-3d/${model}-low-poly.glb`;
/**
 * Baixa e le o modelo antes de ele ser usado: o primeiro quadro do corte ja o tem.
 * @param {string} model - Nome do modelo em public/models-3d.
 * @returns {Promise<object>} O modelo lido, pronto para uso.
 */
export const prepareModel = (model) => getGlbEdges(getModelUrl(model));
async function decodeGlb(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Modelo indisponível.");
  const bin = await response.arrayBuffer();
  const dataView = new DataView(bin);
  const jsonSize = dataView.getUint32(12, true);
  const json = JSON.parse(new TextDecoder().decode(new Uint8Array(bin, 20, jsonSize)));
  const data = 20 + jsonSize + 8; // cabeçalho do glb, o pedaço JSON e o cabeçalho do pedaço BIN
  const segments = [];

  const read = (index) => {
    const accessor = json.accessors[index], view = json.bufferViews[accessor.bufferView];
    const start = data + (view.byteOffset || 0) + (accessor.byteOffset || 0);
    return new Float32Array(bin.slice(start, start + accessor.count * 12));
  };
  const multiply = (a, b) => { // colunas, como no glTF
    const r = new Array(16).fill(0);
    for (let c = 0; c < 4; c++) for (let l = 0; l < 4; l++) for (let k = 0; k < 4; k++) r[c * 4 + l] += a[k * 4 + l] * b[c * 4 + k];
    return r;
  };
  const visit = (index, parent) => {
    const node = json.nodes[index];
    const matrix = multiply(parent, node.matrix || [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    if (node.mesh != null) {
      for (const primitive of json.meshes[node.mesh].primitives) {
        if (primitive.mode !== 1) continue;
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
    (node.children || []).forEach((child) => visit(child, matrix));
  };
  const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  json.scenes[json.scene || 0].nodes.forEach((n) => visit(n, identity));

  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < segments.length; i++) { const e = i % 3; min[e] = Math.min(min[e], segments[i]); max[e] = Math.max(max[e], segments[i]); }
  const center = min.map((v, e) => (v + max[e]) / 2);
  for (let i = 0; i < segments.length; i++) segments[i] -= center[i % 3];
  return { segments: new Float64Array(segments), radius: Math.hypot(max[0] - min[0], max[1] - min[1], max[2] - min[2]) / 2 };
}

/**
 * Um modelo `.glb` de `public/models-3d`, so em arestas, girando e flutuando num canvas que preenche o pai (o `className` o posiciona e o dimensiona).
 * `color` e a do traco. `origin` (ms, relogio de `performance.now()`) e de onde o giro conta; `pose(t)` (t em s, devolve os angulos [x, y, z]) troca o giro e `shouldFloat` false tira o balanco; O modelo aparece de uma vez, quando chega. Sob movimento reduzido, fica parado.
 * @param {object} props
 * @param {string} props.model - Nome do modelo em public/models-3d.
 * @param {string} props.color - Cor do traço.
 * @param {string} [props.className=""] - Classes que posicionam e dimensionam o canvas.
 * @param {number} [props.origin] - Hora (performance.now) de onde o giro conta.
 * @param {(t: number) => number[]} [props.pose] - Troca o giro: recebe t em segundos e devolve [x, y, z].
 * @param {boolean} [props.shouldFloat=true] - Liga o balanço do objeto.
 * @returns {JSX.Element} Um div que recebe o canvas.
 */
export function Model3D({ model, color, className = "", origin, pose, shouldFloat = true }) {
  const stageRef = useRef(null);
  const stateRef = useRef({ model: null, color: null, request: null }); // o modelo e a cor que o laco desenha, e `request`, que acorda o laco

  // O canvas e o laco vivem enquanto o componente vive: trocar o modelo ou a cor nao os recria (o antigo segue desenhado ate o novo chegar).
  useEffect(() => {
    const node = stageRef.current, state = stateRef.current;
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "display:block;width:100%;height:100%";
    node.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    const reduced = isMotionReduced();
    let frame = 0, alive = true, canvasWidth = 0, canvasHeight = 0, dpr = 1;
    const start = origin ?? performance.now(); // o giro conta desde `origin`: cortes seguidos continuam o mesmo giro

    const adjust = () => {
      dpr = Math.min(devicePixelRatio, 2);
      canvasWidth = node.clientWidth; canvasHeight = node.clientHeight;
      canvas.width = canvasWidth * dpr; canvas.height = canvasHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    adjust();
    const observer = new ResizeObserver(() => { adjust(); if (reduced) draw(start); });
    observer.observe(node);

    function draw(now) {
      frame = 0;
      if (!alive) return;
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      const { model } = state;
      if (model && canvasWidth && canvasHeight) {
        const t = reduced ? 0 : (now - start) / 1000, { segments, radius } = model;
        const [ax, ay, az] = pose ? pose(t) : [Math.sin(t * 0.35) * 0.5 + 0.3, t * 0.25 + 0.6, Math.cos(t * 0.27) * 0.4];
        const dx = shouldFloat ? Math.sin(t * 0.4) * radius * 0.1 : 0, dy = shouldFloat ? Math.sin(t * 0.7) * radius * 0.15 : 0;
        const sx = Math.sin(ax), cx = Math.cos(ax), sy = Math.sin(ay), cy = Math.cos(ay), sz = Math.sin(az), cz = Math.cos(az);
        const half = Math.min(FOV, 2 * Math.atan(Math.tan(FOV / 2) * canvasWidth / canvasHeight)) / 2;
        const distance = (radius * 1.05) / Math.sin(half), focal = canvasHeight / 2 / Math.tan(FOV / 2);
        // A rotacao por vertice: os produtos que nao dependem do vertice saem do laco (mesma ordem de contas, mesmos numeros).
        const a0 = cy * cz, a1 = cy * sz, a2 = sy;
        const b0 = cx * sz + sx * sy * cz, b1 = cx * cz - sx * sy * sz, b2 = sx * cy;
        const c0 = sx * sz - cx * sy * cz, c1 = sx * cz + cx * sy * sz, c2 = cx * cy;
        const mx = canvasWidth / 2, my = canvasHeight / 2;
        ctx.strokeStyle = state.color;
        ctx.lineWidth = 1 / dpr; // um pixel do aparelho, como no app
        ctx.beginPath();
        for (let i = 0; i < segments.length; i += 6) {
          const x = segments[i], y = segments[i + 1], z = segments[i + 2];
          const depth = distance - (c0 * x + c1 * y + c2 * z);
          ctx.moveTo(mx + (((a0 * x - a1 * y + a2 * z) + dx) * focal) / depth, my - (((b0 * x + b1 * y - b2 * z) + dy) * focal) / depth);
          const u = segments[i + 3], v = segments[i + 4], w = segments[i + 5];
          const depth2 = distance - (c0 * u + c1 * v + c2 * w);
          ctx.lineTo(mx + (((a0 * u - a1 * v + a2 * w) + dx) * focal) / depth2, my - (((b0 * u + b1 * v - b2 * w) + dy) * focal) / depth2);
        }
        ctx.stroke();
      }
      if (!reduced) frame = requestAnimationFrame(draw);
    }

    // Com o laco girando, o modelo novo entra no proximo quadro; parado (movimento reduzido ou antes do 1o modelo), pede um desenho so.
    state.request = () => { if (!frame) frame = requestAnimationFrame(draw); };

    return () => {
      alive = false; state.request = null; cancelAnimationFrame(frame); observer.disconnect(); canvas.remove();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- intencional: shouldFloat, origin e pose sao lidos uma vez na montagem; o laco e o canvas vivem enquanto o componente vive e rodar de novo os recriaria; a troca de modelo e cor tem o efeito seguinte

  useEffect(() => {
    const state = stateRef.current;
    let current = true; // uma promessa antiga que resolve depois da troca nao sobrescreve o modelo novo
    getGlbEdges(getModelUrl(model)).then((m) => {
      if (!current) return;
      state.model = m; state.color = color;
      state.request?.();
    }).catch(() => {
      // Sem o modelo, fica so o fundo: a capa nao pode herdar o objeto da anterior.
      if (!current) return;
      state.model = null;
      state.request?.();
    });
    return () => { current = false; };
  }, [model, color]);

  return <div className={className} ref={stageRef} aria-hidden="true" />;
}
