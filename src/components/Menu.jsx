import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { idsDoIndice, secoesPorId } from "../secoes.js";
import { envelope } from "../ui.js";

const NOMES = { inicio: "Início" };
const doisDigitos = (n) => String(n).padStart(2, "0");

/**
 * Menu em tela cheia: botao na dobra, lista numerada das secoes presentes.
 * Os links sao `#id` simples; o Lenis (`anchors: true`) faz a rolagem, e a pagina so precisa
 * fechar o menu. `data-lenis-prevent` + overflow travado impedem a pagina de rolar por baixo.
 */
export function Menu() {
  const [aberto, definirAberto] = useState(false);
  const [montado, definirMontado] = useState(false);
  const [posicao, definirPosicao] = useState({ top: 0, left: 0 });
  const fechar = useRef(null);

  useEffect(() => definirMontado(true), []);

  useEffect(() => {
    if (!aberto) return;
    const aoTecla = (e) => e.key === "Escape" && definirAberto(false);
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("keydown", aoTecla);
    fechar.current?.focus();
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", aoTecla);
    };
  }, [aberto]);

  return (
    <>
      <button
        type="button"
        className="flex flex-col gap-[6px] w-6 h-8 pt-2 mr-2 cursor-pointer text-bone"
        aria-label="Abrir menu"
        aria-expanded={aberto}
        aria-controls="menu"
        onClick={(e) => {
          // O X de fechar ocupa o mesmo lugar das tres barras, onde quer que a dobra as ponha.
          const { top, left } = e.currentTarget.getBoundingClientRect();
          definirPosicao({ top, left });
          definirAberto(true);
        }}
      >
        <span className="block h-px w-full bg-current origin-top scale-y-110" />
        <span className="block h-px w-full bg-current origin-top scale-y-110" />
        <span className="block h-px w-full bg-current origin-top scale-y-110" />
      </button>

      {montado && createPortal(
      <div
        id="menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
        data-lenis-prevent
        inert={!aberto}
        style={{ clipPath: aberto ? "inset(0 0 0 0)" : "inset(0 0 100% 0)" }}
        className={`fixed inset-0 z-100 flex flex-col py-4 lg:py-8 bg-acento text-void transition-[clip-path] duration-700 ease-(--ease-expo) motion-reduce:transition-none ${aberto ? "" : "pointer-events-none"}`}
      >
        <div className="flex-none h-4" />
        <button
          ref={fechar}
          type="button"
          aria-label="Fechar menu"
          className="absolute w-6 h-8 cursor-pointer text-void"
          style={posicao}
          onClick={() => definirAberto(false)}
        >
          <span className="absolute top-[15px] inset-x-0 h-px bg-current origin-center rotate-45 scale-y-110" />
          <span className="absolute top-[15px] inset-x-0 h-px bg-current origin-center -rotate-45 scale-y-110" />
        </button>

        <nav className={`${envelope} flex-1 flex flex-col min-h-0 mt-4 overflow-y-auto`} aria-label="Navegação principal">
          <ol className="w-full flex flex-col my-auto">
            {idsDoIndice.map((id, i) => (
              <li key={id} className="relative">
                <span
                  aria-hidden="true"
                  className={`absolute top-0 inset-x-0 h-px bg-void origin-left transition-transform duration-700 ease-(--ease-expo) motion-reduce:transition-none ${aberto ? "scale-x-100" : "scale-x-0"}`}
                  style={{ transitionDelay: aberto ? `${300 + i * 60}ms` : "0ms" }}
                />
                <a
                  href={`#${id}`}
                  onClick={() => definirAberto(false)}
                  className="flex items-baseline gap-4 py-[clamp(6px,1.5svh,18px)] text-void font-secundaria text-display uppercase transition-transform duration-300 ease-(--ease-expo) hover:translate-x-4 focus-visible:translate-x-4 motion-reduce:transition-none [&:hover_.menu-nome]:text-transparent [&:hover_.menu-nome]:[-webkit-text-stroke:1.5px_var(--void)] [&:focus-visible_.menu-nome]:text-transparent [&:focus-visible_.menu-nome]:[-webkit-text-stroke:1.5px_var(--void)]"
                >
                  <span className="font-terciaria text-mono-reg tabular-nums">{doisDigitos(i + 1)}</span>
                  <span className="block overflow-y-clip pt-[0.15em] -mt-[0.15em]">
                    <span
                      className={`menu-nome block transition-transform duration-700 ease-(--ease-expo) motion-reduce:transition-none ${aberto ? "translate-y-0" : "translate-y-[160%]"}`}
                      style={{ transitionDelay: aberto ? `${350 + i * 60}ms` : "0ms" }}
                    >
                      {NOMES[id] ?? secoesPorId[id].rotulo}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </div>,
      document.body)}
    </>
  );
}
