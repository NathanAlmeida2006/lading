import { useRef } from "react";
import { Botao } from "../components/Botao.jsx";
import { Cronometro, OfertaLimitada } from "../components/Cronometro.jsx";
import { FundoCapa } from "../components/FundoCapa.jsx";
import { mascaraDeLinha, revelar, revelarEmCascata, useMovimento } from "../motion/index.js";
import { semMovimento } from "../motion/tokens.js";
import { pilhaPronta as DADOS } from "../pilha.js";
import { bloco, envelope, mascara } from "../ui.js";

const SERRILHA =
  "before:absolute before:inset-x-0 before:-top-1.5 before:h-1.5 before:bg-repeat-x before:bg-[length:8px_6px] before:bg-(image:--serrilha-escura-sup) " +
  "after:absolute after:inset-x-0 after:-bottom-1.5 after:h-1.5 after:bg-repeat-x after:bg-[length:8px_6px] after:bg-(image:--serrilha-escura-inf)";

// Tracos 24x24 (estilo Lucide) por id de item; id sem icone fica sem marca.
const ICONES = {
  "protocolo-hipertrofia": ["m6.5 6.5 11 11", "m21 21-1-1", "m3 3 1 1", "m18 22 4-4", "m2 6 4-4", "m3 10 7-7", "m14 21 7-7"],
  "protocolo-dieta": ["M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2", "M7 2v20", "M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"],
  "protocolo-sono": ["M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"],
  "social-vibe": ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8", "M22 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"],
  "checklist-integrado": ["m3 17 2 2 4-4", "m3 7 2 2 4-4", "M13 6h8", "M13 12h8", "M13 18h8"],
  app: ["M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z", "M12 18h.01"],
};

/**
 * Pilha de valor: o que o protocolo entrega, somado, contra o preco de oferta.
 * Recibo em tema escuro.
 *
 * Os dados vem de `config.pilhaDeValor` ja conferidos por `pilhaApresentavel`. Sem bloco
 * valido, a secao nao existe na pagina (devolve `null`).
 *
 * @param {object} props
 * @param {string} [props.id] Ancora da secao (`App.jsx` reusa a pilha como `#oferta`).
 * @param {string} [props.posicao] Posicao do CTA para o checkout.
 */
export function PilhaDeValor({ id = "pilha-de-valor", posicao = "pilha" }) {
  const raiz = useRef(null);

  useMovimento(() => {
    if (semMovimento()) return;
    const no = raiz.current;
    if (!no) return;
    mascaraDeLinha(no.querySelector(".titulo"), { atraso: 60 });
    revelar(no.querySelector(".pilha__lista"));
    revelarEmCascata(no.querySelectorAll(".pilha__itens > li"), { intervalo: 50 });
    revelar(no.querySelector(".pilha__conector"));
    revelar(no.querySelector(".chamada"));
  }, []);

  if (!DADOS) return null;
  const { cabecalho } = DADOS;

  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className={`${bloco} isolate py-16 md:py-24`} ref={raiz}>
      <FundoCapa />
      <div className={`${envelope} relative z-1`}>
        <div className="max-w-[65ch] min-w-0 mx-auto">
          <header className="mb-8">
            <h2
              id={`${id}-titulo`}
              className={`titulo font-secundaria text-h1 uppercase text-center whitespace-nowrap cor-viva lg:text-display [--text-h1:min(calc((100vw-32px)/15.5),42px)] lg:[--text-display:42px] ${mascara}`}
              data-revelar
            >
              {cabecalho}
            </h2>
          </header>

          <PilhaCartao dados={DADOS} />

          <OfertaLimitada />

          <div className="chamada flex flex-col items-start lg:items-center mt-12" data-revelar>
            <Botao posicao={posicao} />
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Cartao da pilha (lista, total, conector e preco), em tema escuro.
 *
 * @param {object} props
 * @param {object} props.dados Saida de `pilhaApresentavel`.
 */
function PilhaCartao({ dados }) {
  const { itens, totalRotulo, total, moeda, conector, oferta } = dados;
  return (
    <article className={`pilha__lista relative my-1.5 p-6 lg:p-8 bg-surface-1 border-x border-line ${SERRILHA}`} data-revelar>
      <ol className="pilha__itens" role="list">
        {itens.map((item) => (
          <li
            className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3.5 text-silver not-first:border-t not-first:border-line"
            key={item.id}
            data-revelar
          >
            <svg className="size-5 text-acento" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {(ICONES[item.id] ?? []).map((d) => <path d={d} key={d} />)}
            </svg>
            <p className="text-bone font-terciaria text-body lg:text-body-lg leading-none wrap-anywhere">{item.nome}</p>
            <p className="text-silver font-terciaria text-body lg:text-body-lg tabular-nums whitespace-nowrap text-right min-w-[4.5ch] leading-none line-through decoration-1">{moeda} {item.valor}</p>
          </li>
        ))}
      </ol>

      <p className="mt-4 pt-4 border-t border-dashed border-line-strong flex items-center justify-center gap-2 font-terciaria text-[12.8px] text-silver">
        {totalRotulo}{" "}
        <span className="sr-only">valor de referência </span>
        <s className="font-secundaria text-[28.8px] text-acento tabular-nums decoration-1">{moeda} {total}</s>
      </p>

      <p
        className="pilha__conector w-fit mx-auto py-8 text-center font-secundaria font-extrabold uppercase leading-none brilho-varrido text-[length:clamp(56px,20vw,96px)]"
        data-revelar
      >
        {conector.rotulo}
      </p>

      <dl className="pilha__oferta flex flex-col gap-4 pt-4 border-t border-dashed border-line-strong">
        <div>
          <dt className="text-silver font-secundaria text-overline uppercase">{oferta.rotulo}</dt>
          <dd className="mt-2 text-bone-pure font-secundaria font-extrabold leading-none tabular-nums wrap-anywhere">
            <span className="aberracao whitespace-nowrap text-[length:clamp(72px,29vw,150px)]"><span className="text-[0.4em]">{moeda} </span>{oferta.preco}</span>
          </dd>
        </div>
        <Cronometro />
        <div className="font-terciaria text-[12.8px] lg:text-[14.4px] text-center text-bone-pure leading-loose wrap-anywhere">{oferta.subtexto}</div>
      </dl>
    </article>
  );
}
