import { useEffect, useRef } from "react";
import { semMovimento } from "../motion/tokens.js";

/**
 * O campo de pontos ao fundo da prova.
 *
 * Vem da secao de fecho do Google Cloud x Team USA, lida ao vivo em
 * 07/09/2026: uma malha de pontos que desenha uma superficie ondulada, com
 * fios finos de grade por tras, deslizando devagar.
 *
 * DUAS VARIANTES, e a diferenca entre elas e o estudo de 07/09/2026 feito com
 * recortes ampliados do site de origem:
 *
 *   `malha` (prova, o que se leva) - grade regular com deslocamento senoidal.
 *   Barata e discreta.
 *
 *   `fiel` (as tres perguntas) - a rede em perspectiva. E uma malha regular
 *   deformada por um relevo e projetada: ela se adensa nas cristas e volta a
 *   ser rede entre elas, varia de tamanho e brilho por profundidade, e uma
 *   minoria dos pontos e do acento. Custa mais, e por isso nao e o padrao.
 *
 * ATENCAO, e esta e a razao de o componente existir isolado: o `TR-03` reprova
 * peca com "faisca ou particula", e um campo de pontos animado cai
 * literalmente nessa palavra. A decisao esta registrada como campo em aberto
 * no `requisitos-landing.md` §6. Enquanto ela nao vier, o campo e feito
 * SOMENTE do material que o sistema ja usa:
 *
 *   - ponto de 1 bit em `--bone`, sem brilho, sem halo, sem gradiente;
 *   - fio de grade em `--line`, que e o mesmo fio de 1px de toda a pagina;
 *   - nenhuma cor propria: o acento nao entra aqui, porque ele ja aparece uma
 *     vez por tela em outro lugar da secao.
 *
 * Reprovado o `TR-03`, o conserto e trocar este componente por `null` no
 * `Prova.jsx`: o layout inteiro continua de pe, so o fundo fica liso.
 *
 * Tres travas de custo, e nenhuma e opcional numa pagina que vende
 * performance:
 *
 *   1. So anima na tela. `IntersectionObserver` para o laco quando a secao
 *      sai, que e a mesma disciplina da marquise.
 *   2. `prefers-reduced-motion` desenha UM quadro e para. O campo e
 *      ornamento: nao informa nada, entao nao precisa se mover.
 *   3. Densidade por area, com teto. Num monitor de 2560px a malha nao pode
 *      multiplicar por quatro o trabalho de cada quadro.
 */
const ESPACO = 26;      // distancia entre pontos, em px de layout
const MAX_PONTOS = 2600; // teto de pontos por quadro
const GRADE = 160;      // distancia entre os fios da grade

