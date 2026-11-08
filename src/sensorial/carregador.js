// O primeiro efeito de seção pede o chunk depois da hidratação.
let carga;

export function carregarCoreografias() {
  if (!carga) {
    carga = import("./coreografias.js").catch((erro) => {
      carga = undefined;
      // Diagnostico da tentativa: um so, aqui. Os consumidores que esperam esta mesma promessa
      // recebem a rejeicao e so liberam a leitura (index.js), sem repetir o registro.
      console.error("Falha ao carregar o chunk de coreografias; a leitura segue sem movimento.", erro);
      throw erro;
    });
  }
  return carga;
}
