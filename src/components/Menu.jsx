import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { idsDoIndice, secoesPorId } from "../secoes.js";
import { envelope } from "../ui.js";
import { Wordmark } from "./Wordmark.jsx";

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
  const fechar = useRef(null);
  const acionador = useRef(null);
  const dialogo = useRef(null);
  const destino = useRef(null);

  useEffect(() => {
    definirMontado(true);
    // Aberto antes de hidratar (alvo nativo `#menu`): segue aberto, sem salto nem fechamento.
    if (location.hash === "#menu") {
      history.replaceState(null, "", location.pathname + location.search);
      definirAberto(true);
    }
  }, []);

  // Antes de montar (HTML estatico, bundle lento ou ausente) o menu e CSS puro: o acionador e um
  // link para `#menu`, o dialogo vai inline e abre por `:target`, e Fechar e um link para a dobra.
  // Os links do indice ja sao `#id` nativos. Estado revelado, porque so e visivel quando alvo.
  const mostrar = aberto || !montado;
  const Fechar = montado ? "button" : "a";

  useLayoutEffect(() => {
    if (!aberto) return;
    const menu = dialogo.current;
    if (!menu) return;

    // O portal e irmao da raiz React: isolar seus irmaos preserva o proprio modal.
    const fundo = [...document.body.children]
      .filter((elemento) => elemento !== menu)
      .map((elemento) => ({ elemento, inert: elemento.getAttribute("inert") }));
    for (const { elemento } of fundo) elemento.inert = true;

    // Guardar as declaracoes existentes tambem preserva longhands e !important.
    const rolagem = [document.documentElement, document.body].map((elemento) => ({
      elemento,
      declaracoes: Array.from(elemento.style)
        .filter((nome) => ["overflow", "overflow-x", "overflow-y"].includes(nome))
        .map((nome) => [nome, elemento.style.getPropertyValue(nome), elemento.style.getPropertyPriority(nome)]),
    }));
    for (const { elemento } of rolagem) elemento.style.setProperty("overflow", "hidden", "important");

    const controlesVisiveis = () => [...menu.querySelectorAll(
      'a[href], button, input, select, textarea, [tabindex], [contenteditable="true"]',
    )].filter((elemento) => {
      const estilo = getComputedStyle(elemento);
      return elemento.tabIndex >= 0 && !elemento.matches(":disabled") &&
        !elemento.closest("[inert], [hidden]") && elemento.getClientRects().length > 0 &&
        estilo.visibility !== "hidden" && estilo.visibility !== "collapse";
    });
    const aoTecla = (evento) => {
      if (evento.key === "Escape") {
        evento.preventDefault();
        definirAberto(false);
      } else if (evento.key === "Tab") {
        const controles = controlesVisiveis();
        if (!controles.length) return;
        evento.preventDefault();
        const atual = controles.indexOf(document.activeElement);
        const proximo = atual < 0
          ? (evento.shiftKey ? controles.length - 1 : 0)
          : (atual + (evento.shiftKey ? -1 : 1) + controles.length) % controles.length;
        controles[proximo].focus();
      }
    };
    const conterFoco = (evento) => {
      if (!menu.contains(evento.target)) controlesVisiveis()[0]?.focus({ preventScroll: true });
    };
    document.addEventListener("keydown", aoTecla, true);
    document.addEventListener("focusin", conterFoco);
    fechar.current?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener("keydown", aoTecla, true);
      document.removeEventListener("focusin", conterFoco);
      for (const { elemento, inert } of fundo) {
        if (inert === null) elemento.removeAttribute("inert");
        else elemento.setAttribute("inert", inert);
      }
      for (const { elemento, declaracoes } of rolagem) {
        elemento.style.removeProperty("overflow");
        for (const [nome, valor, prioridade] of declaracoes) elemento.style.setProperty(nome, valor, prioridade);
      }
      const alvo = destino.current ? document.getElementById(destino.current) : acionador.current;
      if (!alvo?.isConnected) return;
      const tabindex = alvo.getAttribute("tabindex");
      if (destino.current && tabindex === null) alvo.setAttribute("tabindex", "-1");
      alvo.focus({ preventScroll: true });
      if (destino.current && tabindex === null) alvo.removeAttribute("tabindex");
    };
  }, [aberto]);

  const painel = (
    <div
      ref={dialogo}
      id="menu"
      role="dialog"
      aria-modal="true"
      aria-label="Menu de navegação"
      data-lenis-prevent
      inert={montado ? !aberto : undefined}
      style={montado ? { clipPath: aberto ? "inset(0 0 0 0)" : "inset(0 0 100% 0)" } : undefined}
      className={`fixed inset-0 z-100 flex flex-col py-4 lg:py-8 bg-acento text-void transition-[clip-path] duration-700 ease-(--ease-expo) motion-reduce:transition-none ${montado ? (aberto ? "" : "pointer-events-none") : "invisible target:visible"}`}
    >
      {/* Espelha a linha do cabecalho da dobra (mesmo envelope, wordmark invisivel como medida): o X
          cai sobre as tres barras em qualquer largura, sem coordenada congelada. */}
      <div className={`${envelope} flex-none flex items-center justify-between gap-4`}>
        <div aria-hidden="true"><Wordmark referencia className="block w-33 invisible" /></div>
        <Fechar
          ref={fechar}
          {...(montado ? { type: "button", onClick: () => definirAberto(false) } : { href: "#inicio" })}
          aria-label="Fechar menu"
          className="relative z-1 w-12 h-12 -my-2 -mr-1 cursor-pointer text-void"
        >
          <span className="absolute top-[23px] left-3 right-3 h-px bg-current origin-center rotate-45 scale-y-110" />
          <span className="absolute top-[23px] left-3 right-3 h-px bg-current origin-center -rotate-45 scale-y-110" />
        </Fechar>
      </div>

      <nav className={`${envelope} flex-1 flex flex-col min-h-0 overflow-y-auto`} aria-label="Navegação principal">
        <ol className="w-full flex flex-col my-auto">
          {idsDoIndice.map((id, i) => (
            <li key={id} className="relative">
              <span
                aria-hidden="true"
                className={`absolute top-0 inset-x-0 h-px bg-void origin-left transition-transform duration-700 ease-(--ease-expo) motion-reduce:transition-none ${mostrar ? "scale-x-100" : "scale-x-0"}`}
                style={{ transitionDelay: mostrar ? `${300 + i * 60}ms` : "0ms" }}
              />
              <a
                href={`#${id}`}
                onClick={() => {
                  destino.current = id;
                  // Liberar o fundo antes de o evento chegar ao Lenis ou a ancora nativa.
                  flushSync(() => definirAberto(false));
                }}
                className="flex items-baseline gap-4 py-[clamp(6px,1.5svh,18px)] text-void font-secundaria text-[length:clamp(2.5rem,4.5vw,3.5rem)] leading-none tracking-[0.02em] font-extrabold uppercase transition-transform duration-300 ease-(--ease-expo) hover:translate-x-4 focus-visible:translate-x-4 motion-reduce:transition-none [&:hover_.menu-nome]:text-transparent [&:hover_.menu-nome]:[-webkit-text-stroke:1.5px_var(--void)] [&:focus-visible_.menu-nome]:text-transparent [&:focus-visible_.menu-nome]:[-webkit-text-stroke:1.5px_var(--void)]"
              >
                <span className="font-terciaria text-mono-reg tabular-nums text-void">{doisDigitos(i + 1)}</span>
                <span className="block min-w-0 break-words overflow-y-clip pt-[0.15em] -mt-[0.15em]">
                  <span
                    className={`menu-nome block transition-transform duration-700 ease-(--ease-expo) motion-reduce:transition-none ${mostrar ? "translate-y-0" : "translate-y-[160%]"}`}
                    style={{ transitionDelay: mostrar ? `${350 + i * 60}ms` : "0ms" }}
                  >
                    {NOMES[id] ?? secoesPorId[id].rotulo}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );

  return (
    <>
      <a
        ref={acionador}
        href="#menu"
        className="flex flex-col gap-[6px] w-6 h-8 pt-2 mr-2 cursor-pointer text-bone"
        aria-label="Abrir menu"
        aria-expanded={aberto}
        aria-controls="menu"
        onClick={(e) => {
          // Sem isto o Lenis (`anchors`) trataria `#menu` como rolagem e o navegador mudaria o hash.
          e.preventDefault();
          e.stopPropagation();
          destino.current = null;
          definirAberto(true);
        }}
      >
        <span className="block h-px w-full bg-current origin-top scale-y-110" />
        <span className="block h-px w-full bg-current origin-top scale-y-110" />
        <span className="block h-px w-full bg-current origin-top scale-y-110" />
      </a>

      {montado ? createPortal(painel, document.body) : painel}
    </>
  );
}
