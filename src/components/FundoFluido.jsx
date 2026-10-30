import { useRef } from "react";
import { useMovimento } from "../motion/index.js";
import { semMovimento } from "../motion/tokens.js";
import { aoMudarPausa, estaPausado } from "../motion/pausa.js";

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

/**
 * `cor` (rgb 0-1) tinge as cristas; `className` fixa a opacidade. Fundo animado em WebGL cru (sem dependencia). Anda so na tela e fora de pausa; com movimento
 * reduzido desenha um quadro e para. Sem WebGL, o canvas fica sem desenho e a secao segue lisa.
 */
export function FundoFluido({ cor = [0.42, 0.42, 0.42], className = "opacity-30" }) {
  const tela = useRef(null);

  useMovimento(() => {
    const cv = tela.current;
    const gl = cv?.getContext("webgl", { antialias: false, alpha: true });
    if (!gl) return;
    const compila = (tipo, fonte) => {
      const s = gl.createShader(tipo);
      gl.shaderSource(s, fonte);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, compila(gl.VERTEX_SHADER, VERTICE));
    gl.attachShader(prog, compila(gl.FRAGMENT_SHADER, FRAGMENTO));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uR = gl.getUniformLocation(prog, "r");
    const uT = gl.getUniformLocation(prog, "t");
    gl.uniform3f(gl.getUniformLocation(prog, "c3"), ...cor);

    // Resolucao cheia: a celula do dither e 3 px de tela. ponteiro: custo 4x o da meia resolucao; voltar a /2 se pesar.
    const ajusta = () => {
      cv.width = Math.max(1, cv.clientWidth);
      cv.height = Math.max(1, cv.clientHeight);
      gl.viewport(0, 0, cv.width, cv.height);
    };
    const desenha = (ms) => {
      gl.uniform2f(uR, cv.width, cv.height);
      gl.uniform1f(uT, (ms / 12000) * Math.PI * 2);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    let visivel = false;
    let raf = 0;
    const laco = (ms) => {
      desenha(ms);
      raf = visivel && !estaPausado() ? requestAnimationFrame(laco) : 0;
    };
    const liga = () => {
      if (!raf && visivel && !semMovimento() && !estaPausado()) raf = requestAnimationFrame(laco);
    };
    ajusta();
    desenha(0);
    const obs = new IntersectionObserver(([e]) => {
      visivel = e.isIntersecting;
      liga();
    });
    obs.observe(cv);
    const ro = new ResizeObserver(() => {
      ajusta();
      desenha(performance.now());
    });
    ro.observe(cv);
    const desliga = aoMudarPausa(liga);
    return () => {
      cancelAnimationFrame(raf);
      obs.disconnect();
      ro.disconnect();
      desliga();
    };
  }, [cor.join()]);

  return <canvas ref={tela} className={`absolute inset-0 size-full pointer-events-none ${className} [image-rendering:pixelated]`} aria-hidden="true" />;
}
