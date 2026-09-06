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
    <aside className="consentimento" aria-label="Aviso de cookies">
      <div className="consentimento__corpo">
        <p className="caption prosa">
          Usamos cookies para saber de qual anúncio você veio. Sem o aceite, a
          página funciona igual e nada é enviado.
        </p>
        <div className="consentimento__acoes">
          <button
            type="button"
            className="botao-secundario label"
            onClick={() => responder(false)}
          >
            Recusar
          </button>
          <button
            type="button"
            className="botao-secundario botao-secundario--forte label"
            onClick={() => responder(true)}
          >
            Aceitar
          </button>
        </div>
      </div>
    </aside>
  );
}
