import { useEffect, useRef, useState } from "react";
import { CONFIG } from "../../infra/config.js";
import { answerConsent, useConsent } from "../../infra/instrumentation.js";
import { getDocumentUrl } from "../../infra/validation.js";

/**
 * Consentimento antes do evento de terceiro (RNF-L23).
 *
 * O pixel da Meta, o PostHog e o Clarity (que grava a sessao) nao carregam sozinhos: esperam o aceite (o orquestrador
 * esta em instrumentation.js, nao aqui). O texto e curto e leva a politica de privacidade, que diz o que cada um faz: o
 * texto e o consentimento tudo ou nada foram mantidos pelo gerente em 22/11/2026. "Apenas essenciais" e uma opcao de peso igual a "Aceitar" (os dois em contorno, mesma classe) na tela,
 * e nao um link cinza no canto - o padrao escuro custaria mais em confianca do que rende em evento.
 *
 * Renderiza `null` no primeiro passe para nao divergir do HTML pre-renderizado
 * (o servidor nao sabe o que este visitante ja respondeu).
 */
const SHOW_DELAY_MS = 1500;

const BUTTON =
  "flex-1 inline-flex items-center justify-center min-h-12 px-4 py-3 border rounded-xs cursor-pointer text-center " +
  "font-secundaria text-label uppercase bg-transparent text-bone border-bone";

const PRIVACY_URL = getDocumentUrl(CONFIG.legal.politicaPrivacidade);

/**
 * @returns {JSX.Element|null} Nada depois de respondido; o aviso enquanto a resposta nao existe.
 */
export function ConsentBanner() {
  // A resposta mora em instrumentation.js, que tambem decide o pixel: aqui so se pergunta e se le.
  const answer = useConsent();
  const isDecided = answer !== null;

  // O aviso espera 1,5 s para nao brigar com a primeira dobra.
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);
  const isVisible = isReady && !isDecided;

  // A folga evita que o aviso, preso na base da tela, cubra o fim da pagina. O texto muda de altura com a largura da
  // tela, entao a folga acompanha a altura medida do aviso (`--consentimento-altura`, lida pelo index.html).
  const banner = useRef(null);
  useEffect(() => {
    document.body.classList.toggle("com-consentimento", isVisible);
    const node = banner.current;
    const style = document.documentElement.style;
    const observer = node && new ResizeObserver(() => style.setProperty("--consentimento-altura", `${Math.ceil(node.getBoundingClientRect().height)}px`));
    observer?.observe(node);
    return () => {
      observer?.disconnect();
      style.removeProperty("--consentimento-altura");
      document.body.classList.remove("com-consentimento");
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <aside
      ref={banner}
      className="fixed inset-x-0 bottom-0 z-20 px-4 pt-3 pb-[max(--spacing(3),env(safe-area-inset-bottom))] sm:pt-4 sm:pb-[max(--spacing(4),env(safe-area-inset-bottom))] bg-surface-1 border-t border-line-strong animate-sobe motion-reduce:animate-none"
      aria-label="Aviso de cookies"
    >
      <div className="flex flex-col gap-2 max-w-240 mx-auto sm:flex-row sm:items-center sm:gap-6">
        <p className="font-terciaria text-body text-center sm:text-left sm:flex-1 max-w-prose">
          Usamos cookies e métricas para melhorar sua visita.
          {PRIVACY_URL && (
            <>
              {" "}Veja a <a className="underline underline-offset-4" href={PRIVACY_URL}>Privacidade</a>.
            </>
          )}
        </p>
        <div className="grid grid-cols-2 gap-3 sm:flex-none">
          <button type="button" className={BUTTON} onClick={() => answerConsent(false)}>
            Apenas essenciais
          </button>
          <button type="button" className={BUTTON} onClick={() => answerConsent(true)}>
            Aceitar
          </button>
        </div>
      </div>
    </aside>
  );
}
