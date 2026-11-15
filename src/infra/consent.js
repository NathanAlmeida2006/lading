import { useSyncExternalStore } from "react";
import { readSessionValue, writeSessionValue } from "./storage.js";

const CONSENT_STORAGE_KEY = "fluor:consentimento";

/* -------------------------------------------------------------------------
   Consentimento
   ------------------------------------------------------------------------- */

// No servidor e na hidratacao vale "sem aviso e sem doca": a resposta real so se le no navegador.
const getServerConsent = () => false;

/**
 * Fábrica do consentimento: guarda a resposta do visitante e avisa os assinantes quando ela muda.
 * @returns {{readConsent: () => (boolean|null), subscribeToConsent: (subscriber: () => void) => () => void, useConsent: () => (boolean|null), answerConsent: (accepted: unknown) => void}} A porta do consentimento.
 */
export function createConsent() {
  let consent; // undefined = ainda nao lido; depois true | false | null (sem resposta)
  const subscribers = new Set();

  /**
   * true | false | null. Valor estavel entre chamadas: serve de snapshot a `useSyncExternalStore`.
   * @returns {boolean|null} A resposta gravada, ou `null` quando o visitante ainda não respondeu.
   */
  function readConsent() {
    if (consent === undefined) {
      const stored = readSessionValue(CONSENT_STORAGE_KEY);
      consent = typeof stored === "boolean" ? stored : null;
    }
    return consent ?? null;
  }

  /**
   * Avisa quando o visitante responde. Devolve o cancelamento.
   * @param {() => void} subscriber - Função chamada a cada resposta do visitante.
   * @returns {() => void} Cancela a assinatura.
   */
  function subscribeToConsent(subscriber) {
    subscribers.add(subscriber);
    return () => subscribers.delete(subscriber);
  }

  /**
   * A resposta (true | false | null) para os componentes: o aviso e a doca leem daqui.
   * @returns {boolean|null} A resposta atual do visitante.
   */
  function useConsent() {
    return useSyncExternalStore(subscribeToConsent, readConsent, getServerConsent);
  }

  /**
   * A unica porta de entrada da resposta: grava, e quem assina (aviso, doca, alcance) reage.
   * Qualquer valor que não seja `true` conta como recusa.
   * @param {unknown} accepted - `true` quando o visitante aceitou; qualquer outro valor é recusa.
   * @returns {void}
   */
  function answerConsent(accepted) {
    consent = accepted === true;
    writeSessionValue(CONSENT_STORAGE_KEY, consent);
    for (const subscriber of [...subscribers]) {
      try { subscriber(); } catch (error) { console.error(error); }
    }
  }

  return { readConsent, subscribeToConsent, useConsent, answerConsent };
}
