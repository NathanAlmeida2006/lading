import { useEffect, useRef, useState } from "react";
import { CONFIG } from "../../infra/config.js";
import { answerConsent, useConsent } from "../../infra/instrumentation.js";
import { getDocumentUrl } from "../../infra/validation.js";

/**
 * Consentimento antes do evento de terceiro (RNF-L23).
 *
 * O Clarity (sessão e mapa de calor) e o PostHog (funil) carregam já no início, anônimos e sem cookies; o aceite só libera os
 * cookies deles. O pixel da Meta (marketing) continua esperando o aceite (o orquestrador está em instrumentation.js, não aqui).
 *
 * É um `<dialog>` modal com a página apagada atrás (pedido do gerente em 25/11/2026): só sai com uma resposta. "Recusar cookies"
 * é um botão do mesmo tamanho de "Aceitar cookies" (um em contorno, outro cheio), e não um link cinza no canto - o padrão
 * escuro custaria mais em confiança do que rende em evento. O consentimento continua tudo ou nada.
 *
 * Renderiza `null` no primeiro passe para não divergir do HTML pré-renderizado
 * (o servidor não sabe o que este visitante já respondeu).
 */
const SHOW_DELAY_MS = 1500;

const BUTTON =
  "inline-flex items-center justify-center min-h-14 px-6 py-4 border rounded-xs cursor-pointer text-center " +
  "font-secondary text-label uppercase text-bone";

const PRIVACY_URL = getDocumentUrl(CONFIG.legal.privacyPolicy);

/**
 * @returns {JSX.Element|null} Nada depois de respondido; o aviso enquanto a resposta não existe.
 */
export function ConsentBanner() {
  // A resposta mora em instrumentation.js, que também decide o pixel: aqui só se pergunta e se lê.
  const answer = useConsent();
  const isDecided = answer !== null;

  // O aviso espera 1,5 s para não brigar com a primeira dobra.
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);
  const isVisible = isReady && !isDecided;

  // `showModal` entrega de graça o fundo apagado, o bloqueio de cliques e o foco preso.
  const dialog = useRef(null);
  useEffect(() => {
    if (!isVisible) return;
    dialog.current.showModal();
    dialog.current.querySelector("button").focus(); // o foco começa em "Recusar", não no link
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <dialog
      ref={dialog}
      // Esc não responde pela pessoa. O Chrome fecha no segundo Esc mesmo assim: aí o aviso reabre.
      onCancel={(event) => event.preventDefault()}
      onClose={(event) => event.currentTarget.showModal()}
      className="mt-auto mb-[max(--spacing(3),env(safe-area-inset-bottom))] mx-auto w-[calc(100%-var(--spacing)*6)] max-w-220 max-h-[calc(100dvh-var(--spacing)*6)] overflow-y-auto overscroll-contain p-6 sm:p-8 bg-surface-1 text-bone border border-line-strong rounded-xs backdrop:bg-[rgb(0_0_0/0.73)] animate-rise motion-reduce:animate-none"
      aria-label="Aviso de cookies"
      data-lenis-prevent
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
        <div className="flex flex-col items-start gap-3 sm:flex-1">
          <p className="font-secondary text-overline uppercase text-silver">
            Preferências de privacidade
          </p>
          <h2 className="font-secondary text-h2 uppercase">Você aceita cookies?</h2>
          <p className="font-tertiary text-caption text-silver">
            Com seu aceite, usamos cookies de análise completa e de marketing. A medição anônima,
            sem cookies, continua ligada.
          </p>
          {PRIVACY_URL && (
            <a
              className="font-tertiary text-caption underline underline-offset-4"
              href={PRIVACY_URL}
            >
              Ler a política de privacidade
            </a>
          )}
        </div>
        <div className="grid gap-3 sm:flex sm:flex-none">
          <button
            type="button"
            className={`${BUTTON} bg-transparent border-line-strong`}
            onClick={() => answerConsent(false)}
          >
            Recusar cookies
          </button>
          <button
            type="button"
            className={`${BUTTON} bg-accent border-accent`}
            onClick={() => answerConsent(true)}
          >
            Aceitar cookies
          </button>
        </div>
      </div>
    </dialog>
  );
}
