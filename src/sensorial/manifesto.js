import { acenderEmSequencia, useMovimento } from "./index.js";
import { semMovimento } from "./tokens.js";

// Ritmo da sequencia de palavras. Acompanha a altura do trilho declarada na secao.
const RITMO = 1.224;

/** Manifesto: as palavras acendem com a rolagem, e o trilho so existe enquanto o texto cabe na janela. */
export function useManifesto(raiz) {
  useMovimento(() => {
    const no = raiz.current;
    if (!no) return;
    const texto = no.querySelector(".manifesto__texto");
    if (!texto) return;
    let ativo = true;
    let quadro = 0;
    const documento = document.documentElement;
    // `data-cabe` troca a altura da secao em ~1 tela. Medir contra `innerHeight`/`visualViewport` fazia
    // a barra do navegador (ou o zoom) virar o dado no meio da rolagem e a pagina pulava de secao.
    // `svh` nao muda com a barra: e a mesma unidade do `min-h-svh` do texto.
    const sonda = document.createElement("div");
    sonda.setAttribute("aria-hidden", "true");
    sonda.style.cssText = "position:fixed;top:0;height:100svh;width:0;visibility:hidden;pointer-events:none";
    no.appendChild(sonda);
    const medir = () => {
      quadro = 0;
      if (!ativo) return;
      const topo = parseFloat(getComputedStyle(texto).top);
      // `offsetHeight` arredonda e o palco (`min-h-svh`) nao: em aparelho real o svh e fracionario
      // (ex.: 780,57) e o palco media 0,5 px a mais que a sonda, desligando o trilho inteiro.
      const altura = sonda.getBoundingClientRect().height;
      const movimentoDisponivel = documento.classList.contains("movimento-pronto") &&
        !documento.classList.contains("movimento-falhou");
      const cabe = movimentoDisponivel && !semMovimento() && Number.isFinite(topo) &&
        texto.getBoundingClientRect().height + topo * 2 <= altura + 1;
      if (no.hasAttribute("data-cabe") !== cabe) no.toggleAttribute("data-cabe", cabe);
    };
    const agendar = () => {
      if (ativo && !quadro) quadro = requestAnimationFrame(medir);
    };
    // Observe apenas o texto: a altura da seção muda quando o sticky é habilitado.
    const observador = new ResizeObserver(agendar);
    observador.observe(texto);
    // O trilho só existe enquanto a animação está disponível, inclusive após falha tardia.
    const observadorMovimento = new MutationObserver(agendar);
    observadorMovimento.observe(documento, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("resize", agendar);
    document.fonts.ready.then(agendar);
    medir();
    acenderEmSequencia(no.querySelectorAll(".palavra"), no, { fixo: true, atributoAtual: "data-atual", ritmo: RITMO });
    return () => {
      ativo = false;
      cancelAnimationFrame(quadro);
      observador.disconnect();
      observadorMovimento.disconnect();
      window.removeEventListener("resize", agendar);
      sonda.remove();
      no.removeAttribute("data-cabe");
    };
  }, []);
}
