import { useRef } from "react";

/**
 * FAQ em acordeao, no layout do Rep Republic: pergunta e marca de mais/menos numa linha com fio
 * embaixo; o item aberto vira um bloco cheio em acento. Todos nascem fechados.
 *
 * `<details>` nativo nao anima a altura, e animar `height` repintava a pagina inteira a cada quadro
 * (o painel de grao do fechamento, com mix-blend-mode, descia junto): medido, Paint e Raster eram
 * quase todo o custo, e o layout nada. Aqui o layout muda UMA vez e o movimento e so de compositor
 * (FLIP): tudo o que vem depois do item translada junto com a abertura, enquanto o proprio item e
 * revelado de cima para baixo por `clip-path`. Fechar mantem o layout aberto ate o fim da animacao,
 * e o `open` so cai la, para o conteudo nao sumir no meio. Cliques em sequencia revertem do ponto
 * em que a animacao esta (ver `animar`).
 * A exclusividade (um aberto por vez) tambem e daqui, para o que fecha animar do mesmo jeito.
 */
const DURACAO = 700;
const CURVA = "cubic-bezier(0.16, 1, 0.3, 1)";
// O fundo vermelho passa 16px do texto para cada lado (before:-inset-x-4); o recorte nao pode comê-lo.
const LADOS = "-16px";

/** Tudo o que esta abaixo do item no fluxo da pagina: irmaos seguintes dele e dos seus ancestrais. */
function seguintes(item) {
  const limite = item.getBoundingClientRect().bottom - 1;
  const lista = [];
  for (let no = item; no && no !== document.body; no = no.parentElement) {
    for (let s = no.nextElementSibling; s; s = s.nextElementSibling) {
      if (getComputedStyle(s).position === "fixed") continue;
      if (s.getBoundingClientRect().top >= limite) lista.push(s);
    }
  }
  return lista;
}

/** Quanto do item esta aberto agora (0 a 1), lendo o progresso da animacao em voo, se houver. */
function abertura(item) {
  if (!item.__anims) return item.open ? 1 : 0;
  const t = item.__anims[0].effect.getComputedTiming().progress ?? 1;
  return item.__de + (item.__para - item.__de) * t;
}

/**
 * Toda a transicao e uma unica grandeza, `f` (0 fechado, 1 aberto), animada de onde estiver ate o
 * alvo. Assim, um clique no meio do caminho reverte dali, sem salto nem recomeco do zero.
 * O layout fica sempre aberto durante a animacao; so o fim de um fechamento derruba o `open`.
 */
function animar(item, abrir, reduzido) {
  const de = abertura(item);
  item.__anims?.forEach((a) => a.cancel());
  item.__anims = null;
  const resposta = item.querySelector(".resposta");
  const alvo = abrir ? 1 : 0;
  item.open = true;
  item.toggleAttribute("data-aberto", abrir);
  const h = resposta.getBoundingClientRect().height;
  const concluir = () => {
    item.__anims?.forEach((a) => a.cancel());
    item.__anims = null;
    item.open = abrir;
  };
  if (reduzido || h < 1 || de === alvo) {
    concluir();
    return;
  }
  const duration = Math.max(DURACAO * Math.abs(alvo - de), 250);
  const opcoes = { duration, easing: CURVA, fill: "forwards" };
  const recorte = (f) => ({ clipPath: `inset(0 ${LADOS} ${(1 - f) * h}px ${LADOS})` });
  const anims = [
    item.animate([recorte(de), recorte(alvo)], opcoes),
    resposta.animate([{ opacity: de }, { opacity: alvo }], opcoes),
  ];
  // O Chrome encaixa a camada de cada irmao em pixel inteiro; um deslocamento fracionario (`h`) nao
  // volta ao mesmo pixel e, ao comecar e ao terminar, o fio de 1px "pisca" (de nitido a borrado).
  // Por isso o deslocamento total e a diferenca entre as posicoes ja arredondadas.
  if (!reduzido) {
    for (const s of seguintes(item)) {
      const topo = s.getBoundingClientRect().top;
      const total = Math.round(topo - h) - Math.round(topo);
      const sobe = (f) => ({ transform: `translateY(${total * (1 - f)}px)` });
      anims.push(s.animate([sobe(de), sobe(alvo)], { ...opcoes, composite: "add" }));
    }
  }
  item.__anims = anims;
  item.__de = de;
  item.__para = alvo;
  anims[0].onfinish = concluir;
}

export function PerguntasFrequentes({ itens }) {
  const raiz = useRef(null);

  const aoClicar = (e) => {
    const item = e.currentTarget.parentElement;
    e.preventDefault();
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const abrir = !item.hasAttribute("data-aberto");
    if (abrir) {
      for (const outro of raiz.current.querySelectorAll("details[data-aberto]")) {
        if (outro !== item) animar(outro, false, reduzido);
      }
    }
    animar(item, abrir, reduzido);
  };

  return (
    <div className="dialogo flex flex-col min-w-0" ref={raiz}>
      {itens.map(({ pergunta, resposta }) => (
        <details
          className="group/pergunta relative isolate min-w-0 border-b border-line-strong first:border-t data-aberto:text-void transition-colors duration-700 ease-(--ease-expo) motion-reduce:transition-none before:content-[''] before:absolute before:inset-y-0 before:-inset-x-4 before:-z-10 before:bg-acento before:opacity-0 data-aberto:before:opacity-100 before:transition-opacity before:duration-700 before:ease-(--ease-expo) motion-reduce:before:transition-none"
          key={pergunta}
          data-revelar
        >
          <summary
            className="flex items-start justify-between gap-4 py-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden font-secundaria text-h3 wrap-anywhere"
            onClick={aoClicar}
          >
            <span>{pergunta}</span>
            <span className="relative shrink-0 w-4 h-4 mt-1 transition-transform duration-700 ease-(--ease-expo) group-data-aberto/pergunta:rotate-45 motion-reduce:transition-none" aria-hidden="true">
              <span className="absolute inset-x-0 top-1/2 h-0.5 -mt-px bg-current" />
              <span className="absolute inset-y-0 left-1/2 w-0.5 -ml-px bg-current" />
            </span>
          </summary>
          <div className="resposta overflow-clip">
            <p className="max-w-[40ch] pb-5 pr-8 font-terciaria text-body wrap-anywhere">{resposta}</p>
          </div>
        </details>
      ))}
    </div>
  );
}
