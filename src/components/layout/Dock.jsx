import { useEffect, useRef, useState } from "react";
import { CtaButton } from "../ui/CtaButton.jsx";
import { useConsent } from "../../infra/instrumentation.js";
import { CONTENT } from "../../content/content.js";

/** A barra fixa de venda na base da página. */
const DOCK_BAR =
  "doca hidden js:flex fixed inset-x-0 bottom-0 z-15 flex-wrap items-center justify-between gap-3 " +
  "pl-[max(--spacing(4),env(safe-area-inset-left))] pr-[max(--spacing(4),env(safe-area-inset-right))] " +
  "pt-3 pb-[max(--spacing(3),env(safe-area-inset-bottom))] bg-surface-1 text-bone border-t border-line-strong " +
  "translate-y-full opacity-0 transition-[translate,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] " +
  "data-ativa:translate-y-0 data-ativa:opacity-100";

/**
 * A doca de venda: barra fixa na base, com a chamada da oferta e o botão.
 *
 * Vem da barra flutuante do Nakula e da barra fixa do Kora, que sacrificam a
 * navegação constante em troca de um CTA sempre visível. Aqui não há
 * navegação a sacrificar (RF-L01), então a troca é só ganho.
 *
 * Ela é o CTA de quando não há CTA: só entra na janela do meio da página, com a dobra, a régua do
 * manifesto, o botão do fechamento e o rodapé fora da tela, e nunca com o aviso de
 * cookies aberto. Os botões do espelho, do mapa e da oferta NÃO são observados: com eles a doca pode
 * dividir a tela (pendência B3, decisão do gerente). Entra e sai deslizando, com
 * ease suave de 500 ms. Três coisas que ela NÃO faz, cada uma uma trava: nenhuma barra
 * de progresso (o §3.5 proíbe), o rótulo não troca com a seção (RF-L10), e sem
 * JavaScript ela não existe (`hidden js:flex`). Uma doca em CSS puro comeria
 * 56px da primeira tela e derrubaria o RF-L09 justamente em quem chega pelo
 * anuncio.
 *
 * A decisão lê só a geometria da rolagem, nunca o estado da própria doca: ela é fixa, não
 * empurra o conteúdo, e o botão dela fica fora dos alvos. Um botão que sobe por trás da doca já
 * conta como "a vista" e a recolhe; não há como a entrada dela realimentar o observador.
 *
 * Falha fechada: sem os alvos, ou antes da primeira leitura, fica oculta.
 * Os alvos são os que levam `data-oculta-doca`; faltar um deles tira só aquele alvo.
 *
 * Inativa, ela é `inert`: só sai da tela por `translate`, e sem isso o Tab cairia
 * num botão que ninguém vê.
 * @returns {JSX.Element} A barra de venda; inativa, ela fica inerte e fora da tela.
 */
export function Dock() {
  const dock = useRef(null);
  const [isFree, setIsFree] = useState(false); // nenhum alvo ocupa a tela
  // Os botões de venda ficam sempre na página, então a lista de alvos é fixa.
  const isConsentOpen = useConsent() === null;
  const isActive = isFree && !isConsentOpen;
  useEffect(() => {
    // Os alvos se declaram: tudo o que carrega `data-oculta-doca` esconde a doca enquanto tiver qualquer pixel na tela.
    const targets = document.querySelectorAll("[data-oculta-doca]");
    if (!targets.length) return; // falha fechada: sem alvos, a doca fica oculta
    const onScreen = new Set();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) onScreen.add(entry.target);
          else onScreen.delete(entry.target);
        }
        setIsFree(onScreen.size === 0);
      },
      { threshold: 0 }, // qualquer pixel do alvo na tela esconde a doca; a régua é alta, 12% dela ainda cobria a janela
    );
    targets.forEach((target) => observer.observe(target));
    return () => {
      observer.disconnect();
      setIsFree(false);
    };
  }, []);

  // O índice e o espaço de rolagem acompanham a altura real da barra, inclusive com zoom ou safe-area.
  useEffect(() => {
    const bar = dock.current;
    const style = document.documentElement.style;
    // Oculta pelo consentimento, a barra mede 0: vale a última medida.
    const resizeObserver = new ResizeObserver(() => {
      const height = bar.getBoundingClientRect().height;
      if (height > 0) style.setProperty("--dock-height", `${Math.ceil(height)}px`);
    });
    resizeObserver.observe(bar);
    return () => {
      resizeObserver.disconnect();
      style.removeProperty("--dock-height");
    };
  }, []);

  // A classe `com-doca` no <body> ativa a reserva de espaço do índice e das âncoras.
  useEffect(() => {
    document.body.classList.toggle("com-doca", isActive);
    return () => document.body.classList.remove("com-doca");
  }, [isActive]);

  return (
    <aside
      ref={dock}
      className={DOCK_BAR}
      data-ativa={isActive ? "" : undefined}
      aria-label="Oferta"
      aria-hidden={!isActive}
      inert={!isActive}
    >
      <p className="w-full xs:w-auto xs:flex-1 min-w-0 text-center text-bone font-secondary text-label uppercase tabular-nums text-balance">
        {CONTENT.dock.text}
      </p>
      <CtaButton position="doca" label={CONTENT.dock.cta} isCompact />
    </aside>
  );
}
