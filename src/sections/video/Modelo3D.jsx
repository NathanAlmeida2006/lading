import { useEffect, useRef } from "react";
import { semMovimento } from "../../motion/tokens.js";

// Vem do app-lithium (src/componentes/Modelo3D.jsx): o leitor de `.glb` em arestas e o desenho em canvas 2D,
// sem Three.js. Aqui sem arrasto e sem fundo: o video so precisa do objeto girando, e a pose inicial e a
// mesma em todo corte (o tempo conta de `origem`), que e o que faz o corte casar.
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
const urlDoModelo = (modelo) => `/3d-models/${modelo}-low-poly.glb`;
/** Baixa e le o modelo antes de ele ser usado: o primeiro quadro do corte ja o tem. */
export const preparar = (modelo) => arestasDoGlb(urlDoModelo(modelo));
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
  return { segmentos: new Float64Array(segmentos), raio: Math.hypot(max[0] - min[0], max[1] - min[1], max[2] - min[2]) / 2 };
}

/**
 * Um modelo `.glb` de `public/3d-models`, so em arestas, girando e flutuando num canvas que preenche o pai (o `className` o posiciona e o dimensiona).
 * `cor` e a do traco. `origem` (ms, relogio de `performance.now()`) e de onde o giro conta; `pose(t)` (t em s, devolve os angulos [x, y, z]) troca o giro e `flutua` false tira o balanco; O modelo aparece de uma vez, quando chega. Sob movimento reduzido, fica parado.
 */
export function Modelo3D({ modelo, cor, className = "", origem, pose, flutua = true }) {
  const palco = useRef(null);
  const estado = useRef({ modelo: null, cor: null, pedir: null }); // o modelo e a cor que o laco desenha, e `pedir`, que acorda o laco

  // O canvas e o laco vivem enquanto o componente vive: trocar o modelo ou a cor nao os recria (o antigo segue desenhado ate o novo chegar).
  useEffect(() => {
    const no = palco.current, e = estado.current;
    const tela = document.createElement("canvas");
    tela.style.cssText = "display:block;width:100%;height:100%";
    no.appendChild(tela);
    const ctx = tela.getContext("2d");
    const reduzido = semMovimento();
    let quadro = 0, vivo = true, largura = 0, altura = 0, dpr = 1;
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
      const { modelo } = e;
      if (modelo && largura && altura) {
        const t = reduzido ? 0 : (agora - inicio) / 1000, { segmentos, raio } = modelo;
        const [ax, ay, az] = pose ? pose(t) : [Math.sin(t * 0.35) * 0.5 + 0.3, t * 0.25 + 0.6, Math.cos(t * 0.27) * 0.4];
        const dx = flutua ? Math.sin(t * 0.4) * raio * 0.1 : 0, dy = flutua ? Math.sin(t * 0.7) * raio * 0.15 : 0;
        const sx = Math.sin(ax), cx = Math.cos(ax), sy = Math.sin(ay), cy = Math.cos(ay), sz = Math.sin(az), cz = Math.cos(az);
        const meio = Math.min(FOV, 2 * Math.atan(Math.tan(FOV / 2) * largura / altura)) / 2;
        const distancia = (raio * 1.05) / Math.sin(meio), foco = altura / 2 / Math.tan(FOV / 2);
        // A rotacao por vertice: os produtos que nao dependem do vertice saem do laco (mesma ordem de contas, mesmos numeros).
        const a0 = cy * cz, a1 = cy * sz, a2 = sy;
        const b0 = cx * sz + sx * sy * cz, b1 = cx * cz - sx * sy * sz, b2 = sx * cy;
        const c0 = sx * sz - cx * sy * cz, c1 = sx * cz + cx * sy * sz, c2 = cx * cy;
        const mx = largura / 2, my = altura / 2;
        ctx.strokeStyle = e.cor;
        ctx.lineWidth = 1 / dpr; // um pixel do aparelho, como no app
        ctx.beginPath();
        for (let i = 0; i < segmentos.length; i += 6) {
          const x = segmentos[i], y = segmentos[i + 1], z = segmentos[i + 2];
          const prof = distancia - (c0 * x + c1 * y + c2 * z);
          ctx.moveTo(mx + (((a0 * x - a1 * y + a2 * z) + dx) * foco) / prof, my - (((b0 * x + b1 * y - b2 * z) + dy) * foco) / prof);
          const u = segmentos[i + 3], v = segmentos[i + 4], w = segmentos[i + 5];
          const prof2 = distancia - (c0 * u + c1 * v + c2 * w);
          ctx.lineTo(mx + (((a0 * u - a1 * v + a2 * w) + dx) * foco) / prof2, my - (((b0 * u + b1 * v - b2 * w) + dy) * foco) / prof2);
        }
        ctx.stroke();
      }
      if (!reduzido) quadro = requestAnimationFrame(desenhar);
    }

    // Com o laco girando, o modelo novo entra no proximo quadro; parado (movimento reduzido ou antes do 1o modelo), pede um desenho so.
    e.pedir = () => { if (!quadro) quadro = requestAnimationFrame(desenhar); };

    return () => {
      vivo = false; e.pedir = null; cancelAnimationFrame(quadro); observador.disconnect(); tela.remove();
    };
  }, []);

  useEffect(() => {
    const e = estado.current;
    let atual = true; // uma promessa antiga que resolve depois da troca nao sobrescreve o modelo novo
    arestasDoGlb(urlDoModelo(modelo)).then((m) => {
      if (!atual) return;
      e.modelo = m; e.cor = cor;
      e.pedir?.();
    }).catch(() => {
      // Sem o modelo, fica so o fundo: a capa nao pode herdar o objeto da anterior.
      if (!atual) return;
      e.modelo = null;
      e.pedir?.();
    });
    return () => { atual = false; };
  }, [modelo, cor]);

  return <div className={className} ref={palco} aria-hidden="true" />;
}
