import { useRef } from "react";
import { Thread } from "../components/ui/Thread.jsx";
import { FluidBackground } from "../components/visuals/FluidBackground.jsx";
import { CtaButton } from "../components/ui/CtaButton.jsx";
import { Frame } from "../components/ui/Frame.jsx";
import { Label } from "../components/ui/Label.jsx";
import { CONTENT } from "../content/content.js";
import { openPanel, useMotion } from "../sensory/index.js";
import { PUBLIC_CONTACT } from "../infra/config.js";
import { LAYER, HIGHLIGHT, ENVELOPE, GRAIN, LINE, RAW_NUMBERS, PANEL, OUTLINED } from "../app/ui.js";

/**
 * Fechamento: a segunda capa.
 *
 * O Rep Republic fecha a pagina com o wordmark em display gigante, no mesmo
 * peso do heroi, e o Gaspar poe a navegacao para o proximo projeto exatamente
 * onde o leitor decide se continua. Aqui os dois se juntam - a headline de duas
 * linhas espelha a dobra, com o proprio botao logo abaixo.
 *
 * Sem argumento novo (RF-L08). O que muda em relacao a dobra sao os numeros
 * RAW_NUMBERS: la anunciam o programa, aqui anunciam a entrega.
 * @param {object} props - Sem props.
 * @returns {JSX.Element} A segunda capa da página.
 */
export function Closing() {
  const root = useRef(null);

  useMotion(() => {
    const node = root.current;
    if (!node) return;
    return openPanel({
      frame: node.querySelectorAll(".moldura path"),
      threads: node.querySelectorAll(".painel__fio line"),
      kicker: node.querySelector(".painel__kicker"),
      lines: node.querySelectorAll(".linha__texto"),
      body: node.querySelector(".painel__corpo"),
      action: node.querySelector(".painel__acao"),
      footer: node.querySelector(".painel__rodape"),
    });
  }, []);

  return (
    <section id="fechamento" className={`${PANEL} ${GRAIN} painel-capa`} ref={root}>
      <FluidBackground />
      <Frame />

      <div className="w-full flex-1 flex flex-col justify-center gap-2 py-3 relative z-1">
        <div className={`${ENVELOPE} flex flex-col items-start gap-2`}>
          <Label className="painel__kicker" margin="mb-2">{CONTENT.fechamento.rotulo}</Label>

          <Thread />
          <h2
            className="painel__titulo flex flex-col w-full my-2 text-bone font-secundaria text-display-xxl uppercase tabular-nums tela-baixa:text-[length:clamp(56px,20vw,120px)]"
            data-revelar
          >
            <span className={LINE}>
              <span className={`linha__texto block ${LAYER} ${OUTLINED}`}>{CONTENT.fechamento.headline.linhas[0]}</span>
            </span>{" "}
            <span className={LINE}>
              <span className={`linha__texto block ${LAYER}`}>{CONTENT.fechamento.headline.linhas[1]}</span>
            </span>
          </h2>
          <Thread />

          <p className="painel__corpo max-w-prose mt-3 text-silver font-terciaria text-body-lg" data-revelar>
            {CONTENT.dobra.promessa.texto}
          </p>
        </div>

        <div className="painel__acao w-full shrink-0 mt-4 relative z-1" data-revelar>
          <div className={`${ENVELOPE} flex flex-col items-center text-center`}>
            {/* `shouldHideDock`: o CTA do fechamento tem a propria acao na tela; a doca sai enquanto ele estiver visivel. */}
            <CtaButton position="fechamento" shouldHideDock />
            <p className="mt-3 text-silver font-terciaria text-mono-reg tabular-nums">
              {CONTENT.fechamento.condicoes}
            </p>
          </div>
        </div>
      </div>

      <div className={`${ENVELOPE} painel__rodape pointer-events-none absolute inset-x-0 bottom-4 z-1 flex items-end justify-between gap-4 text-silver tela-rasa:hidden`} data-revelar>
        <ul className={RAW_NUMBERS} role="list">
          <li>
            <b className={HIGHLIGHT}>App</b> direto no celular
          </li>
          <li>
            <b className={HIGHLIGHT}>Acesso</b> imediato e vitalício
          </li>
          <li>
            <b className={HIGHLIGHT}>Pagamento</b> único
          </li>
          {PUBLIC_CONTACT && (
            <li>
              <b className={HIGHLIGHT}>Suporte</b>{" "}
              <a className="pointer-events-auto underline underline-offset-4" href={`mailto:${PUBLIC_CONTACT}`}>{PUBLIC_CONTACT}</a>
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
