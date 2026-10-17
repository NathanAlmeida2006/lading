import { conteudo } from "../conteudo.js";
import { envelope } from "../ui.js";

/**
 * A introducao: a cortina do lenis.dev, no idioma desta pagina.
 *
 * Lido do CSS de producao do site de origem (`intro-module`): uma cortina fixa
 * na cor da marca; as letras do wordmark nascem abaixo da propria linha
 * (`translateY(100% + indice * 5%)`) e sobem uma a uma, 1,5 s em expo-out com
 * 75 ms de escalonamento por indice; passados 1,5 s, a cortina sobe
 * (`translateY(-100%)`) e o bloco de letras sobe junto, mais rapido que ela,
 * enquanto o heroi, ja composto, aparece por baixo da borda que se ergue.
 *
 * Aqui a cortina e o Rubro - a cor inunda, que e o cartaz `ac3` de onde ela
 * veio - e as letras sao a headline da dobra, em tinta. Nada e novo: a
 * escala `display-xxl`, o envelope e o rotulo entre parenteses sao os do
 * heroi, e e isso que faz a passagem de bastao ler como uma coisa so.
 *
 * Quatro travas:
 *
 *   1. Em toda carga, inclusive recarga no meio da pagina (decisao do gerente
 *      do projeto, 06/09/2026). A cortina e fixa, entao cobre a tela em
 *      qualquer posicao de rolagem.
 *   2. Sem JavaScript nao existe, e com movimento reduzido tambem nao: a
 *      classe `intro-pendente` e escrita pelo script inline do index.html
 *      ANTES da primeira pintura, para a cortina nao piscar por cima do heroi
 *      ja renderizado.
 *   3. A coreografia e CSS puro (keyframes em styles/residual.css), e o mesmo
 *      script inline recolhe a cortina e destrava a rolagem aos 3,2 s. Nada
 *      aqui espera o pacote de JavaScript: se ele atrasar ou falhar, a cortina
 *      sobe e some do mesmo jeito.
 *   4. `pointer-events: none` e `aria-hidden`: a cortina e imagem, nao
 *      interface. O leitor de tela nao a ouve e nada fica inclicavel por
 *      tras dela.
 */
export function Intro() {
  let indice = 0;
  return (
    <div
      className="intro hidden fixed inset-0 z-100 bg-acento text-void overflow-clip pointer-events-none pendente:flex pendente:flex-col pendente:justify-end pendente:pb-8 lg:pendente:pb-16 animate-intro-sair"
      aria-hidden="true"
    >
      <div className={`${envelope} flex flex-col gap-3 animate-intro-bloco`}>
        <span className="font-secundaria text-overline uppercase text-void">(protocolo 01 · hipertrofia)</span>
        <p className="flex flex-col w-full font-secundaria text-display-xxl uppercase tabular-nums">
          {conteudo.dobra.headline.linhas.map((linha) => (
            <span className="block overflow-clip pb-[0.04em] -mb-[0.04em] whitespace-nowrap" key={linha}>
              {[...linha].map((letra, i) => (
                <span className="inline-block will-change-transform animate-intro-letra" style={{ "--index": indice++ }} key={`${linha}-${i}`}>
                  {letra}
                </span>
              ))}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
