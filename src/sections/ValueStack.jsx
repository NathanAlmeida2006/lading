import { useRef } from "react";
import { CtaButton } from "../components/ui/CtaButton.jsx";
import { DotField } from "../components/visuals/DotField.jsx";
import { revealLineMask, reveal, revealInCascade, useMotion } from "../sensory/index.js";
import { isMotionReduced } from "../sensory/tokens.js";
import { READY_VALUE_STACK } from "../content/valueStack.js";
import { CONTENT } from "../content/content.js";
import { BLOCK, ENVELOPE, MASK } from "../app/ui.js";

const SERRATED_EDGE =
  "before:absolute before:inset-x-0 before:-top-1.5 before:h-1.5 before:bg-repeat-x before:bg-[length:8px_6px] before:bg-(image:--serrilha-escura-sup) " +
  "after:absolute after:inset-x-0 after:-bottom-1.5 after:h-1.5 after:bg-repeat-x after:bg-[length:8px_6px] after:bg-(image:--serrilha-escura-inf)";

// Tracos 24x24 (estilo Lucide) por id de item; id sem icone fica sem marca.
const ICONS = {
  "protocolo-hipertrofia": ["m6.5 6.5 11 11", "m21 21-1-1", "m3 3 1 1", "m18 22 4-4", "m2 6 4-4", "m3 10 7-7", "m14 21 7-7"],
  "protocolo-dieta": ["M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2", "M7 2v20", "M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"],
  "protocolo-sono": ["M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"],
  app: ["M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z", "M12 18h.01"],
  "checklist-integrado": ["m3 17 2 2 4-4", "m3 7 2 2 4-4", "M13 6h8", "M13 12h8", "M13 18h8"],
  "plano-retorno": ["M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8", "M3 3v5h5"],
};

/**
 * A oferta: o que o protocolo entrega, o preco e a garantia. Unica ocorrencia do preco na pagina (a ancora `#oferta`).
 * Sem preco "de", sem preco avulso por item e sem relogio de urgencia: so o que a compra inclui, a condicao de
 * lancamento e o valor real do checkout. Recibo em tema escuro.
 *
 * Os dados vem de `CONFIG.pilhaDeValor` ja conferidos por `buildPresentableValueStack`. Sem bloco
 * valido, a secao nao existe na pagina (devolve `null`).
 *
 * @param {object} props - Sem props.
 * @returns {JSX.Element|null} A seção, ou null sem bloco válido.
 */
