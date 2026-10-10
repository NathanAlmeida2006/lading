import { useRef } from "react";
import { aoMudarPausa, estaPausado } from "../motion/pausa.js";
import { useMovimento } from "../motion/index.js";
import { assar, poseDe, quantidadeDePresets } from "../motion/halteres.js";
import { bloco } from "../ui.js";
import { CampoDePontos } from "../components/CampoDePontos.jsx";

/**
 * Ponte entre "o que voce leva" e "as proximas doze semanas": halteres caem e enchem a tela.
 *
 * Um trilho de 300svh com o canvas pinado (sticky) na janela. O progresso da rolagem e a unica
 * entrada: a queda (ragdoll, com colisao e giro) e simulada UMA vez num Worker e gravada; a pose de
 * cada haltere e leitura da gravacao (motion/halteres.js), sem fisica rodando durante a rolagem,
 * entao nada vibra, rolar para cima desfaz a queda e rolar rapido nao deixa ninguem para tras.
 * O progresso desenhado persegue o MAIOR entre o da rolagem e o do relogio: a queda corre sozinha
 * assim que a secao entra na tela e a rolagem so a adianta, entao parar de rolar nunca congela os
 * halteres no meio do caminho. O amortecimento curto alisa os degraus da roda do mouse. Aqui so ha o que e do navegador: canvas, rolagem, laco e desenho.
 *
 * Cada queda sorteia um de dez presets (motion/halteres.js: ordem das colunas, ritmo, empurrao),
 * diferente do anterior; o proximo e assado em segundo plano e entra quando a pilha some. Sob
 * movimento reduzido a pilha nasce pronta e sem respiro. Sem JS a secao e uma faixa vazia (o trilho so
 * cresce sob `js`). A doca de venda fica oculta aqui (ver Doca.jsx).
 */
const CORES = ["--rubro", "--silver", "--bone"]; // indice = `halter.cor`
const COMPLETA_EM = 0.85; // fracao da rolagem em que a tela esta cheia
const AMORTECIMENTO = 0.09; // s: constante de tempo do progresso desenhado
// Respiro: nada fica parado de vez. Oscilacao lenta e suave (periodos de 4 a 10 s) somada a pose
// gravada, em fracao de L e rad; pequena demais para ler como tremor ou para abrir vao na pilha.
const RESPIRO_X = 0.03;
const RESPIRO_Y = 0.02;
const RESPIRO_ANGULO = 0.04;
const QUADROS_POR_S = 60; // a gravacao e de passo fixo: o relogio a reproduz na velocidade em que foi simulada

