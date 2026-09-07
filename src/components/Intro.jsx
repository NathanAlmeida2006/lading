import { useEffect } from "react";

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
 * Tres travas:
 *
 *   1. Em toda carga, inclusive recarga no meio da pagina (decisao do gerente
 *      do projeto, 06/09/2026). A cortina e fixa, entao cobre a tela em
 *      qualquer posicao de rolagem.
 *   2. Sem JavaScript nao existe, e com movimento reduzido tambem nao: a
 *      classe `intro-pendente` e escrita pelo script inline do index.html
 *      ANTES da primeira pintura, para a cortina nao piscar por cima do heroi
 *      ja renderizado. Este componente so toca a coreografia.
 *   3. `pointer-events: none` e `aria-hidden`: a cortina e imagem, nao
 *      interface. O leitor de tela nao a ouve e nada fica inclicavel por
 *      tras dela alem do que a rolagem travada ja impede.
 */
const LINHAS = ["Natural", "Cresce."];
const MOSTRAR_EM = 60;
const SAIR_EM = 1500;
const FIM_EM = 3100;

export function introPendente() {
  return typeof document !== "undefined" && document.documentElement.classList.contains("intro-pendente");
}

export function Intro() {
  useEffect(() => {
    const raiz = document.documentElement;
    if (!raiz.classList.contains("intro-pendente")) return;
    const no = document.querySelector(".intro");
    if (!no) return;

    document.body.classList.add("intro-travada");
    const t1 = setTimeout(() => no.classList.add("intro--mostrar"), MOSTRAR_EM);
    const t2 = setTimeout(() => no.classList.add("intro--sair"), SAIR_EM);
    const t3 = setTimeout(() => {
      raiz.classList.remove("intro-pendente");
      document.body.classList.remove("intro-travada");
    }, FIM_EM);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      document.body.classList.remove("intro-travada");
    };
  }, []);

  let indice = 0;
  return (
    <div className="intro" aria-hidden="true">
      <div className="intro__bloco envelope">
        <span className="intro__rotulo overline">(protocolo 01 · hipertrofia)</span>
        <p className="intro__titulo display-xxl">
          {LINHAS.map((linha) => (
            <span className="intro__linha" key={linha}>
              {[...linha].map((letra, i) => (
                <span className="intro__letra" style={{ "--index": indice++ }} key={`${linha}-${i}`}>
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
