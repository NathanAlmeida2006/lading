import { useEffect, useRef } from "react";
import { isMotionReduced } from "../../sensory/tokens.js";
import { parseGlbEdges } from "./glb.js";

// Vem do app-lithium (src/componentes/Modelo3D.jsx): o leitor de `.glb` em arestas e o desenho em canvas 2D,
// sem Three.js. Aqui sem arrasto e sem fundo: o vídeo só precisa do objeto girando, e a pose inicial e a
// mesma em todo corte (o tempo conta de `origin`), que é o que faz o corte casar.
const FOV = (35 * Math.PI) / 180;

/**
 * Baixa e lê as arestas de um `.glb` (a leitura é de glb.js). Sem a rede ou com um arquivo que o leitor não suporta,
 * a promessa rejeita: quem usa deixa o quadro sem o objeto, e a página segue.
 * @param {string} url - Endereço do .glb.
 * @returns {Promise<{segments: Float64Array, radius: number}>} Arestas e raio da esfera do modelo.
 */
const models = new Map();
function getGlbEdges(url) {
  if (!models.has(url))
    models.set(
      url,
      decodeGlb(url).catch((error) => {
        models.delete(url);
        throw error;
      }),
    );
  return models.get(url);
}
const getModelUrl = (model) => `/models-3d/${model}-low-poly.glb`;
/**
 * Baixa e lê o modelo antes de ele ser usado: o primeiro quadro do corte já o tem.
 * @param {string} model - Nome do modelo em public/models-3d.
 * @returns {Promise<object>} O modelo lido, pronto para uso.
 */
export const prepareModel = (model) => getGlbEdges(getModelUrl(model));
async function decodeGlb(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Modelo indisponível.");
  return parseGlbEdges(await response.arrayBuffer());
}
const warned = new Set(); // um aviso por modelo: o motivo de não desenhar vai ao console, sem repetir a cada montagem
const warnOnce = (model, error) => {
  if (!warned.has(model)) {
    warned.add(model);
    console.warn(`Model3D: "${model}" nao foi desenhado: ${error.message}`);
  }
};

