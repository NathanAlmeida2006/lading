import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { INDEX_SECTION_IDS, SECTIONS_BY_ID } from "../../content/sections.js";
import { padTwoDigits, ENVELOPE } from "../../app/ui.js";
import { Wordmark } from "../ui/Wordmark.jsx";

/** Link de cada seção na lista do menu em tela cheia. */
const MENU_LINK =
  "flex items-baseline gap-4 py-[clamp(6px,1.5svh,18px)] text-void font-secondary " +
  "text-[length:clamp(2.5rem,4.5vw,3.5rem)] leading-none tracking-[0.02em] font-extrabold uppercase " +
  "transition-transform duration-300 ease-(--ease-expo) hover:translate-x-4 focus-visible:translate-x-4 " +
  "[&:hover_.menu-nome]:text-transparent [&:hover_.menu-nome]:[-webkit-text-stroke:1.5px_var(--void)] " +
  "[&:focus-visible_.menu-nome]:text-transparent [&:focus-visible_.menu-nome]:[-webkit-text-stroke:1.5px_var(--void)]";

const SECTION_NAMES = { inicio: "Início" };

/**
 * Menu em tela cheia: botão na dobra, lista numerada das seções presentes.
 * Os links são `#id` simples; o Lenis (`anchors: true`) faz a rolagem, e a página só precisa
 * fechar o menu. `data-lenis-prevent` + overflow travado impedem a página de rolar por baixo.
 * @returns {JSX.Element} O acionador e o diálogo do menu (o diálogo vai ao body quando montado).
 */
