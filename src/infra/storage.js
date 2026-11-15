/* -------------------------------------------------------------------------
   sessionStorage e localStorage tolerantes
   ------------------------------------------------------------------------- */

/**
 * Lê um valor JSON de um armazenamento do navegador. Sem valor, ou com falha de leitura ou de decodificação, devolve `null`.
 * @param {"sessionStorage"|"localStorage"} store - Armazenamento lido.
 * @param {string} key - Chave gravada.
 * @returns {unknown} O valor decodificado, ou `null`.
 */
function readValue(store, key) {
  try {
    const raw = window[store].getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Grava um valor como JSON em um armazenamento do navegador. Falha de gravação é engolida: a página segue funcionando.
 * @param {"sessionStorage"|"localStorage"} store - Armazenamento gravado.
 * @param {string} key - Chave a gravar.
 * @param {unknown} value - Valor a gravar, serializado como JSON.
 * @returns {void}
 */
function writeValue(store, key, value) {
  try {
    window[store].setItem(key, JSON.stringify(value));
  } catch {
    /* navegacao anonima ou storage bloqueado: a pagina segue funcionando */
  }
}

/**
 * Lê um valor JSON do sessionStorage. Sem valor, ou com falha de leitura ou de decodificação, devolve `null`.
 * @param {string} key - Chave gravada no sessionStorage.
 * @returns {unknown} O valor decodificado, ou `null`.
 */
export const readSessionValue = (key) => readValue("sessionStorage", key);

/**
 * Grava um valor como JSON no sessionStorage. Falha de gravação é engolida: a página segue funcionando.
 * @param {string} key - Chave do sessionStorage.
 * @param {unknown} value - Valor a gravar, serializado como JSON.
 * @returns {void}
 */
export const writeSessionValue = (key, value) => writeValue("sessionStorage", key, value);

/**
 * Lê um valor JSON do localStorage. Sem valor, ou com falha de leitura ou de decodificação, devolve `null`.
 * @param {string} key - Chave gravada no localStorage.
 * @returns {unknown} O valor decodificado, ou `null`.
 */
export const readLocalValue = (key) => readValue("localStorage", key);

/**
 * Grava um valor como JSON no localStorage. Falha de gravação é engolida: a página segue funcionando.
 * @param {string} key - Chave do localStorage.
 * @param {unknown} value - Valor a gravar, serializado como JSON.
 * @returns {void}
 */
export const writeLocalValue = (key, value) => writeValue("localStorage", key, value);

/**
 * Regra do fim da promoção guardado: só vale número finito, positivo e a no máximo `duration` de agora.
 * Fim que já passou continua valendo (a promoção encerrada não recomeça ao recarregar). Fim mais longe que a
 * duração é relógio errado ou valor adulterado; quem chama recalcula como na primeira visita.
 * @param {unknown} saved - O que veio do localStorage.
 * @param {number} now - Instante de agora, em ms.
 * @param {number} duration - Duração da promoção, em ms.
 * @returns {number|null} O fim guardado, ou `null` quando não vale.
 */
export function getValidPromotionEnd(saved, now, duration) {
  return typeof saved === "number" && Number.isFinite(saved) && saved > 0 && saved <= now + duration ? saved : null;
}
