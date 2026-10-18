import { useEffect, useRef } from "react";

// Vem do app-lithium (src/componentes/Modelo3D.jsx): o leitor de `.glb` em arestas e o desenho em canvas 2D,
// sem Three.js. Aqui sem arrasto e sem fundo: o video so precisa do objeto girando, e a pose inicial e a
// mesma em todo corte (o tempo conta desde que o componente monta), que e o que faz o corte casar.
const FOV = 35 * Math.PI / 180;

/**
 * As arestas de um `.glb`, em coordenadas do mundo: percorre os nós com suas matrizes e lê só as
 * primitivas de linha (modo 1). Devolve os vértices em pares, o centro e o raio da esfera do modelo.
 * ponytail: sem Three.js (172 KB gzip estourava o teto de JS); só lê o que estes modelos usam
 * (matriz por nó, posições float32 em linhas). Modelo com malha rala ou compressão Draco pede o Three de volta.
 */
const modelos = new Map();
function arestasDoGlb(url) {
  if (!modelos.has(url)) modelos.set(url, decodificarGlb(url).catch((erro) => { modelos.delete(url); throw erro; }));
  return modelos.get(url);
}
/** Baixa e le o modelo antes de ele ser usado: o primeiro quadro do corte ja o tem. */
export const preparar = (url) => arestasDoGlb(url);
async function decodificarGlb(url) {
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error("Modelo indisponível.");
  const bin = await resposta.arrayBuffer();
  const vista = new DataView(bin);
  const tamJson = vista.getUint32(12, true);
  const json = JSON.parse(new TextDecoder().decode(new Uint8Array(bin, 20, tamJson)));
  const dados = 20 + tamJson + 8; // cabeçalho do glb, o pedaço JSON e o cabeçalho do pedaço BIN
  const segmentos = [];

  const ler = (indice) => {
    const acesso = json.accessors[indice], visao = json.bufferViews[acesso.bufferView];
    const inicio = dados + (visao.byteOffset || 0) + (acesso.byteOffset || 0);
    return new Float32Array(bin.slice(inicio, inicio + acesso.count * 12));
  };
  const multiplicar = (a, b) => { // colunas, como no glTF
    const r = new Array(16).fill(0);
    for (let c = 0; c < 4; c++) for (let l = 0; l < 4; l++) for (let k = 0; k < 4; k++) r[c * 4 + l] += a[k * 4 + l] * b[c * 4 + k];
    return r;
  };
  const visitar = (indice, pai) => {
    const no = json.nodes[indice];
    const matriz = multiplicar(pai, no.matrix || [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    if (no.mesh != null) {
      for (const primitiva of json.meshes[no.mesh].primitives) {
        if (primitiva.mode !== 1) continue;
        const p = ler(primitiva.attributes.POSITION);
        for (let i = 0; i < p.length; i += 3) {
          const [x, y, z] = [p[i], p[i + 1], p[i + 2]];
          segmentos.push(
            matriz[0] * x + matriz[4] * y + matriz[8] * z + matriz[12],
            matriz[1] * x + matriz[5] * y + matriz[9] * z + matriz[13],
            matriz[2] * x + matriz[6] * y + matriz[10] * z + matriz[14],
          );
        }
      }
    }
    (no.children || []).forEach((filho) => visitar(filho, matriz));
  };
  const identidade = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  json.scenes[json.scene || 0].nodes.forEach((n) => visitar(n, identidade));

  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < segmentos.length; i++) { const e = i % 3; min[e] = Math.min(min[e], segmentos[i]); max[e] = Math.max(max[e], segmentos[i]); }
  const centro = min.map((v, e) => (v + max[e]) / 2);
  for (let i = 0; i < segmentos.length; i++) segmentos[i] -= centro[i % 3];
  return { segmentos, raio: Math.hypot(max[0] - min[0], max[1] - min[1], max[2] - min[2]) / 2 };
}

/**
 * Um modelo `.glb` de `public/3d-models`, so em arestas, girando e flutuando num canvas que preenche o pai (o `className` o posiciona e o dimensiona).
 * `cor` e a do traco. `origem` (ms, relogio de `performance.now()`) e de onde o giro conta; `pose(t)` (t em s, devolve os angulos [x, y, z]) troca o giro e `flutua` false tira o balanco; O modelo aparece de uma vez, quando chega. Sob movimento reduzido, fica parado.
 */
export function Modelo3D({ arquivo, cor, className = "", origem, pose, flutua = true }) {
  const palco = useRef(null);

  useEffect(() => {
    const no = palco.current;
    const tela = document.createElement("canvas");
    tela.style.cssText = "display:block;width:100%;height:100%";
    no.appendChild(tela);
    const ctx = tela.getContext("2d");
    const reduzido = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let modelo = null, quadro = 0, vivo = true, largura = 0, altura = 0, dpr = 1;
    const inicio = origem ?? performance.now(); // o giro conta desde `origem`: cortes seguidos continuam o mesmo giro

    const ajustar = () => {
      dpr = Math.min(devicePixelRatio, 2);
      largura = no.clientWidth; altura = no.clientHeight;
      tela.width = largura * dpr; tela.height = altura * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    ajustar();
    const observador = new ResizeObserver(() => { ajustar(); if (reduzido) desenhar(inicio); });
    observador.observe(no);

    function desenhar(agora) {
      quadro = 0;
      if (!vivo) return;
      ctx.clearRect(0, 0, largura, altura);
      if (modelo && largura && altura) {
        const t = reduzido ? 0 : (agora - inicio) / 1000, { segmentos, raio } = modelo;
        const [ax, ay, az] = pose ? pose(t) : [Math.sin(t * 0.35) * 0.5 + 0.3, t * 0.25 + 0.6, Math.cos(t * 0.27) * 0.4];
        const dx = flutua ? Math.sin(t * 0.4) * raio * 0.1 : 0, dy = flutua ? Math.sin(t * 0.7) * raio * 0.15 : 0;
        const [sx, cx, sy, cy, sz, cz] = [Math.sin(ax), Math.cos(ax), Math.sin(ay), Math.cos(ay), Math.sin(az), Math.cos(az)];
        const meio = Math.min(FOV, 2 * Math.atan(Math.tan(FOV / 2) * largura / altura)) / 2;
        const distancia = (raio * 1.05) / Math.sin(meio), foco = altura / 2 / Math.tan(FOV / 2);
        ctx.strokeStyle = cor;
        ctx.lineWidth = 1 / dpr; // um pixel do aparelho, como no app
        ctx.beginPath();
        for (let i = 0; i < segmentos.length; i += 6) {
          const pontos = [0, 3].map((k) => {
            const [x, y, z] = [segmentos[i + k], segmentos[i + k + 1], segmentos[i + k + 2]];
            const [x1, y1, z1] = [cy * cz * x - cy * sz * y + sy * z, (cx * sz + sx * sy * cz) * x + (cx * cz - sx * sy * sz) * y - sx * cy * z, (sx * sz - cx * sy * cz) * x + (sx * cz + cx * sy * sz) * y + cx * cy * z];
            const prof = distancia - z1;
            return [largura / 2 + ((x1 + dx) * foco) / prof, altura / 2 - ((y1 + dy) * foco) / prof];
          });
          ctx.moveTo(...pontos[0]);
          ctx.lineTo(...pontos[1]);
        }
        ctx.stroke();
      }
      if (!reduzido) quadro = requestAnimationFrame(desenhar);
    }

    arestasDoGlb(arquivo).then((m) => {
      if (!vivo) return;
      modelo = m;
      quadro = requestAnimationFrame(desenhar);
    }).catch(() => { /* sem o modelo, fica so o fundo */ });

    return () => {
      vivo = false; cancelAnimationFrame(quadro); observador.disconnect(); tela.remove();
    };
  }, [arquivo, cor]);

  return <div className={className} ref={palco} aria-hidden="true" />;
}
