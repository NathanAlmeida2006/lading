import { CtaButton } from "../components/ui/CtaButton.jsx";
import { Thread } from "../components/ui/Thread.jsx";
import { CoverBackground } from "../components/visuals/CoverBackground.jsx";
import { Menu } from "../components/layout/Menu.jsx";
import { Frame } from "../components/ui/Frame.jsx";
import { Wordmark } from "../components/ui/Wordmark.jsx";
import { CONTENT } from "../content/content.js";
import {
  LAYER,
  HIGHLIGHT,
  ENVELOPE,
  GRAIN,
  LINE,
  RAW_NUMBERS,
  PANEL,
  OUTLINED,
} from "../app/ui.js";

const ENTER_CLASS = "animate-reveal motion-reduce:animate-none";

/**
 * A dobra, em painel de tela cheia.A headline e tipografia como arquitetura: duas linhas
 * compostas à mão, encostando nas bordas do container, a segunda só em contorno de fio.
 * O tamanho da headline segue a coluna (a linha mais larga, "Desculpas" (antes do texto virar "Improviso", que é mais estreita), mede ~3,95x a fonte, medido): `--text-display-xxl` por faixa,
 * para cada linha ficar numa linha só de 360 a 1440 px.
 *
 * `min-h-svh` e não `vh`: no celular a barra do navegador entra e sai, e `vh` mede a
 * viewport grande - o botão cairia para fora da tela justamente em quem chega pelo anúncio
 * (RF-L09). A entrada é toda CSS (styles/residual.css, seção 7), sem esperar o pacote de
 * JavaScript, para o LCP (RNF-L01) não depender da hidratação.
 * @param {object} props - Sem props.
 * @returns {JSX.Element} A seção da dobra.
 */
export function Fold() {
  return (
    // data-oculta-doca: a doca fica sempre visível, menos na dobra.
    <section
      className={`${PANEL} ${GRAIN} panel-cover pendente:[--base:300ms]`}
      id="inicio"
      data-oculta-doca=""
    >
      <CoverBackground />
      <Frame entrance="css" />

      {/* Sem `z-1`: o menu inline (antes de hidratar) abre por `:target` e precisa competir com a página, não com este contexto. */}
      <div
        className={`${ENVELOPE} flex-none flex items-center justify-between gap-4 text-silver relative`}
      >
        <Wordmark />
        <Menu />
      </div>

      <div
        className={`${ENVELOPE} flex-1 flex flex-col justify-center items-start gap-2 tela-rasa:gap-1 pt-3 tela-rasa:pt-1 pb-12 relative z-1`}
      >
        <Thread delay={260} />
        <h1 className="painel__titulo flex flex-col w-full my-2 tela-rasa:my-1 break-words text-bone font-secondary text-display-xxl [--text-display-xxl:min(calc((100vw-32px)/4.05),169px)] md:[--text-display-xxl:162px] lg:[--text-display-xxl:min(calc((100vw-96px)/4.05),252px)] wide:[--text-display-xxl:324px] uppercase tabular-nums">
          <span className={LINE}>
            <span
              className={`linha__texto block ${LAYER} animate-raise motion-reduce:animate-none`}
            >
              {CONTENT.fold.headline.lines[0]}
            </span>
          </span>{" "}
          <span className={LINE}>
            <span
              className={`linha__texto block ${LAYER} ${OUTLINED} animate-raise motion-reduce:animate-none [--delay:60ms]`}
            >
              {CONTENT.fold.headline.lines[1]}
            </span>
          </span>
        </h1>
        <Thread delay={320} />

        <p
          className={`painel__corpo max-w-prose mt-3 tela-rasa:mt-2 text-silver font-tertiary text-[length:1.125rem] leading-[1.65] ${ENTER_CLASS}`}
        >
          {CONTENT.fold.subheadline.text}
        </p>

        <div
          className={`painel__acao w-full shrink-0 mt-4 tela-rasa:mt-2 ${ENTER_CLASS} [--delay:80ms]`}
        >
          <CtaButton position="dobra" label={CONTENT.fold.cta} />
        </div>
      </div>

      <div
        className={`${ENVELOPE} painel__rodape absolute inset-x-0 bottom-4 z-1 flex items-end justify-between gap-4 text-silver tela-rasa:hidden ${ENTER_CLASS} [--delay:160ms]`}
      >
        <span
          className="flex flex-col gap-0.5 text-silver font-secondary text-overline uppercase"
          aria-hidden="true"
        >
          <span>rolar</span>
          <span>pra ver</span>
          <span className="block mt-1 text-silver font-tertiary text-[18px] leading-none animate-arrow motion-reduce:animate-none">
            &#8595;
          </span>
        </span>
        <ul className={RAW_NUMBERS} role="list">
          {CONTENT.fold.highlights.map(({ valor, label }) => (
            <li key={label}>
              <b className={HIGHLIGHT}>{valor}</b> {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
