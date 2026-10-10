import { Fragment, useRef } from "react";
import { conteudo } from "../conteudo.js";
import { CampoDePontos } from "../components/CampoDePontos.jsx";
import { useCortina } from "../motion/cortina.js";
import { Rotulo } from "../components/Rotulo.jsx";
import { acenderEmSequencia, useMovimento } from "../motion/index.js";
import { bloco, envelope } from "../ui.js";

// O texto vem do contrato editorial. O realce complementa a leitura: nenhuma
// palavra depende da animação para ficar legível. Sem medição, tudo fica no fluxo.
// Mesma convencao da prova: palavra apagada e opacidade, e a da fronteira (`data-atual`) no acento.
const PALAVRA =
  "palavra inline-block transition-[opacity,color] duration-(--motion-fast) ease-(--ease-corte-2) " +
  "js:opacity-[0.22] data-acesa:opacity-100 data-atual:text-acento " +
  "motion-reduce:js:opacity-100 motion-reduce:data-atual:text-inherit";

export function Manifesto() {
  const raiz = useRef(null);
  useCortina(raiz);

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
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)");
    const medir = () => {
      quadro = 0;
      if (!ativo) return;
      const topo = parseFloat(getComputedStyle(texto).top);
      const altura = sonda.offsetHeight;
      const movimentoDisponivel = documento.classList.contains("movimento-pronto") &&
        !documento.classList.contains("movimento-falhou");
      const cabe = movimentoDisponivel && !reduzido.matches && Number.isFinite(topo) &&
        texto.getBoundingClientRect().height + topo * 2 <= altura;
      if (no.hasAttribute("data-cabe") !== cabe) no.toggleAttribute("data-cabe", cabe);
    };
    const agendar = () => {
      if (ativo && !quadro) quadro = requestAnimationFrame(medir);
    };
    // Observe apenas o texto: a altura da seção muda quando o sticky é habilitado.
    const observador = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(agendar);
    observador?.observe(texto);
    // O trilho só existe enquanto a animação está disponível, inclusive após falha tardia.
    const observadorMovimento = typeof MutationObserver === "undefined" ? null : new MutationObserver(agendar);
    observadorMovimento?.observe(documento, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("resize", agendar);
    document.fonts?.ready.then(agendar);
    medir();
    const anim = acenderEmSequencia(no.querySelectorAll(".palavra"), no, { fixo: true, atributoAtual: "data-atual" });
    return () => {
      ativo = false;
      cancelAnimationFrame(quadro);
      observador?.disconnect();
      observadorMovimento?.disconnect();
      window.removeEventListener("resize", agendar);
      sonda.remove();
      no.removeAttribute("data-cabe");
      anim?.revert?.();
    };
  }, []);

  return (
    <section id="reconhecimento" className={`${bloco} isolate group/manifesto data-cabe:min-h-[205svh] motion-reduce:min-h-0`} ref={raiz}>
      <CampoDePontos variante="estelar" />
      <div className={`${envelope} manifesto__texto relative z-1 top-0 min-h-svh flex flex-col items-center justify-center group-data-cabe/manifesto:sticky motion-reduce:static`}>
        <div>
        <Rotulo como="h2">{conteudo.reconhecimento.rotulo}</Rotulo>
        <p className="font-secundaria font-bold text-[length:46.9px] leading-[1.05] normal-case tracking-normal max-w-prose text-bone lg:text-[length:clamp(58px,6.6vw,82px)] lg:leading-none lg:max-w-[32ch]">
          {conteudo.reconhecimento.texto.split(" ").map((palavra, indice) => (
            // O espaco fica FORA do span: espaco no fim de um inline-block e
            // descartado pelo navegador, e as palavras colavam.
            <Fragment key={`${palavra}-${indice}`}>
              <span className={PALAVRA}>{palavra}</span>{" "}
            </Fragment>
          ))}
        </p>
        </div>
      </div>
    </section>
  );
}
