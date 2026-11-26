// O primeiro efeito de seção pede o chunk depois da hidratação.
let loading;

/**
 * Carrega o chunk de coreografias uma vez; chamadas seguintes reaproveitam a mesma promessa.
 * @returns {Promise<object>} Módulo com as coreografias.
 * @throws {Error} Quando o chunk não carrega (o erro é registrado uma vez, aqui).
 */
export function loadChoreographies() {
  if (!loading) {
    loading = import("./choreographies.js").catch((error) => {
      loading = undefined;
      // Diagnóstico da tentativa: um só, aqui. Os consumidores que esperam esta mesma promessa
      // recebem a rejeição e só liberam a leitura (index.js), sem repetir o registro.
      console.error(
        "Falha ao carregar o chunk de coreografias; a leitura segue sem movimento.",
        error,
      );
      throw error;
    });
  }
  return loading;
}
