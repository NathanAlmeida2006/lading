import { useEffect, useState } from "react";
import { answerConsent, useConsent } from "../../infra/instrumentation.js";

/**
 * Consentimento antes do evento de terceiro (RNF-L23).
 *
 * O pixel e o Clarity nao carregam sozinhos: esperam o aceite. Recusar e uma opcao de
 * peso igual (os dois em contorno) na tela, e nao um link cinza no canto - o padrao escuro custaria
 * mais em confianca do que rende em evento.
 *
 * Renderiza `null` no primeiro passe para nao divergir do HTML pre-renderizado
 * (o servidor nao sabe o que este visitante ja respondeu).
 */
const SHOW_DELAY_MS = 3000;

const BUTTON =
  "flex-1 inline-flex items-center justify-center min-h-12 px-4 py-3 border rounded-xs cursor-pointer " +
  "font-secundaria text-label uppercase bg-transparent text-bone border-bone";

/**
 * @returns {JSX.Element|null} Nada depois de respondido; o aviso enquanto a resposta nao existe.
 */
export function ConsentBanner() {
  // A resposta mora em instrumentation.js, que tambem decide o pixel: aqui so se pergunta e se le.
  const answer = useConsent();
  const isDecided = answer !== null;

  // O aviso espera 3 s para nao brigar com a primeira dobra.
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);
  const isVisible = isReady && !isDecided;

  // A folga evita que o aviso, preso na base da tela, cubra o fim da pagina.
  useEffect(() => {
    document.body.classList.toggle("com-consentimento", isVisible);
    return () => document.body.classList.remove("com-consentimento");
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <aside
      className="fixed inset-x-0 bottom-0 z-20 px-4 pt-3 pb-[max(--spacing(3),env(safe-area-inset-bottom))] sm:pt-4 sm:pb-[max(--spacing(4),env(safe-area-inset-bottom))] bg-surface-1 border-t border-line-strong animate-sobe motion-reduce:animate-none"
      aria-label="Aviso de cookies"
    >
      <div className="flex flex-col gap-2 max-w-180 mx-auto sm:flex-row sm:items-center sm:gap-3">
        <p className="font-terciaria text-body text-center sm:flex-1 max-w-prose">
          Aceitar cookies no site?
        </p>
        <div className="grid grid-cols-2 gap-3 sm:flex-none">
          <button type="button" className={BUTTON} onClick={() => answerConsent(false)}>
            Recusar
          </button>
          <button type="button" className={BUTTON} onClick={() => answerConsent(true)}>
            Aceitar
          </button>
        </div>
      </div>
    </aside>
  );
}
