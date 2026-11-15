import { CtaButton } from "../components/ui/CtaButton.jsx";
import { Thread } from "../components/ui/Thread.jsx";
import { CoverBackground } from "../components/visuals/CoverBackground.jsx";
import { Menu } from "../components/layout/Menu.jsx";
import { Frame } from "../components/ui/Frame.jsx";
import { Label } from "../components/ui/Label.jsx";
import { Wordmark } from "../components/ui/Wordmark.jsx";
import { CONTENT } from "../content/content.js";
import { LAYER, HIGHLIGHT, ENVELOPE, GRAIN, LINE, RAW_NUMBERS, PANEL, OUTLINED } from "../app/ui.js";

const ENTER_CLASS = "animate-revelar motion-reduce:animate-none";

/**
 * A dobra, em painel de tela cheia.A headline e tipografia como arquitetura: duas linhas
 * compostas a mao, encostando nas bordas do container, a segunda so em contorno de fio.
 *
 * `min-h-svh` e nao `vh`: no celular a barra do navegador entra e sai, e `vh` mede a
 * viewport grande - o botao cairia para fora da tela justamente em quem chega pelo anuncio
 * (RF-L09). A entrada e toda CSS (styles/residual.css, secao 7), sem esperar o pacote de
 * JavaScript, para o LCP (RNF-L01) nao depender da hidratacao.
 * @param {object} props - Sem props.
 * @returns {JSX.Element} A seção da dobra.
 */
export function Fold() {
  return (
    // data-oculta-doca: a doca fica sempre visivel, menos na dobra.
    <section className={`${PANEL} ${GRAIN} painel-capa pendente:[--base:300ms]`} id="inicio" data-oculta-doca="">
      <CoverBackground />
      <Frame entrance="css" />

      {/* Sem `z-1`: o menu inline (antes de hidratar) abre por `:target` e precisa competir com a pagina, nao com este contexto. */}
      <div className={`${ENVELOPE} flex-none flex items-center justify-between gap-4 text-silver relative`}>
        <Wordmark />
        <Menu />
      </div>

      <div className={`${ENVELOPE} flex-1 flex flex-col justify-center items-start gap-2 tela-rasa:gap-1 pt-3 tela-rasa:pt-1 pb-12 relative z-1`}>
        <Label className={`painel__kicker ${ENTER_CLASS}`} margin="mb-2 tela-rasa:mb-1">{CONTENT.dobra.rotulo}</Label>

        <Thread delay={260} />
        <h1
          className="painel__titulo flex flex-col w-full my-2 tela-rasa:my-1 break-words text-bone font-secundaria text-display-xxl uppercase tabular-nums tela-baixa:text-[length:clamp(56px,20vw,120px)]"
        >
          <span className={LINE}>
            <span className={`linha__texto block ${LAYER} animate-subir motion-reduce:animate-none`}>{CONTENT.dobra.headline.linhas[0]}</span>
          </span>{" "}
          <span className={LINE}>
            <span className={`linha__texto block ${LAYER} ${OUTLINED} animate-subir motion-reduce:animate-none [--atraso:60ms]`}>{CONTENT.dobra.headline.linhas[1]}</span>
          </span>
        </h1>
        <Thread delay={320} />

        <p className={`painel__corpo max-w-prose mt-3 tela-rasa:mt-2 text-silver font-terciaria text-[length:1.125rem] leading-[1.65] ${ENTER_CLASS}`}>
          {CONTENT.dobra.subheadline.texto}
        </p>

        <div className={`painel__acao w-full shrink-0 mt-4 tela-rasa:mt-2 ${ENTER_CLASS} [--atraso:80ms]`}>
          <CtaButton position="dobra" />
          <p className="mt-3 text-silver font-terciaria text-mono-reg tabular-nums">
            {CONTENT.mecanismo.semanas}{CONTENT.dobra.condicoes}
          </p>
        </div>
      </div>

      <div className={`${ENVELOPE} painel__rodape absolute inset-x-0 bottom-4 z-1 flex items-end justify-between gap-4 text-silver tela-rasa:hidden ${ENTER_CLASS} [--atraso:160ms]`}>
        <span className="flex flex-col gap-0.5 text-silver font-secundaria text-overline uppercase" aria-hidden="true">
          <span>rolar</span>
          <span>pra ver</span>
          <span className="block mt-1 text-silver font-terciaria text-[18px] leading-none animate-seta motion-reduce:animate-none">&#8595;</span>
        </span>
        <ul className={RAW_NUMBERS} role="list">
          <li>
            <b className={HIGHLIGHT}>{CONTENT.mecanismo.semanas}</b> semanas
          </li>
          <li>
            <b className={HIGHLIGHT}>{CONTENT.mecanismo.sessoesObrigatorias}</b> sessões por semana
          </li>
          <li>
            <b className={HIGHLIGHT}>{CONTENT.mecanismo.sessoesOpcionais}</b> opcional
          </li>
        </ul>
      </div>
    </section>
  );
}
