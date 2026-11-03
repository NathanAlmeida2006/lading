import { useMovimento } from "./index.js";

/** Pilha de cartas (Espelho): solta a pilha (`data-solta`) quando algum card nao cabe inteiro na janela. */
export function usePilhaDeCartas(raiz, lista) {
  useMovimento(() => {
    const no = raiz.current;
    if (!no) return;
    // A pilha so serve se cada card, grudado no seu degrau, cabe inteiro na janela: senao
    // ela SOLTA (`data-solta`) e os cards seguem em fila. So se mede com o grude ligado: sob
    // movimento reduzido o `top` e `auto`, a conta vira NaN e a pilha continua como esta.
    const pilha = lista.current;
    const cartas = [...no.querySelectorAll(".carta")];
    const medir = () => {
      pilha.removeAttribute("data-solta");
      const cabe = cartas.every((carta, i) =>
        i === cartas.length - 1 || !(parseFloat(getComputedStyle(carta).top) + carta.offsetHeight > window.innerHeight));
      pilha.toggleAttribute("data-solta", !cabe);
    };
    // So a LARGURA reage: a barra do navegador no celular muda a altura a cada rolagem.
    let largura = window.innerWidth;
    const aoRedimensionar = () => {
      if (window.innerWidth === largura) return;
      largura = window.innerWidth;
      medir();
    };
    let ativo = true;
    medir();
    document.fonts.ready.then(() => { if (ativo) medir(); });
    window.addEventListener("resize", aoRedimensionar);
    return () => {
      ativo = false;
      window.removeEventListener("resize", aoRedimensionar);
    };
  }, []);
}
