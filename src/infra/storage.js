/* -------------------------------------------------------------------------
   Armazenamento do navegador tolerante: sessionStorage, localStorage e cookies
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
 * Expira cookies pelo nome, no host e em cada sufixo de domínio dele. O rastreador grava no domínio registrável
 * (`.exemplo.com.br`) e o navegador só apaga com o mesmo `domain`. Sem lista de sufixos públicos: `domain=com.br` é
 * recusado pelo navegador e não faz mal.
 * @param {string[]} names - Nomes dos cookies.
 * @returns {void}
 */
export function expireCookies(names) {
  try {
    const labels = window.location.hostname.split(".");
    const domains = [undefined, ...labels.slice(0, -1).map((_, i) => labels.slice(i).join("."))];
    for (const name of names) {
      for (const domain of domains) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain ? `; domain=${domain}` : ""}`;
      }
    }
  } catch {
    /* cookie bloqueado: nao ha o que apagar */
  }
}

/**
 * Nomes dos cookies que a página enxerga. Sem acesso, lista vazia.
 * @returns {string[]} Os nomes, na ordem de `document.cookie`.
 */
export function readCookieNames() {
  try {
    return String(document.cookie ?? "").split(";").map((pair) => pair.split("=")[0].trim()).filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Remove de um armazenamento do navegador as chaves que `matches` aceita. Storage bloqueado: nada a remover.
 * @param {"sessionStorage"|"localStorage"} store - Armazenamento limpo.
 * @param {(key: string) => boolean} matches - Diz se a chave sai.
 * @returns {void}
 */
export function removeStoredValues(store, matches) {
  try {
    const storage = window[store];
    for (let index = storage.length - 1; index >= 0; index--) {
      const key = storage.key(index);
      if (key !== null && matches(key)) storage.removeItem(key);
    }
  } catch {
    /* storage bloqueado: nada a remover */
  }
}