/**
 * Um modelo `.glb` de `public/models-3d`, só em arestas, girando e flutuando num canvas que preenche o pai (o `className` o posiciona e o dimensiona).
 * `color` é a do traço. `origin` (ms, relógio de `performance.now()`) é de onde o giro conta; `pose(t)` (t em s, devolve os ângulos [x, y, z]) troca o giro e `shouldFloat` false tira o balanço; O modelo aparece de uma vez, quando chega. Sob movimento reduzido, fica parado.
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
  const stateRef = useRef({ model: null, color: null, request: null }); // o modelo e a cor que o laço desenha, e `request`, que acorda o laço

  // O canvas e o laço vivem enquanto o componente vive: trocar o modelo ou a cor não os recria (o antigo segue desenhado até o novo chegar).
  useEffect(() => {
    const node = stageRef.current;
    const state = stateRef.current;
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "display:block;width:100%;height:100%";
    node.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      canvas.remove();
      return;
    } // sem contexto 2D (memória do aparelho esgotada): fica só o fundo, a capa não quebra
    const reduced = isMotionReduced();
    let frame = 0;
    let alive = true;
    let canvasWidth = 0;
    let canvasHeight = 0;
    let dpr = 1;
    const start = origin ?? performance.now(); // o giro conta desde `origin`: cortes seguidos continuam o mesmo giro

    const adjust = () => {
      dpr = Math.min(devicePixelRatio, 2);
      canvasWidth = node.clientWidth;
      canvasHeight = node.clientHeight;
      canvas.width = canvasWidth * dpr;
      canvas.height = canvasHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    adjust();
    const observer = new ResizeObserver(() => {
      adjust();
      if (reduced) draw(start);
    });
    observer.observe(node);

    function draw(now) {
      frame = 0;
      if (!alive) return;
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      const { model } = state;
      if (model && canvasWidth && canvasHeight) {
        const t = reduced ? 0 : (now - start) / 1000;
        const { segments, radius } = model;
        const [ax, ay, az] = pose
          ? pose(t)
          : [Math.sin(t * 0.35) * 0.5 + 0.3, t * 0.25 + 0.6, Math.cos(t * 0.27) * 0.4];
        const dx = shouldFloat ? Math.sin(t * 0.4) * radius * 0.1 : 0;
        const dy = shouldFloat ? Math.sin(t * 0.7) * radius * 0.15 : 0;
        const sx = Math.sin(ax);
        const cx = Math.cos(ax);
        const sy = Math.sin(ay);
        const cy = Math.cos(ay);
        const sz = Math.sin(az);
        const cz = Math.cos(az);
        const half =
          Math.min(FOV, 2 * Math.atan((Math.tan(FOV / 2) * canvasWidth) / canvasHeight)) / 2;
        const distance = (radius * 1.05) / Math.sin(half);
        const focal = canvasHeight / 2 / Math.tan(FOV / 2);
        // A rotação por vértice: os produtos que não dependem do vértice saem do laço (mesma ordem de contas, mesmos números).
        const a0 = cy * cz;
        const a1 = cy * sz;
        const a2 = sy;
        const b0 = cx * sz + sx * sy * cz;
        const b1 = cx * cz - sx * sy * sz;
        const b2 = sx * cy;
        const c0 = sx * sz - cx * sy * cz;
        const c1 = sx * cz + cx * sy * sz;
        const c2 = cx * cy;
        const mx = canvasWidth / 2;
        const my = canvasHeight / 2;
        ctx.strokeStyle = state.color;
        ctx.lineWidth = 1 / dpr; // um pixel do aparelho, como no app
        ctx.beginPath();
        for (let i = 0; i < segments.length; i += 6) {
          const x = segments[i];
          const y = segments[i + 1];
          const z = segments[i + 2];
          const depth = distance - (c0 * x + c1 * y + c2 * z);
          ctx.moveTo(
            mx + ((a0 * x - a1 * y + a2 * z + dx) * focal) / depth,
            my - ((b0 * x + b1 * y - b2 * z + dy) * focal) / depth,
          );
          const u = segments[i + 3];
          const v = segments[i + 4];
          const w = segments[i + 5];
          const depth2 = distance - (c0 * u + c1 * v + c2 * w);
          ctx.lineTo(
            mx + ((a0 * u - a1 * v + a2 * w + dx) * focal) / depth2,
            my - ((b0 * u + b1 * v - b2 * w + dy) * focal) / depth2,
          );
        }
        ctx.stroke();
      }
      if (!reduced) frame = requestAnimationFrame(draw);
    }

    // Com o laço girando, o modelo novo entra no próximo quadro; parado (movimento reduzido ou antes do 1o modelo), pede um desenho só.
    state.request = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };

    return () => {
      alive = false;
      state.request = null;
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.remove();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- intencional: shouldFloat, origin e pose são lidos uma vez na montagem; o laço e o canvas vivem enquanto o componente vive e rodar de novo os recriaria; a troca de modelo e cor tem o efeito seguinte

  useEffect(() => {
    const state = stateRef.current;
    let current = true; // uma promessa antiga que resolve depois da troca não sobrescreve o modelo novo
    getGlbEdges(getModelUrl(model))
      .then((m) => {
        if (!current) return;
        state.model = m;
        state.color = color;
        state.request?.();
      })
      .catch((error) => {
        // Sem o modelo (rede, ou glb que o leitor não suporta), fica só o fundo: a capa não pode herdar o objeto da anterior.
        if (!current) return;
        warnOnce(model, error);
        state.model = null;
        state.request?.();
      });
    return () => {
      current = false;
    };
  }, [model, color]);

  return <div className={className} ref={stageRef} aria-hidden="true" />;
}
