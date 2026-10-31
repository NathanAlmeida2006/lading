import { useRef } from "react";
import { useMovimento } from "../motion/index.js";
import { semMovimento, toque } from "../motion/tokens.js";
import { aoMudarPausa, estaPausado } from "../motion/pausa.js";
import { PASSO_TOQUE } from "../motion/campo.js";

const VERTICE = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";

/**
 * Versao em codigo do gif de fluido: ruido distorcido por ele mesmo (domain warp), so as cristas
 * acendem, e o cinza sai em pontos de dither ordenado (Bayer 4x4, celula de 3 px). Cinza neutro,
 * sem cor: o acento nao entra. O tempo anda num circulo, entao o ciclo de 12 s fecha sem corte.
 */
const FRAGMENTO = `precision mediump float;
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

// Pool de no maximo um contexto pronto: criar custa ~200 ms de thread, entao o aquecimento o cria antes
// do corte e quem desmonta devolve. Manifesto e Faca nunca estao na tela juntos, por isso um basta.
const piscina = [];
function criar() {
  const cv = document.createElement("canvas");
  const gl = cv.getContext("webgl", { antialias: false, alpha: true });
  if (!gl) return null;
  const compila = (tipo, fonte) => { const s = gl.createShader(tipo); gl.shaderSource(s, fonte); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, compila(gl.VERTEX_SHADER, VERTICE));
  gl.attachShader(prog, compila(gl.FRAGMENT_SHADER, FRAGMENTO));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  gl.uniform3f(gl.getUniformLocation(prog, "c3"), 0.42, 0.42, 0.42);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  return { cv, gl, uR: gl.getUniformLocation(prog, "r"), uT: gl.getUniformLocation(prog, "t") };
}
export function aquecerFluido() {
  if (!piscina.length) { const f = criar(); if (f) piscina.push(f); }
}

// A pega do contexto so acontece quando a secao pai chega perto da tela, para a compilacao nao cair na montagem.
export function FundoFluido() {
  const host = useRef(null);

  useMovimento(() => {
    const pai = host.current?.parentElement;
    if (!pai) return;
    let limpar;
    const adiar = new IntersectionObserver(([e0]) => {
      if (!e0.isIntersecting) return;
      adiar.disconnect();
      limpar = ligar();
    }, { rootMargin: "100% 0px" });
    adiar.observe(pai);
    function ligar() {
      const f = piscina.pop() ?? criar();
      if (!f) return;
      const { cv, gl, uR, uT } = f;
      cv.className = "absolute inset-0 size-full pointer-events-none opacity-30 [image-rendering:pixelated]";
      cv.setAttribute("aria-hidden", "true");
      host.current.append(cv);
      const ajusta = () => { cv.width = Math.max(1, cv.clientWidth); cv.height = Math.max(1, cv.clientHeight); gl.viewport(0, 0, cv.width, cv.height); };
      const desenha = (ms) => { gl.uniform2f(uR, cv.width, cv.height); gl.uniform1f(uT, (ms / 12000) * Math.PI * 2); gl.drawArrays(gl.TRIANGLES, 0, 3); };
      let visivel = false, raf = 0, ultimo = -Infinity;
      const passo = toque() ? PASSO_TOQUE : 0;
      const laco = (ms) => { if (ms - ultimo >= passo) { ultimo = ms; desenha(ms); } raf = visivel && !estaPausado() ? requestAnimationFrame(laco) : 0; };
      const liga = () => { if (!raf && visivel && !semMovimento() && !estaPausado()) raf = requestAnimationFrame(laco); };
      ajusta(); desenha(0);
      const obs = new IntersectionObserver(([e]) => { visivel = e.isIntersecting; liga(); });
      obs.observe(cv);
      const ro = new ResizeObserver(() => { ajusta(); desenha(performance.now()); });
      ro.observe(cv);
      const desliga = aoMudarPausa(liga);
      return () => { cancelAnimationFrame(raf); obs.disconnect(); ro.disconnect(); desliga(); cv.remove(); piscina.push(f); };
    }
    return () => { adiar.disconnect(); limpar?.(); };
  }, []);

  // Sem JavaScript, a camada do canvas vazio mantem o antialiasing do texto vizinho como sempre foi.
  return (
    <div className="contents" ref={host} aria-hidden="true">
      <noscript><canvas className="absolute inset-0 size-full pointer-events-none opacity-30 [image-rendering:pixelated]" /></noscript>
    </div>
  );
}
