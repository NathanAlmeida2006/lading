import { useRef } from "react";
import { useMovimento } from "../motion/index.js";
import { semMovimento } from "../motion/tokens.js";
import { aoMudarPausa, estaPausado } from "../motion/pausa.js";
import { ligarCampo } from "../motion/campo.js";

/**
 * O campo de pontos ao fundo das secoes.
 *
 * Vem da secao de fecho do Google Cloud x Team USA, lida ao vivo em
 * 07/09/2026: uma malha de pontos que desenha uma superficie ondulada, com
 * fios finos de grade por tras, deslizando devagar.
 *
 * DUAS VARIANTES:
 *
 *   `malha` (o padrao: as capas e o que se leva) - grade regular com
 *   deslocamento senoidal. Barata e discreta.
 *
 *   `estelar` (as demais secoes) - pontos com profundidade, cada um na sua
 *   deriva e na sua fase de cintilar, sem grade por tras.
 *
 * ATENCAO, e esta e a razao de o componente existir isolado: o `TR-03`
 * reprova peca com "faisca ou particula", e um campo de pontos animado cai
 * literalmente nessa palavra. A decisao esta registrada como campo em aberto
 * no `requisitos-landing.md` §6. Enquanto ela nao vier, o campo e feito
 * SOMENTE do material que o sistema ja usa:
 *
 *   - ponto de 1 bit em `--bone`, sem brilho, sem halo, sem gradiente;
 *   - fio de grade em `--line`, que e o mesmo fio de 1px de toda a pagina;
 *   - nenhuma cor propria: o acento nao entra aqui, porque ele ja aparece uma
 *     vez por tela em outro lugar da secao.
 *
 * Reprovado o `TR-03`, o conserto e este componente devolver `null`: o
 * layout inteiro continua de pe, so o fundo fica liso.
 *
 * Quatro travas de custo, e nenhuma e opcional numa pagina que vende
 * performance:
 *
 *   1. So anima na tela. `IntersectionObserver` para o laco quando a secao
 *      sai.
 *   2. `prefers-reduced-motion` desenha UM quadro e para. O campo e
 *      ornamento: nao informa nada, entao nao precisa se mover.
 *   3. Densidade por area, com teto. Num monitor de 2560px a malha nao pode
 *      multiplicar por quatro o trabalho de cada quadro.
 *   4. O canvas e fatiado em ladrilhos de 320 px, e a cada quadro so os que estao na tela sao
 *      atualizados. A prova, com 1905 x 3482 px, derrubava a pagina a 20-30 quadros por segundo so
 *      por reenviar 26 MB ao compositor a cada quadro. O desenho e o ciclo de vida (os mesmos de
 *      antes, byte a byte) estao em `motion/campo.js`; este componente so da a raiz onde os
 *      ladrilhos entram.
 */
export function CampoDePontos({ variante = "malha" }) {
  const raiz = useRef(null);

  useMovimento(() => {
    if (!raiz.current) return;
    const estilo = getComputedStyle(document.documentElement);
    return ligarCampo(
      raiz.current,
      {
        variante,
        reduzido: semMovimento(),
        cores: {
          ponto: estilo.getPropertyValue("--bone").trim() || "#ededf0",
          fio: estilo.getPropertyValue("--line").trim() || "#2c2c33",
          acento: estilo.getPropertyValue("--acento").trim() || "#d2202c",
        },
      },
      { aoMudarPausa, estaPausado },
    );
  }, [variante]);

  // Os ladrilhos (`canvas.campo`) entram aqui por JavaScript: o HTML pre-renderizado so tem a raiz,
  // e o canvas nunca teve nada para mostrar antes de o pacote rodar.
  //
  // A raiz NAO e posicionada, de proposito (e sem altura: so os ladrilhos, `absolute`, tem caixa, e se
  // posicionam pela secao, que e a mesma caixa de antes). Um `div` `absolute inset-0` cobrindo a secao,
  // mesmo vazio e `pointer-events-none`, tirava o antialiasing por subpixel do texto do rodape (LCD
  // virava cinza, medido por pixel): o Chrome muda a camada em que o texto seguinte e pintado.
  return <div className="campos" ref={raiz} aria-hidden="true" />;
}
