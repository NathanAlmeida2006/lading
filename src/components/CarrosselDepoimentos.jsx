import { useEffect, useRef, useState } from "react";

/**
 * Relatos em faixa horizontal NATIVA: overflow-x + scroll-snap, sem biblioteca,
 * sem autoplay e sem nenhum handler de ponteiro (a rolagem vertical segue livre).
 *
 * - Um relato: card estatico, sem botoes, sem posicao, sem regiao rolavel.
 * - Varios: a lista e focavel (setas rolam nativamente) e os botoes so aparecem
 *   com `js:`; sem JS a faixa continua rolavel e legivel, sem controle morto.
 * - Lenis: sem atributo nenhum. A roda com deltaX ja e nativa (gestureOrientation vertical) e
 *   `data-lenis-prevent-*` faria o lenis.css conter o overscroll nos DOIS eixos, travando o toque vertical.
 * - Espaco final (`after:`) = 100% - largura do card: todo card, o ultimo inclusive, encosta no inicio da
 *   faixa, entao o indice e so o card mais proximo do inicio e "Proximo" nunca fica inerte.
 */
const CARD = "snap-start shrink-0 flex";
const BOTAO =
  "size-12 inline-flex items-center justify-center border border-line-strong bg-surface-1 text-bone " +
  "font-secundaria text-label cursor-pointer transition-[background,color] duration-(--motion-fast) ease-(--ease-default) " +
  "enabled:hover:bg-bone enabled:hover:text-void disabled:opacity-40 disabled:cursor-not-allowed";

const reduzido = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function CarrosselDepoimentos({ depoimentos, posicao, anterior, proximo, regiao }) {
  const lista = useRef(null);
  const botoes = useRef([]);
  const [atual, setAtual] = useState(0);
  const total = depoimentos.length;
  const varios = total > 1;

  useEffect(() => {
    const no = lista.current;
    if (!varios || !no) return;
    let quadro = 0;
    const medir = () => {
      quadro = 0;
      let melhor = 0;
      let menor = Infinity;
      for (let i = 0; i < total; i++) {
        const d = Math.abs(no.children[i].offsetLeft - no.scrollLeft);
        if (d < menor) [menor, melhor] = [d, i];
      }
      setAtual(melhor); // so re-renderiza quando o indice muda
    };
    const agendar = () => { quadro ||= requestAnimationFrame(medir); };
    medir();
    no.addEventListener("scroll", agendar, { passive: true });
    window.addEventListener("resize", agendar, { passive: true });
    return () => {
      no.removeEventListener("scroll", agendar);
      window.removeEventListener("resize", agendar);
      cancelAnimationFrame(quadro);
    };
  }, [varios, total]);

  // Botao que acaba de ficar `disabled` perde o teclado: o foco passa ao botao irmao.
  useEffect(() => {
    const [a, p] = botoes.current;
    if (document.activeElement === a && a.disabled) p?.focus();
    else if (document.activeElement === p && p.disabled) a?.focus();
  }, [atual]);

  const ir = (indice) =>
    lista.current.scrollTo({ left: lista.current.children[indice].offsetLeft, behavior: reduzido() ? "auto" : "smooth" });

  return (
    <div>
      <ul
        ref={lista}
        className={`relative flex gap-4 list-none m-0 p-0 ${
          varios ? "overflow-x-auto snap-x snap-mandatory overscroll-x-contain pb-4 after:content-[''] after:shrink-0 after:basis-[calc(15%-1rem)] md:after:basis-[calc(40%-1rem)] lg:after:basis-[calc(55%-1rem)]" : ""
        }`}
        {...(varios && { tabIndex: 0, role: "region", "aria-label": regiao })}
      >
        {depoimentos.map(({ id, texto, identificacao, contexto, origem }) => (
          <li key={id} className={`${CARD} ${varios ? "basis-[85%] md:basis-[60%] lg:basis-[45%]" : "w-full"}`}>
            <figure className="m-0 w-full p-6 lg:p-8 flex flex-col justify-between gap-6 border border-line-strong bg-surface-1">
              <blockquote className="m-0 max-w-prose font-terciaria text-body-lg">
                <p>{texto}</p>
              </blockquote>
              <figcaption className="text-silver font-terciaria text-caption">
                <strong className="text-bone font-semibold">{identificacao}</strong>
                {contexto && <span> · {contexto}</span>}
                {origem && <span className="block mt-1">{origem}</span>}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>

      {varios && (
        <div className="hidden js:flex items-center justify-between gap-4 mt-4">
          <p className="text-silver font-terciaria text-mono-reg tabular-nums" aria-live="polite">
            {posicao.replace("{atual}", atual + 1).replace("{total}", total)}
          </p>
          <div className="flex gap-4">
            <button type="button" className={BOTAO} aria-label={anterior} disabled={atual === 0}
              ref={(e) => { botoes.current[0] = e; }} onClick={() => ir(atual - 1)}>
              <span aria-hidden="true">&#8592;</span>
            </button>
            <button type="button" className={BOTAO} aria-label={proximo} disabled={atual === total - 1}
              ref={(e) => { botoes.current[1] = e; }} onClick={() => ir(atual + 1)}>
              <span aria-hidden="true">&#8594;</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
