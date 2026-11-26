import { useRef } from "react";
import { useMotion } from "../../sensory/index.js";
import { isMotionReduced, isTouchPointer } from "../../sensory/tokens.js";
import { getFieldColors, startField } from "../../sensory/field.js";

/**
 * O campo de pontos ao fundo das seções.
 *
 * Vem da seção de fecho do Google Cloud x Team USA, lida ao vivo em
 * 07/09/2026: uma malha de pontos que desenha uma superfície ondulada, com
 * fios finos de grade por trás, deslizando devagar.
 *
 * DUAS VARIANTES:
 *
 *   `malha` (o padrão: as capas e o que se leva) - grade regular com
 *   deslocamento senoidal. Barata e discreta.
 *
 *   `estelar` (as demais seções) - pontos com profundidade, cada um na sua
 *   deriva e na sua fase de cintilar, sem grade por trás.
 *
 * ATENÇÃO, e esta é a razão de o componente existir isolado: o `TR-03`
 * reprova peça com "faísca ou partícula", e um campo de pontos animado cai
 * literalmente nessa palavra. A decisão está registrada como campo em aberto
 * nos requisitos da landing (hoje arquivados). Enquanto ela não vier, o campo é feito
 * SOMENTE do material que o sistema já usa:
 *
 *   - ponto de 1 bit em `--bone`, sem brilho, sem halo, sem gradiente;
 *   - fio de grade em `--line`, que é o mesmo fio de 1px de toda a página;
 *   - nenhuma cor própria na malha; a variante estelar usa o acento em 6% dos
 *     pontos.
 *
 * Reprovado o `TR-03`, o conserto é este componente devolver `null`: o
 * layout inteiro continua de pé, só o fundo fica liso.
 *
 * Quatro travas de custo, e nenhuma é opcional numa página que vende
 * performance:
 *
 *   1. Só anima na tela. `IntersectionObserver` para o laço quando a seção
 *      sai.
 *   2. `prefers-reduced-motion` desenha UM quadro e para. O campo é
 *      ornamento: não informa nada, então não precisa se mover.
 *   3. Densidade por área, com teto. Num monitor de 2560px a malha não pode
 *      multiplicar por quatro o trabalho de cada quadro.
 *   4. O canvas é fatiado em ladrilhos de 320 px, e a cada quadro só os que estão na tela são
 *      atualizados. Uma seção alta (medida em 1905 x 3482 px, já removida) derrubava a página a 20-30 quadros por segundo só
 *      por reenviar 26 MB ao compositor a cada quadro. O desenho e o ciclo de vida (os mesmos de
 *      antes, byte a byte) estão em `sensory/field.js`; este componente só dá a raiz onde os
 *      ladrilhos entram.
 * @param {object} props
 * @param {"malha"|"estelar"} [props.variant="malha"] - Variante do campo.
 * @param {object} [props.colors] - Cores que substituem as do sistema (só os takes sobre fundo colorido usam).
 * @returns {JSX.Element}
 */
export function DotField({ variant = "malha", colors }) {
  const root = useRef(null);

  useMotion(() => {
    if (!root.current) return;
    return startField(root.current, {
      variant: variant,
      isReduced: isMotionReduced(),
      isTouch: isTouchPointer(),
      // só os takes sobre fundo colorido trocam as cores (Takes.jsx)
      colors: { ...getFieldColors(), ...colors },
    });
  }, [variant, colors?.dot]); // eslint-disable-line react-hooks/exhaustive-deps -- intencional: colors é um objeto novo a cada renderização e só colors.dot vale como chave; rodar de novo recriaria o campo; hoje o único uso de colors é uma constante de módulo (Takes.jsx)

  // Os ladrilhos (`canvas.campo`) entram aqui por JavaScript: o HTML pré-renderizado só tem a raiz,
  // e o canvas nunca teve nada para mostrar antes de o pacote rodar.
  //
  // A raiz NÃO é posicionada, de propósito (e sem altura: só os ladrilhos, `absolute`, tem caixa, e se
  // posicionam pela seção, que é a mesma caixa de antes). Um `div` `absolute inset-0` cobrindo a seção,
  // mesmo vazio e `pointer-events-none`, tirava o antialiasing por subpixel do texto do rodapé (LCD
  // virava cinza, medido por pixel): o Chrome muda a camada em que o texto seguinte e pintado.
  return <div className="campos" ref={root} aria-hidden="true" />;
}