export function Halteres() {
  const trilho = useRef(null);
  const tela = useRef(null);

  useMovimento(() => {
    const raiz = trilho.current;
    const canvas = tela.current;
    if (!raiz || !canvas) return;
    const ctx = canvas.getContext("2d");
    const estilo = getComputedStyle(raiz);
    const paleta = CORES.map((v) => estilo.getPropertyValue(v).trim() || "#888");
    const contorno = estilo.getPropertyValue("--void").trim() || "#09090b";
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let sim = null; // gravacao da queda; null ate o Worker terminar
    let proxima = null; // proxima queda, ja assada, para quando a pilha voltar a zero
    let ultimoPreset = -1;
    let pedida = false; // ha uma `proxima` em andamento ou guardada
    let worker = null;
    let versao = 0;
    let largura = 0;
    let altura = 0;
    let quadro = 0;
    let anterior = 0;
    let relogio = 0; // s, para o respiro
    let atual = 0; // progresso desenhado, 0..1 (ja dividido por COMPLETA_EM)
    let corrida = 0; // progresso do relogio, 0..1: a queda andando sozinha (so com a gravacao pronta)
    let emCena = false; // a secao ja entrou na tela e a queda ainda nao terminou
    let vivo = true;
    let visivel = false;
    const pose = { x: 0, y: 0, a: 0 };

    // Pede ao Worker uma queda nova (semente nova: o ragdoll muda; a entrada e igual). A primeira
    // vira `sim`; as seguintes ficam em `proxima` ate a pilha voltar a zero e poder trocar sem
    // ninguem ver.
    const pedir = () => {
      pedida = true;
      const minha = ++versao;
      const semente = (Math.random() * 2 ** 32) >>> 0;
      // Sorteia um preset diferente do anterior.
      let preset = Math.floor(Math.random() * (quantidadeDePresets - 1));
      if (preset >= ultimoPreset && ultimoPreset >= 0) preset++;
      ultimoPreset = preset;
      const chegou = (pronta) => {
        if (minha !== versao || !vivo) return;
        if (sim && atual > 0) {
          proxima = pronta;
          return;
        }
        sim = pronta;
        pedida = false;
        desenhar();
        despertar();
      };
      try {
        worker ??= new Worker(new URL("../motion/halteres.worker.js", import.meta.url), { type: "module" });
        worker.onmessage = ({ data }) => data.versao === versao && chegou(data.sim);
        worker.onerror = () => {
          worker = null;
          setTimeout(() => chegou(assar(largura, altura, semente, preset)), 0);
        };
        worker.postMessage([largura, altura, minha, semente, preset]);
      } catch {
        setTimeout(() => chegou(assar(largura, altura, semente, preset)), 0); // sem Worker: assa na main
      }
    };

    const medir = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      largura = canvas.clientWidth;
      altura = canvas.clientHeight;
      canvas.width = largura * dpr;
      canvas.height = altura * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sim = null;
      proxima = null;
      pedir();
    };

    const alvo = () => {
      const r = raiz.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, -r.top / (r.height - window.innerHeight)));
      return Math.min(1, p / COMPLETA_EM);
    };

    const rect = (cx, w, h, cor) => {
      ctx.fillStyle = cor;
      ctx.fillRect(cx - w / 2, -h / 2, w, h);
      ctx.strokeRect(cx - w / 2, -h / 2, w, h);
    };

    const desenhar = () => {
      ctx.clearRect(0, 0, largura, altura);
      if (!sim) return;
      const { L } = sim;
      const H = L * 0.4;
      ctx.strokeStyle = contorno;
      ctx.lineWidth = 1.5;
      for (let i = 0; i < sim.total; i++) {
        if (!poseDe(sim, i, atual, pose)) break; // entram em ordem: o resto ainda nao entrou
        const cor = paleta[sim.cores[i]];
        // Respiro: cada haltere com periodo e fase proprios, para nunca moverem em bloco.
        const w = 0.9 + ((i * 0.37) % 0.9);
        const fase = i * 2.399;
        ctx.save();
        ctx.translate(
          pose.x + Math.sin(relogio * w + fase) * L * RESPIRO_X,
          pose.y + Math.cos(relogio * w * 0.8 + fase * 1.3) * L * RESPIRO_Y,
        );
        ctx.rotate(pose.a + Math.sin(relogio * w * 0.7 + fase * 0.6) * RESPIRO_ANGULO);
        rect(0, L * 0.62, H * 0.16, cor);
        rect(-L * 0.4, L * 0.14, H, cor);
        rect(L * 0.4, L * 0.14, H, cor);
        rect(-L * 0.29, L * 0.08, H * 0.7, cor);
        rect(L * 0.29, L * 0.08, H * 0.7, cor);
        ctx.restore();
      }
    };

    // Pilha vazia e ja ha outra queda assada: troca sem ninguem ver.
    const trocar = () => {
      if (atual !== 0 || !proxima) return;
      sim = proxima;
      proxima = null;
      pedida = false;
    };

    // Um quadro: persegue o progresso da rolagem e desenha. So para com a tela vazia ou fora de
    // vista; rolar, voltar a ficar visivel, redimensionar ou despausar o religam (`despertar`).
    const laco = (agora) => {
      quadro = 0;
      if (!vivo || !visivel || estaPausado()) return;
      const dt = anterior ? Math.min(0.05, (agora - anterior) / 1000) : 1 / 60;
      anterior = agora;
      relogio = agora / 1000;
      const topo = raiz.getBoundingClientRect().top;
      if (topo > window.innerHeight) corrida = 0; // voltou para antes da secao: a queda recomeca ao entrar
      emCena = topo <= window.innerHeight && corrida < 1;
      if (emCena && sim) corrida = Math.min(1, corrida + (dt * QUADROS_POR_S) / Math.max(1, sim.quadros - 1));
      const meta = Math.max(alvo(), corrida);
      atual += (meta - atual) * (1 - Math.exp(-dt / AMORTECIMENTO));
      if (Math.abs(meta - atual) < 0.0005) atual = meta;
      if (atual > 0 && !pedida) pedir(); // a queda comecou: assa a da proxima vez, em segundo plano
      trocar();
      desenhar();
      // Com algo na tela o laco nao para: o respiro nunca deixa a pilha congelada.
      if (atual !== meta || (atual > 0 && sim) || emCena) quadro = requestAnimationFrame(laco);
      else anterior = 0;
    };
    const despertar = () => {
      if (!quadro && vivo && visivel) quadro = requestAnimationFrame(laco);
    };

    if (reduzido) {
      atual = 1;
      medir();
      return () => {
        vivo = false;
        worker?.terminate();
      };
    }

    // Uma tela de folga: a pilha ja esta no estado certo quando a secao chega.
    medir();
    atual = alvo();
    const observador = new IntersectionObserver(([e]) => {
      visivel = e.isIntersecting;
      if (!visivel) {
        atual = alvo(); // fora de vista o laco para: assenta o progresso (0 = acima) para a troca
        trocar();
      }
      despertar();
    }, { rootMargin: `${window.innerHeight * 1.5}px 0px` });
    observador.observe(raiz);

    const tamanho = new ResizeObserver(() => {
      const l = canvas.clientWidth;
      const a = canvas.clientHeight;
      if (Math.abs(l - largura) < 2 && Math.abs(a - altura) < 2) return;
      medir();
      desenhar();
    });
    tamanho.observe(canvas);

    window.addEventListener("scroll", despertar, { passive: true });
    const soltarPausa = aoMudarPausa(despertar);

    return () => {
      vivo = false;
      cancelAnimationFrame(quadro);
      worker?.terminate();
      observador.disconnect();
      tamanho.disconnect();
      window.removeEventListener("scroll", despertar);
      soltarPausa();
    };
  }, []);

  return (
    <section
      id="halteres"
      className={`${bloco} isolate h-[40svh] js:h-[300svh] motion-reduce:js:h-svh`}
      ref={trilho}
      aria-hidden="true"
    >
      <CampoDePontos variante="estelar" />
      <canvas ref={tela} className="sticky top-0 z-1 block w-full h-svh" />
    </section>
  );
}
