import { useEffect, useState } from "react";
import {
  carregarPixel,
  gravarConsentimento,
  lerConsentimento,
} from "../instrumentacao.js";

/**
 * Consentimento antes do evento de terceiro (RNF-L23).
 *
 * O pixel nao carrega sozinho: ele espera o aceite. Recusar e uma opcao de
 * peso igual na tela, e nao um link cinza no canto - o padrao escuro custaria
 * mais em confianca do que rende em evento.
 *
 * Renderiza `null` no primeiro passe para nao divergir do HTML pre-renderizado
 * (o servidor nao sabe o que este visitante ja respondeu).
 */
const BOTAO =
  "flex-1 inline-flex items-center justify-center min-h-12 px-4 py-3 border rounded-xs cursor-pointer " +
  "font-secundaria text-label uppercase";
const RECUSAR = "bg-transparent text-bone border-line-strong";
const ACEITAR = "bg-bone text-void border-bone";

export function Consentimento() {
  const [decidido, definirDecidido] = useState(true);

  useEffect(() => {
    const resposta = lerConsentimento();
    if (resposta === true) carregarPixel();
    definirDecidido(resposta !== null);
  }, []);

  // O banner e fixed: sem esta folga ele cobre o micro-registro do botao,
  // que e onde estao preco e garantia.
  useEffect(() => {
    document.body.classList.toggle("com-consentimento", !decidido);
    return () => document.body.classList.remove("com-consentimento");
  }, [decidido]);

  if (decidido) return null;

  function responder(aceitou) {
    gravarConsentimento(aceitou);
    if (aceitou) carregarPixel();
    definirDecidido(true);
  }

  return (
    <aside
      className="fixed inset-x-0 bottom-0 z-20 p-4 pb-[max(--spacing(4),env(safe-area-inset-bottom))] bg-surface-1 border-t border-line-strong"
      aria-label="Aviso de cookies"
    >
      <div className="flex flex-col gap-3 max-w-180 mx-auto sm:flex-row sm:items-center">
        <p className="font-terciaria text-caption max-w-prose">
          Usamos cookies para saber de qual anúncio você veio. Sem o aceite, a
          página funciona igual e nada é enviado.
        </p>
        <div className="flex gap-3 sm:flex-none">
          <button type="button" className={`${BOTAO} ${RECUSAR}`} onClick={() => responder(false)}>
            Recusar
          </button>
          <button type="button" className={`${BOTAO} ${ACEITAR}`} onClick={() => responder(true)}>
            Aceitar
          </button>
        </div>
      </div>
    </aside>
  );
}
