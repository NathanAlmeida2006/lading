import { useEffect, useSyncExternalStore } from "react";
import {
  assinarConsentimento,
  lerConsentimento,
  responderConsentimento,
} from "../instrumentacao.js";

/**
 * Consentimento antes do evento de terceiro (RNF-L23).
 *
 * O pixel nao carrega sozinho: ele espera o aceite. Recusar e uma opcao de
 * peso igual (os dois em contorno) na tela, e nao um link cinza no canto - o padrao escuro custaria
 * mais em confianca do que rende em evento.
 *
 * Renderiza `null` no primeiro passe para nao divergir do HTML pre-renderizado
 * (o servidor nao sabe o que este visitante ja respondeu).
 */
const BOTAO =
  "flex-1 inline-flex items-center justify-center min-h-12 px-4 py-3 border rounded-xs cursor-pointer " +
  "font-secundaria text-label uppercase bg-transparent text-bone border-bone";

// No servidor e na hidratacao o aviso nao existe; a resposta real so se le no navegador.
const semAvisoNoServidor = () => false;

export function Consentimento() {
  // A resposta mora em instrumentacao.js, que tambem decide o pixel: aqui so se pergunta e se le.
  const resposta = useSyncExternalStore(assinarConsentimento, lerConsentimento, semAvisoNoServidor);
  const decidido = resposta !== null;

  // O banner e fixed: sem esta folga ele cobre o micro-registro do botao,
  // que e onde estao preco e garantia.
  useEffect(() => {
    document.body.classList.toggle("com-consentimento", !decidido);
    return () => document.body.classList.remove("com-consentimento");
  }, [decidido]);

  if (decidido) return null;

  return (
    <aside
      className="fixed inset-x-0 bottom-0 z-20 px-4 pt-3 pb-[max(--spacing(3),env(safe-area-inset-bottom))] sm:pt-4 sm:pb-[max(--spacing(4),env(safe-area-inset-bottom))] bg-surface-1 border-t border-line-strong"
      aria-label="Aviso de cookies"
    >
      <div className="flex flex-col gap-2 max-w-180 mx-auto sm:flex-row sm:items-center sm:gap-3">
        <p className="font-terciaria text-caption max-w-prose">
          Cookies medem de qual anúncio você veio.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:flex-none">
          <button type="button" className={BOTAO} onClick={() => responderConsentimento(false)}>
            Recusar
          </button>
          <button type="button" className={BOTAO} onClick={() => responderConsentimento(true)}>
            Aceitar
          </button>
        </div>
      </div>
    </aside>
  );
}
