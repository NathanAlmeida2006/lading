import { useSyncExternalStore } from "react";
import { ler, gravar } from "./armazenamento.js";

const CHAVE_CONSENTIMENTO = "fluor:consentimento";

/* -------------------------------------------------------------------------
   Consentimento
   ------------------------------------------------------------------------- */

// No servidor e na hidratacao vale "sem aviso e sem doca": a resposta real so se le no navegador.
const respostaNoServidor = () => false;

export function criarConsentimento() {
  let consentimento; // undefined = ainda nao lido; depois true | false | null (sem resposta)
  const assinantes = new Set();

  /** true | false | null. Valor estavel entre chamadas: serve de snapshot a `useSyncExternalStore`. */
  function lerConsentimento() {
    if (consentimento === undefined) {
      const guardado = ler(CHAVE_CONSENTIMENTO);
      consentimento = typeof guardado === "boolean" ? guardado : null;
    }
    return consentimento ?? null;
  }

  /** Avisa quando o visitante responde. Devolve o cancelamento. */
  function assinarConsentimento(assinante) {
    assinantes.add(assinante);
    return () => assinantes.delete(assinante);
  }

  /** A resposta (true | false | null) para os componentes: o aviso e a doca leem daqui. */
  function useConsentimento() {
    return useSyncExternalStore(assinarConsentimento, lerConsentimento, respostaNoServidor);
  }

  /** A unica porta de entrada da resposta: grava, e quem assina (aviso, doca, alcance) reage. */
  function responderConsentimento(aceitou) {
    consentimento = aceitou === true;
    gravar(CHAVE_CONSENTIMENTO, consentimento);
    for (const assinante of [...assinantes]) {
      try { assinante(); } catch (erro) { console.error(erro); }
    }
  }

  return { lerConsentimento, assinarConsentimento, useConsentimento, responderConsentimento };
}
