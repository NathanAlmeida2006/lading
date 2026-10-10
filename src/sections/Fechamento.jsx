import { useRef } from "react";
import { Fio } from "../components/Fio.jsx";
import { FundoCapa } from "../components/FundoCapa.jsx";
import { Botao } from "../components/Botao.jsx";
import { Moldura } from "../components/Moldura.jsx";
import { Rotulo } from "../components/Rotulo.jsx";
import { conteudo } from "../conteudo.js";
import { abrirPainel, useMovimento } from "../motion/index.js";
import { config } from "../config.js";
import { camada, crus, envelope, grao, linha, painel, vazado } from "../ui.js";

// So o fechamento: a headline da dobra e da intro segue "Natural / Cresce.".
const HEADLINE = ["Apenas", "Faça."];

/**
 * Fechamento: a segunda capa.
 *
 * O Rep Republic fecha a pagina com o wordmark em display gigante, no mesmo
 * peso do heroi, e o Gaspar poe o unico marquee do site exatamente onde o
 * leitor decide se continua: a navegacao para o proximo projeto. Aqui os dois
 * se juntam - a headline de duas linhas espelha a dobra, e a marquise carrega
 * o verbo do botao em laco, com o proprio botao logo abaixo.
 *
 * Sem argumento novo (RF-L08). O que muda em relacao a dobra sao os numeros
 * crus: la anunciam o programa, aqui anunciam a entrega.
 */
export function Fechamento({ params }) {
  const raiz = useRef(null);
  const texto = (valor) => typeof valor === "string" && valor.trim().length > 0;
  const { garantiaDias: dias, garantiaCanal: canal } = config.oferta;
  const pendente = "a confirmar neste preview";
  const prazoConfirmado = Number.isInteger(dias) && dias > 0;
  const canalGarantia = texto(canal) ? ` · ${canal}` : prazoConfirmado ? ` · canal ${pendente}` : "";

  useMovimento(() => {
    const no = raiz.current;
    if (!no) return;
    return abrirPainel({
      moldura: no.querySelectorAll(".moldura path"),
      fios: no.querySelectorAll(".painel__fio line"),
      kicker: no.querySelector(".painel__kicker"),
      titulo: no.querySelector(".painel__titulo"),
      linhas: no.querySelectorAll(".linha__texto"),
      corpo: no.querySelector(".painel__corpo"),
      acao: no.querySelector(".painel__acao"),
      rodape: no.querySelector(".painel__rodape"),
    });
  }, []);

  return (
    <section id="fechamento" className={`${painel} ${grao} painel-capa`} ref={raiz}>
      <FundoCapa />
      <Moldura />

      <div className="w-full flex-1 flex flex-col justify-center gap-2 py-3 relative z-1">
        <div className={`${envelope} flex flex-col items-start gap-2`}>
          <Rotulo className="painel__kicker" margem="mb-2">o caminho começa aqui</Rotulo>

          <Fio />
          <h2
            className="painel__titulo flex flex-col w-full my-2 text-bone font-secundaria text-display-xxl uppercase tabular-nums tela-baixa:text-[length:clamp(56px,20vw,120px)]"
            data-revelar
          >
            <span className={linha}>
              <span className={`linha__texto block ${camada} ${vazado}`}>{HEADLINE[0]}</span>
            </span>{" "}
            <span className={linha}>
              <span className={`linha__texto block ${camada}`}>{HEADLINE[1]}</span>
            </span>
          </h2>
          <Fio />

          <p className="painel__corpo max-w-prose mt-3 text-silver font-terciaria text-body-lg" data-revelar>
            {conteudo.dobra.promessa.texto}
          </p>
        </div>

        <div className="painel__acao w-full shrink-0 mt-4 relative z-1" data-revelar>
          <div className={`${envelope} flex flex-col items-center text-center`}>
            <Botao params={params} posicao="fechamento" />
            <p className="mt-3 text-silver font-terciaria text-mono-reg tabular-nums">
              {prazoConfirmado ? `Garantia: ${dias} dias` : `Garantia: ${pendente}`}{canalGarantia} · condições acima
            </p>
          </div>
        </div>
      </div>

      <div className={`${envelope} painel__rodape absolute inset-x-0 bottom-4 z-1 flex items-end justify-between gap-4 text-silver tela-rasa:hidden`} data-revelar>
        <ul className={crus} role="list">
          <li>
            <b className="text-bone font-bold">Formato</b> {texto(config.entrega.formato) ? config.entrega.formato : pendente}
          </li>
          <li>
            <b className="text-bone font-bold">Canal</b> {texto(config.entrega.canal) ? config.entrega.canal : pendente}
          </li>
          <li>
            <b className="text-bone font-bold">Acesso</b> {texto(config.entrega.modoDeAcesso) ? config.entrega.modoDeAcesso : pendente}
          </li>
        </ul>
      </div>
    </section>
  );
}
