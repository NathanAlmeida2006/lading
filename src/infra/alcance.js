import { config } from "./config.js";

/* -------------------------------------------------------------------------
   Alcance das secoes
   ------------------------------------------------------------------------- */

export function criarAlcance({ assinarConsentimento, pixel }) {
  const { elegivel, carregarPixel, evento } = pixel;
  const enviadas = new Set(); // impressoes de secao ja enviadas nesta carga de pagina

  /**
   * Liga a mensuracao da pagina e devolve o desligamento. `alcance` e o mapa de secoes.js
   * (id -> { etapa, canonico }); RF-L31 le as canonicas, e a oferta vira `ViewContent`:
   * alcanca-la e o unico ponto da pagina que significa interesse pelo produto.
   *
   * Antes do aceite nao existe observador: nada e marcado nem desobservado. No aceite ele e
   * criado, e a primeira entrega do IntersectionObserver e o estado DAQUELE instante: so conta
   * o que esta na tela. O que ja passou nao e retransmitido, e volta a contar se for revisitado.
   * A impressao so entra em `enviadas` depois de o evento ter saido de fato.
   */
  function iniciarMensuracao(alcance = {}) {
    let observador;

    function sincronizar() {
      observador?.disconnect();
      observador = undefined;
      carregarPixel();
      if (!elegivel()) return;
      observador = new IntersectionObserver(
        (entradas) => {
          for (const { isIntersecting, target } of entradas) {
            const id = target.id;
            if (!isIntersecting || enviadas.has(id) || !alcance[id]) continue;
            const { etapa, canonico } = alcance[id];
            const base = { secao: id, etapa };
            const saiu = id === "oferta"
              ? evento("ViewContent", { ...base, campanha: config.campanha })
              : evento("SecaoAlcancada", { ...base, canonico, campanha: config.campanha });
            if (!saiu) continue;
            enviadas.add(id);
            observador?.unobserve(target);
          }
        },
        // 40% DA JANELA, e nao 40% da secao: a oferta (a pilha de valor, que vira ViewContent) e mais alta que a tela, nunca mostra 40% de si
        // de uma vez, e o evento dela nao disparava. A secao conta como alcancada quando o topo dela
        // cruza a marca de 60% da altura da tela, que e o que 40% significava numa secao de uma tela.
        // O 1px tirado do alto descarta o toque de borda: com a secao seguinte exatamente no topo da tela,
        // a anterior encosta em y=0 sem mostrar nada, e o observador a daria como presente no aceite tardio.
        { rootMargin: "-1px 0px -40% 0px", threshold: 0 },
      );
      for (const id of Object.keys(alcance)) {
        const alvo = enviadas.has(id) ? null : document.getElementById(id);
        if (alvo) observador.observe(alvo);
      }
    }

    const cancelar = assinarConsentimento(sincronizar);
    sincronizar();
    return () => {
      cancelar();
      observador?.disconnect();
      observador = undefined;
    };
  }

  return { iniciarMensuracao };
}
