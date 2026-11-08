/* -------------------------------------------------------------------------
   sessionStorage tolerante
   ------------------------------------------------------------------------- */

export function ler(chave) {
  try {
    const bruto = window.sessionStorage.getItem(chave);
    return bruto ? JSON.parse(bruto) : null;
  } catch {
    return null;
  }
}

export function gravar(chave, valor) {
  try {
    window.sessionStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    /* navegacao anonima ou storage bloqueado: a pagina segue funcionando */
  }
}