export function Menu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const closeButton = useRef(null);
  const trigger = useRef(null);
  const dialog = useRef(null);
  const destination = useRef(null);

  useEffect(() => {
    setIsMounted(true);
    // Aberto antes de hidratar (alvo nativo `#menu`): segue aberto, sem salto nem fechamento.
    if (location.hash === "#menu") {
      history.replaceState(null, "", location.pathname + location.search);
      setIsOpen(true);
    }
  }, []);

  // Antes de montar (HTML estático, bundle lento ou ausente) o menu é CSS puro: o acionador é um
  // link para `#menu`, o diálogo vai inline e abre por `:target`, e Fechar é um link para a dobra.
  // Os links do índice já são `#id` nativos. Estado revelado, porque só é visível quando alvo.
  const isVisible = isOpen || !isMounted;
  const CloseTag = isMounted ? "button" : "a";

  useLayoutEffect(() => {
    if (!isOpen) return;
    const menu = dialog.current;
    if (!menu) return;

    // O portal é irmão da raiz React: o `inert` dos irmãos também contém o foco e isola o próprio modal.
    const background = [...document.body.children].filter((element) => element !== menu);
    for (const element of background) element.inert = true;
    const scrollRoots = [document.documentElement, document.body];
    for (const element of scrollRoots) element.style.overflow = "hidden";

    const handleKey = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setIsOpen(false);
    };
    document.addEventListener("keydown", handleKey, true);
    closeButton.current?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener("keydown", handleKey, true);
      for (const element of background) element.inert = false;
      for (const element of scrollRoots) element.style.removeProperty("overflow");
      const node = destination.current
        ? document.getElementById(destination.current)
        : trigger.current; // eslint-disable-line react-hooks/exhaustive-deps -- trigger.current é lido na limpeza de propósito: o foco volta ao nó atual, e isConnected descarta no trocado
      if (!node?.isConnected) return;
      const tabIndex = node.getAttribute("tabindex");
      if (destination.current && tabIndex === null) node.setAttribute("tabindex", "-1");
      node.focus({ preventScroll: true });
      if (destination.current && tabIndex === null) node.removeAttribute("tabindex");
    };
  }, [isOpen]);

  const panel = (
    <div
      ref={dialog}
      id="menu"
      role="dialog"
      aria-modal="true"
      aria-label="Menu de navegação"
      data-lenis-prevent
      inert={isMounted ? !isOpen : undefined}
      style={isMounted ? { clipPath: isOpen ? "inset(0 0 0 0)" : "inset(0 0 100% 0)" } : undefined}
      className={`fixed inset-0 z-100 flex flex-col py-4 lg:py-8 bg-accent text-void transition-[clip-path] duration-700 ease-(--ease-expo) ${isMounted ? (isOpen ? "" : "pointer-events-none") : "invisible target:visible"}`}
    >
      {/* Espelha a linha do cabeçalho da dobra (mesmo envelope, wordmark invisível como medida): o X
          cai sobre as três barras em qualquer largura, sem coordenada congelada. */}
      <div className={`${ENVELOPE} flex-none flex items-center justify-between gap-4`}>
        <div aria-hidden="true">
          <Wordmark isReference className="block w-33 invisible" />
        </div>
        <CloseTag
          ref={closeButton}
          {...(isMounted
            ? { type: "button", onClick: () => setIsOpen(false) }
            : { href: "#inicio" })}
          aria-label="Fechar menu"
          className="relative z-1 w-12 h-12 -my-2 -mr-1 cursor-pointer text-void"
        >
          <span className="absolute top-[23px] left-3 right-3 h-px bg-current origin-center rotate-45 scale-y-110" />
          <span className="absolute top-[23px] left-3 right-3 h-px bg-current origin-center -rotate-45 scale-y-110" />
        </CloseTag>
      </div>

      <nav
        className={`${ENVELOPE} flex-1 flex flex-col min-h-0 overflow-y-auto`}
        aria-label="Navegação principal"
      >
        <ol className="w-full flex flex-col my-auto">
          {INDEX_SECTION_IDS.map((id, index) => (
            <li key={id} className="relative">
              <span
                aria-hidden="true"
                className={`absolute top-0 inset-x-0 h-px bg-void origin-left transition-transform duration-700 ease-(--ease-expo) ${isVisible ? "scale-x-100" : "scale-x-0"}`}
                style={{ transitionDelay: isVisible ? `${300 + index * 60}ms` : "0ms" }}
              />
              <a
                href={`#${id}`}
                onClick={() => {
                  destination.current = id;
                  // Liberar o fundo antes de o evento chegar ao Lenis ou a âncora nativa.
                  flushSync(() => setIsOpen(false));
                }}
                className={MENU_LINK}
              >
                <span className="font-tertiary text-mono-reg tabular-nums text-void">
                  {padTwoDigits(index + 1)}
                </span>
                <span className="block min-w-0 break-words overflow-y-clip pt-[0.15em] -mt-[0.15em]">
                  <span
                    className={`menu-nome block transition-transform duration-700 ease-(--ease-expo) ${isVisible ? "translate-y-0" : "translate-y-[160%]"}`}
                    style={{ transitionDelay: isVisible ? `${350 + index * 60}ms` : "0ms" }}
                  >
                    {SECTION_NAMES[id] ?? SECTIONS_BY_ID[id].label}
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
        ref={trigger}
        href="#menu"
        className="flex flex-col gap-[6px] w-6 h-8 pt-2 mr-2 cursor-pointer text-bone"
        aria-label="Abrir menu"
        aria-expanded={isOpen}
        aria-controls="menu"
        onClick={(event) => {
          // Sem isto o Lenis (`anchors`) trataria `#menu` como rolagem e o navegador mudaria o hash.
          event.preventDefault();
          event.stopPropagation();
          destination.current = null;
          setIsOpen(true);
        }}
      >
        <span className="block h-px w-full bg-current origin-top scale-y-110" />
        <span className="block h-px w-full bg-current origin-top scale-y-110" />
        <span className="block h-px w-full bg-current origin-top scale-y-110" />
      </a>

      {isMounted ? createPortal(panel, document.body) : panel}
    </>
  );
}