export function ValueStack() {
  const root = useRef(null);

  useMotion(() => {
    if (isMotionReduced()) return;
    const node = root.current;
    if (!node) return;
    revealLineMask(node.querySelector(".titulo"), { delay: 60 });
    reveal(node.querySelector(".pilha__lista"));
    revealInCascade(node.querySelectorAll(".pilha__itens > li"), { interval: 50 });
    reveal(node.querySelector(".pilha__conector"));
    reveal(node.querySelector(".chamada"));
  }, []);

  if (!READY_VALUE_STACK) return null;
  const { cabecalho } = READY_VALUE_STACK;

  return (
    <section id="oferta" aria-labelledby="oferta-titulo" className={`${BLOCK} isolate border-t-0! pb-16 md:pb-24`} ref={root}>
      <DotField variant="estelar" />
      <div className={`${ENVELOPE} relative z-1`}>
        <div className="max-w-[65ch] min-w-0 mx-auto">
          <header className="mb-8">
            <h2
              id="oferta-titulo"
              className={`titulo font-secundaria text-h1 uppercase text-center text-balance cor-viva lg:text-display lg:[--text-display:42px] ${MASK}`}
              data-revelar
            >
              {cabecalho}
            </h2>
          </header>

          <ValueStackCard stackData={READY_VALUE_STACK} />

          <div className="chamada flex flex-col items-start lg:items-center gap-6 mt-12" data-revelar>
            <CtaButton position="oferta" label={CONTENT.oferta.cta} />
            <Guarantee />
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Cartao da pilha (lista, conector e preco), em tema escuro.
 *
 * @param {object} props
 * @param {object} props.stackData Saida de `buildPresentableValueStack`.
 * @returns {JSX.Element} O cartão da pilha.
 */
function ValueStackCard({ stackData }) {
  const { itens, tituloItens, moeda, conector, oferta } = stackData;
  return (
    <article className={`pilha__lista relative my-1.5 p-4 md:p-6 lg:p-8 bg-surface-1 border-x border-line ${SERRATED_EDGE}`} data-revelar>
      <h3 className="pb-3 text-center border-b-2 border-acento text-bone font-secundaria text-h2 [--text-h2:31.2px] uppercase">{tituloItens}</h3>
      <ol className="pilha__itens" role="list">
        {itens.map((item) => (
          <li
            className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 py-3.5 text-silver not-first:border-t not-first:border-line"
            key={item.id}
            data-revelar
          >
            <svg className="size-5 text-acento" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {(ICONS[item.id] ?? []).map((d) => <path d={d} key={d} />)}
            </svg>
            {/* Uma linha so: o nome mais longo mede ~16,1 vezes o corpo (medido); a largura util e a tela menos o respiro do cartao e o icone (98px). */}
            <p className="text-bone font-terciaria text-body [--text-body:min(14.4px,calc((100vw-98px)/16.5))] lg:[--text-body:16.2px] whitespace-nowrap leading-snug">{item.nome}</p>
          </li>
        ))}
      </ol>

      {/* Quase a largura do cartao: a palavra mede ~3,2x o corpo (medido); largura util = tela menos 66px. */}
      <p
        className="pilha__conectorw-fit mx-auto py-8 text-center font-secundaria font-extrabold uppercase leading-none brilho-varrido text-[length:min(144px,calc((100vw-66px)/3.4))]"
        data-revelar
      >
        {conector.rotulo}
      </p>

      <div className="pilha__oferta flex flex-col gap-4 pt-4 border-t border-dashed border-line-strong">
        <dl>
          <dt className="text-silver font-secundaria text-overline uppercase text-balance">{oferta.rotulo}</dt>
          <dd className="mt-2 text-bone-pure font-secundaria font-extrabold leading-none tabular-nums wrap-anywhere">
            <div className="flex items-baseline justify-between gap-3 mb-2">
              <span className="text-silver text-[length:clamp(20px,6vw,32px)]">{oferta.parcelas}x de</span>
              <span className="text-silver font-terciaria font-normal text-[10px]">{moeda} {oferta.totalParcelado} no cartão</span>
            </div>
            {/* Uma linha so: "R$ 28,55" mede ~3,23x o corpo (medido); a largura util e a tela menos 66px (envelope e padding do cartao). */}
            <span className="aberracao whitespace-nowrap text-[length:min(150px,calc((100vw-66px)/3.3))]">{moeda} {oferta.valorParcela}</span>
          </dd>
          <dd className="mt-3 text-right text-silver font-terciaria text-body">ou {moeda} {oferta.preco} à vista</dd>
        </dl>
        <p className="flex items-center gap-3 text-bone font-secundaria font-extrabold uppercase tracking-wide text-[length:clamp(18px,5.5vw,26px)] before:h-px before:flex-1 before:bg-acento after:h-px after:flex-1 after:bg-acento">{oferta.selo}</p>
        <p className="font-terciaria text-body [--text-body:12.8px] lg:text-body-lg lg:[--text-body-lg:14.4px] text-center text-bone text-balance wrap-anywhere">{oferta.comparacao}</p>
        <p className="font-terciaria text-[12.8px] lg:text-[14.4px] text-center text-silver leading-loose text-balance wrap-anywhere">{oferta.subtexto}</p>
      </div>
    </article>
  );
}

// O desenho de cada selo, pela chave `icone` de `CONTENT.oferta.garantia.selos`.
const SEAL_ICONS = {
  pagamento: <><rect width="20" height="14" x="2" y="5" rx="2" /><path d="M2 10h20" /></>,
  protecao: <><rect width="18" height="11" x="3" y="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  garantia: <><path d="M8 2v4M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18M9 16l2 2 4-4" /></>,
};

/**
 * Reversao de risco, logo abaixo do botao: a garantia em destaque, com o texto vindo de `CONTENT.oferta.garantia`.
 * @returns {JSX.Element} O bloco da garantia.
 */
function Guarantee() {
  const { titulo, texto, selos } = CONTENT.oferta.garantia;
  return (
    <div className="pilha__garantia flex w-full flex-col gap-3 p-5 lg:p-6 bg-surface-1 border border-acento">
      <div className="flex items-center gap-4">
        <svg className="shrink-0 size-8 text-acento" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        {/* Uma linha so: o titulo mede ~14,4x o corpo (medido) e a largura util e a tela menos 122px (envelope, padding, icone). */}
        <h3 className="min-w-0 text-bone font-secundaria text-h3 [--text-h3:min(20px,calc((100vw-122px)/14.6))] whitespace-nowrap uppercase">{titulo}</h3>
      </div>
      <p className="text-silver font-terciaria text-body text-justify hyphens-auto">{texto}</p>
      <ul className="flex flex-col gap-3 mt-1 pt-4 border-t border-line" role="list">
        {selos.map(({ icone, texto: seal }) => (
          <li key={icone} className="flex items-center gap-3 text-bone font-terciaria text-body">
            <svg className="shrink-0 size-6 text-acento" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{SEAL_ICONS[icone]}</svg>
            {seal}
          </li>
        ))}
      </ul>
    </div>
  );
}
