import { useRef } from "react";
import { useMotion } from "../../sensory/index.js";
import { isMotionReduced, isTouchPointer } from "../../sensory/tokens.js";
import { subscribeToPause, isPaused } from "../../sensory/pause.js";
import { TOUCH_FRAME_STEP_MS } from "../../sensory/field.js";

const VERTEX_SOURCE = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";

/**
 * Versao em codigo do gif de fluido: ruido distorcido por ele mesmo (domain warp), so as cristas
 * acendem, e o cinza sai em pontos de dither ordenado (Bayer 4x4, celula de 3 px). Cinza neutro,
 * sem cor: o acento nao entra. O tempo anda num circulo, entao o ciclo de 12 s fecha sem corte.
 */
// highp, nao mediump: nos GPUs de celular mediump e de 16 bits, e o hash `fract(sin(..)*43758.5453)` vira 0 em todo pixel
// (o ruido some, nenhuma crista acende e o fundo fica invisivel). No desktop mediump e 32 bits, por isso so aparecia no deploy mobile.
const FRAGMENT_SOURCE = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 r;uniform float t;uniform vec3 c3;
float h(vec2 i){return fract(sin(dot(i,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 x){vec2 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 x){float a=.5,s=0.;for(int k=0;k<4;k++){s+=a*n(x);x=x*2.03+vec2(7.3,1.7);a*=.5;}return s;}
void main(){
  vec2 u=gl_FragCoord.xy/r.y*3.2;
  vec2 c=vec2(cos(t),sin(t));
  vec2 q=vec2(fbm(u+c*.9),fbm(u+vec2(5.2,1.3)-c.yx*.9));
  float f=fbm(u+2.4*q+c*.5);
  float v=pow(1.-abs(2.*f-1.),28.);
  vec2 g=floor(gl_FragCoord.xy/3.);
  float b=(mod(g.x,2.)*2.+mod(g.y,2.)*3.)/4.; // ordem de Bayer 2x2 expandida em 4 niveis
  b=fract(b+mod(floor(g.x/2.)+floor(g.y/2.)*2.,4.)/16.);
  float on=step(b,v*1.5)*step(.03,v);
  gl_FragColor=vec4(c3*on,on); // premultiplicado: fora das cristas o canvas e transparente
}`;

// Item perdido sai do pool; restaurado recria o programa (`montar`); desmontar perdido descarta.
// Pool de no maximo um contexto pronto: criar custa ~200 ms de thread, entao o aquecimento o cria antes
// do corte e quem desmonta devolve. Manifesto e Faca nunca estao na tela juntos, por isso um basta.
const pool = [];
// Compila e liga o programa no contexto dado. Qualquer falha perde o contexto e devolve null.
/**
 * @param {WebGLRenderingContext} gl - Contexto ja criado.
 * @returns {{uniformR: WebGLUniformLocation, uniformT: WebGLUniformLocation}|null} Os uniforms, ou nulo se o programa nao compilou.
 */
function mount(gl) {
  const compile = (type, source) => { const shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader); return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null; };
  const program = gl.createProgram();
  const vertexShader = compile(gl.VERTEX_SHADER, VERTEX_SOURCE);
  if (vertexShader) gl.attachShader(program, vertexShader);
  const fragmentShader = compile(gl.FRAGMENT_SHADER, FRAGMENT_SOURCE);
  if (fragmentShader) gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!vertexShader || !fragmentShader || !gl.getProgramParameter(program, gl.LINK_STATUS)) { gl.getExtension("WEBGL_lose_context")?.loseContext(); return null; }
  gl.useProgram(program);
  gl.uniform3f(gl.getUniformLocation(program, "c3"), 0.42, 0.42, 0.42);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const location = gl.getAttribLocation(program, "p");
  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
  return { uniformR: gl.getUniformLocation(program, "r"), uniformT: gl.getUniformLocation(program, "t") };
}
/**
 * @returns {object|null} O item do pool (canvas, contexto e uniforms), ou nulo sem WebGL.
 */
function create() {
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl", { antialias: false, alpha: true });
  if (!gl) return null;
  const uniforms = mount(gl);
  if (!uniforms) return null;
  const entry = { canvas, gl, ...uniforms, isLost: false, onRestore: null };
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault(); entry.isLost = true;
    const index = pool.indexOf(entry); if (index >= 0) pool.splice(index, 1);
  });
  canvas.addEventListener("webglcontextrestored", () => {
    Object.assign(entry, mount(gl) ?? {}); entry.isLost = false; entry.onRestore?.();
  });
  return entry;
}
/**
 * Cria o contexto WebGL antes da montagem, para a compilacao nao cair na tela.
 * @returns {void}
 */
export function warmUpFluid() {
  if (!pool.length) { const entry = create(); if (entry) pool.push(entry); }
}

// A pega do contexto so acontece quando a secao pai chega perto da tela, para a compilacao nao cair na montagem.
/**
 * @returns {JSX.Element} O host do canvas WebGL, ou so o noscript sem JavaScript.
 */
export function FluidBackground() {
  const host = useRef(null);

  useMotion(() => {
    const parent = host.current?.parentElement;
    if (!parent) return;
    let cleanup;
    const deferObserver = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      deferObserver.disconnect();
      cleanup = connect();
    }, { rootMargin: "100% 0px" });
    deferObserver.observe(parent);
    function connect() {
      const entry = pool.pop() ?? create();
      if (!entry) return;
      const { canvas, gl } = entry;
      canvas.className = "absolute inset-0 size-full pointer-events-none opacity-30 [image-rendering:pixelated]";
      canvas.setAttribute("aria-hidden", "true");
      host.current.append(canvas);
      const adjust = () => { canvas.width = Math.max(1, canvas.clientWidth); canvas.height = Math.max(1, canvas.clientHeight); gl.viewport(0, 0, canvas.width, canvas.height); };
      const draw = (ms) => { gl.uniform2f(entry.uniformR, canvas.width, canvas.height); gl.uniform1f(entry.uniformT, (ms / 12000) * Math.PI * 2); gl.drawArrays(gl.TRIANGLES, 0, 3); };
      let isVisible = false, rafId = 0, lastTime = -Infinity;
      const frameStep = isTouchPointer() ? TOUCH_FRAME_STEP_MS : 0;
      const loop = (ms) => { if (ms - lastTime >= frameStep) { lastTime = ms; draw(ms); } rafId = isVisible && !isPaused() ? requestAnimationFrame(loop) : 0; };
      const tryStart = () => { if (!rafId && isVisible && !isMotionReduced() && !isPaused()) rafId = requestAnimationFrame(loop); };
      adjust(); draw(0);
      const observer = new IntersectionObserver(([event]) => { isVisible = event.isIntersecting; tryStart(); });
      observer.observe(canvas);
      const resizeObserver = new ResizeObserver(() => { adjust(); draw(performance.now()); });
      resizeObserver.observe(canvas);
      const unsubscribe = subscribeToPause(tryStart);
      entry.onRestore = () => { adjust(); draw(performance.now()); };
      return () => { cancelAnimationFrame(rafId); observer.disconnect(); resizeObserver.disconnect(); unsubscribe(); canvas.remove(); entry.onRestore = null; if (!entry.isLost) pool.push(entry); };
    }
    return () => { deferObserver.disconnect(); cleanup?.(); };
  }, []);

  // Sem JavaScript, a camada do canvas vazio mantem o antialiasing do texto vizinho como sempre foi.
  return (
    <div className="contents" ref={host} aria-hidden="true">
      <noscript><canvas className="absolute inset-0 size-full pointer-events-none opacity-30 [image-rendering:pixelated]" /></noscript>
    </div>
  );
}
