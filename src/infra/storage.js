/* -------------------------------------------------------------------------
   sessionStorage tolerante
   ------------------------------------------------------------------------- */

/**
 * Lê um valor JSON do sessionStorage. Sem valor, ou com falha de leitura ou de decodificação, devolve `null`.
 * @param {string} key - Chave gravada no sessionStorage.
 * @returns {unknown} O valor decodificado, ou `null`.
 */
export function readSessionValue(key) {
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Grava um valor como JSON no sessionStorage. Falha de gravação é engolida: a página segue funcionando.
 * @param {string} key - Chave do sessionStorage.
 * @param {unknown} value - Valor a gravar, serializado como JSON.
 * @returns {void}
 */
export function writeSessionValue(key, value) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* navegacao anonima ou storage bloqueado: a pagina segue funcionando */
  }
}