export function CampoDePontos({ variante = "malha" }) {
  const tela = useRef(null);

  useEffect(() => {
    const fiel = variante === "fiel";
    const canvas = tela.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduzido = semMovimento();
    const estilo = getComputedStyle(document.documentElement);
    const corPonto = estilo.getPropertyValue("--bone").trim() || "#ededf0";
    const corFio = estilo.getPropertyValue("--line").trim() || "#2c2c33";
    const corAcento = estilo.getPropertyValue("--rubro").trim() || "#d2202c";

    let largura = 0;
    let altura = 0;
    let colunas = 0;
    let linhas = 0;
    let quadro = 0;
    let vivo = false;

    /**
     * A REDE da variante fiel.
     *
     * O estudo com recortes ampliados do site de origem (07/09/2026) corrigiu
     * uma leitura errada minha. Os pontos de la NAO sao aleatorios: nas areas
     * calmas aparece uma rede regular, de linhas e colunas uniformes, e o
     * adensamento so acontece nas cristas. A primeira tentativa sorteou os
     * pontos, e o resultado leu como estrela espalhada - porque randomizar
     * destroi exatamente o que faz a crista ser legivel.
     *
     * Entao a rede e regular em (u, v): `u` de lado, `v` de profundidade. O
     * relevo desloca cada ponto e a perspectiva comprime o que esta longe. A
     * crista aparece onde a superficie dobra e varias linhas de `v` caem quase
     * no mesmo ponto da tela; entre elas, a rede volta a ser rede.
     *
     * O `jitter` pequeno tira o ar de papel milimetrado sem apagar a
     * estrutura. Semente fixa: o campo e o mesmo em toda carga.
     */
    let rede = [];
    const semear = (colunas, linhasZ) => {
      let s = 20260907;
      const rnd = () => {
        s = (s * 1664525 + 1013904223) % 4294967296;
        return s / 4294967296;
      };
      rede = [];
      for (let i = 0; i < colunas; i += 1) {
        for (let j = 0; j < linhasZ; j += 1) {
          rede.push({
            u: (i / (colunas - 1)) * 2 - 1 + (rnd() - 0.5) * (1.6 / colunas),
            v: j / (linhasZ - 1) + (rnd() - 0.5) * (0.7 / linhasZ),
            j: 0.75 + rnd() * 0.5,
            acento: rnd() < 0.09,
          });
        }
      }
    };

    const medir = () => {
      const caixa = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      largura = Math.max(1, Math.round(caixa.width));
      altura = Math.max(1, Math.round(caixa.height));
      canvas.width = Math.round(largura * dpr);
      canvas.height = Math.round(altura * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Densidade por area, com teto: o espaco cresce se a tela for grande
      // demais para a malha caber no orcamento de pontos.
      let espaco = ESPACO;
      while ((largura / espaco) * (altura / espaco) > MAX_PONTOS) espaco += 2;
      colunas = Math.ceil(largura / espaco) + 1;
      linhas = Math.ceil(altura / espaco) + 1;
      canvas.dataset.espaco = String(espaco);

      if (fiel) {
        // Densidade por area, com teto, pela mesma razao da malha: num monitor
        // grande a rede nao pode multiplicar o trabalho de cada quadro.
        const cols = Math.max(28, Math.min(104, Math.round(largura / 15)));
        const rows = Math.max(20, Math.min(52, Math.round(Math.min(altura, 1100) / 24)));
        if (rede.length !== cols * rows) semear(cols, rows);
      }
    };

    const pintar = (t) => {
      const espaco = Number(canvas.dataset.espaco) || ESPACO;
      ctx.clearRect(0, 0, largura, altura);

      // A grade: fios de 1px, o mesmo vocabulario do resto da pagina.
      ctx.strokeStyle = corFio;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      for (let x = GRADE / 2; x < largura; x += GRADE) {
        ctx.moveTo(Math.round(x) + 0.5, 0);
        ctx.lineTo(Math.round(x) + 0.5, altura);
      }
      for (let y = GRADE / 2; y < altura; y += GRADE) {
        ctx.moveTo(0, Math.round(y) + 0.5);
        ctx.lineTo(largura, Math.round(y) + 0.5);
      }
      ctx.stroke();

      if (fiel) {
        // A REDE em perspectiva.
        //
        // A altura de referencia e LIMITADA: a secao pode ter 2600px, e usar a
        // altura dela como escala esticaria o relevo ate ele virar listra. O
        // campo desenha o mesmo relevo em qualquer secao.
        const vis = Math.min(altura, 900);
        const horizonte = altura * 0.4;
        for (const pt of rede) {
          const z = 1 + pt.v * pt.v * 8;           // v ao quadrado adensa o fundo
          const k = 1.55 / z;                      // perspectiva, ~1,55 a 0,17
          const h =
            Math.sin(pt.u * 2.4 + z * 1.15 + t * 0.00032) * 0.6 +
            Math.sin(pt.u * 1.1 - z * 2.1 + t * 0.0002) * 0.4;
          const x = largura / 2 + pt.u * k * largura * 0.52;
          const y = horizonte + (0.9 - h * 0.72) * k * vis * 0.62;
          if (x < -8 || x > largura + 8 || y < -8 || y > altura + 8) continue;

          // Perto = maior e mais claro. E o unico "sombreamento" que existe
          // aqui: sem brilho, sem halo, sem gradiente (TR-03 e TR-09).
          const perto = Math.max(0, Math.min(1, 1.15 - z / 7));
          const alpha = (0.08 + perto * 0.62) * pt.j;
          if (alpha < 0.05) continue;
          ctx.globalAlpha = Math.min(0.9, alpha);
          ctx.fillStyle = pt.acento ? corAcento : corPonto;
          const d = perto > 0.6 ? 2 : 1.4;
          ctx.fillRect(Math.round(x), Math.round(y), d, d);
        }
        ctx.globalAlpha = 1;
        return;
      }

      // A superficie: duas senoides cruzadas deslocam o ponto no eixo Y, e a
      // mesma conta manda na opacidade. E o que faz a malha ler como relevo em
      // vez de chuvisco - ponto alto aparece, ponto baixo some.
      ctx.fillStyle = corPonto;
      for (let i = 0; i < colunas; i += 1) {
        const x = i * espaco;
        for (let j = 0; j < linhas; j += 1) {
          const y = j * espaco;
          const onda =
            Math.sin(x * 0.011 + t * 0.00042) * Math.cos(y * 0.013 - t * 0.00031) +
            Math.sin((x + y) * 0.006 + t * 0.00019);
          const alpha = 0.06 + Math.max(0, onda) * 0.34;
          if (alpha <= 0.07) continue;
          ctx.globalAlpha = alpha;
          ctx.fillRect(Math.round(x), Math.round(y + onda * 9), 1.5, 1.5);
        }
      }
      ctx.globalAlpha = 1;
    };

    const laco = (t) => {
      if (!vivo) return;
      pintar(t);
      quadro = requestAnimationFrame(laco);
    };

    medir();
    pintar(0);

    const aoRedimensionar = () => {
      medir();
      if (!vivo) pintar(performance.now());
    };
    window.addEventListener("resize", aoRedimensionar, { passive: true });

    // Sob movimento reduzido fica no quadro unico: o campo e ornamento e nao
    // carrega informacao nenhuma.
    let observador = null;
    if (!reduzido && "IntersectionObserver" in window) {
      observador = new IntersectionObserver(
        ([entrada]) => {
          if (entrada.isIntersecting && !vivo) {
            vivo = true;
            quadro = requestAnimationFrame(laco);
          } else if (!entrada.isIntersecting && vivo) {
            vivo = false;
            cancelAnimationFrame(quadro);
          }
        },
        { rootMargin: "120px 0px" },
      );
      observador.observe(canvas);
    }

    return () => {
      vivo = false;
      cancelAnimationFrame(quadro);
      observador?.disconnect();
      window.removeEventListener("resize", aoRedimensionar);
    };
  }, [variante]);

  return <canvas className="campo" ref={tela} aria-hidden="true" />;
}
