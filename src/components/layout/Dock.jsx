import { useEffect, useRef, useState } from "react";
import { CtaButton } from "../ui/CtaButton.jsx";
import { Countdown } from "../ui/Countdown.jsx";
import { useConsent } from "../../infra/instrumentation.js";
import { READY_VALUE_STACK } from "../../content/valueStack.js";
import { CONTENT } from "../../content/content.js";

/** A barra fixa de venda na base da pagina. */
const DOCK_BAR =
  "doca hidden js:flex fixed inset-x-0 bottom-0 z-15 flex-wrap items-center justify-between gap-3 " +
  "pl-[max(--spacing(4),env(safe-area-inset-left))] pr-[max(--spacing(4),env(safe-area-inset-right))] " +
  "pt-3 pb-[max(--spacing(3),env(safe-area-inset-bottom))] bg-surface-1 text-bone border-t border-line-strong " +
  "translate-y-full opacity-0 transition-[translate,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] " +
  "[.com-consentimento_&]:hidden data-ativa:translate-y-0 data-ativa:opacity-100";

/**
 * A doca de venda: barra fixa na base, com preco, Pix e o botao.
 *
 * Vem da barra flutuante do Nakula e da barra fixa do Kora, que sacrificam a
 * navegacao constante em troca de um CTA sempre visivel. Aqui nao ha
 * navegacao a sacrificar (RF-L01), entao a troca e so ganho.
 *
 * Ela e o CTA de quando nao ha CTA: so entra na janela do meio da pagina, com a dobra, a regua do
 * manifesto, a pilha de valor, o botao do fechamento e o rodape fora da tela, e nunca com o aviso de
 * cookies aberto. Os botoes do espelho, do mapa e da oferta NAO sao observados: com eles a doca pode
 * dividir a tela (pendencia B3, decisao do gerente). Entra e sai deslizando, com
 * ease suave de 500 ms. Tres coisas que ela NAO faz, cada uma uma trava: nenhuma barra
 * de progresso (o §3.5 proibe), o rotulo nao troca com a secao (RF-L10), e sem
 * JavaScript ela nao existe (`hidden js:flex`). Uma doca em CSS puro comeria
 * 56px da primeira tela e derrubaria o RF-L09 justamente em quem chega pelo
 * anuncio.
 *
 * A decisao le so a geometria da rolagem, nunca o estado da propria doca: ela e fixa, nao
 * empurra o conteudo, e o botao dela fica fora dos alvos. Um botao que sobe por tras da doca ja
 * conta como "a vista" e a recolhe; nao ha como a entrada dela realimentar o observador.
 *
 * Falha fechada: sem os alvos, ou antes da primeira leitura, fica oculta.
 * Os alvos sao os que levam `data-oculta-doca`; faltar um deles tira so aquele alvo.
 *
 * Inativa, ela e `inert`: so sai da tela por `translate`, e sem isso o Tab cairia
 * num botao que ninguem ve.
 * @returns {JSX.Element} A barra de venda; inativa, ela fica inerte e fora da tela.
 */
export function Dock() {
  const dock = useRef(null);
  const [isFree, setIsFree] = useState(false); // nenhum alvo ocupa a tela
  // Os botoes de venda ficam sempre na pagina, entao a lista de alvos e fixa.
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
      { threshold: 0 }, // qualquer pixel do alvo na tela esconde a doca; a regua e alta, 12% dela ainda cobria a janela
    );
    targets.forEach((target) => observer.observe(target));
    return () => {
      observer.disconnect();
      setIsFree(false);
    };
  }, []);

  // O indice e o espaco de rolagem acompanham a altura real da barra, inclusive com zoom ou safe-area.
  useEffect(() => {
    const bar = dock.current;
    const style = document.documentElement.style;
    // Oculta pelo consentimento, a barra mede 0: vale a ultima medida.
    const resizeObserver = new ResizeObserver(() => {
      const height = bar.getBoundingClientRect().height;
      if (height > 0) style.setProperty("--doca-altura", `${Math.ceil(height)}px`);
    });
    resizeObserver.observe(bar);
    return () => {
      resizeObserver.disconnect();
      style.removeProperty("--doca-altura");
    };
  }, []);

  // A classe `com-doca` no <body> ativa a reserva de espaco do indice e das ancoras.
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
      <div className="flex flex-col gap-1 min-w-0 max-w-full text-silver">
        <span className="font-secundaria text-label uppercase text-bone">{CONTENT.doca.rotulo}</span>
        <div className="font-terciaria text-mono-reg tabular-nums whitespace-nowrap">
          {READY_VALUE_STACK ? `${READY_VALUE_STACK.moeda} ${READY_VALUE_STACK.oferta.preco} · Pix à vista` : "Pix à vista · preço a definir"}
        </div>
      </div>
      {READY_VALUE_STACK ? <Countdown className="ml-auto text-mono-reg [&>span]:hidden" /> : null}
      <CtaButton position="doca" isCompact />
    </aside>
  );
}
