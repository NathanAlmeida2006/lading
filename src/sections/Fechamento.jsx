import { useRef } from "react";
import { Fio } from "../components/Fio.jsx";
import { FundoCapa } from "../components/FundoCapa.jsx";
import { Botao } from "../components/Botao.jsx";
import { Marquise } from "../components/Marquise.jsx";
import { Moldura } from "../components/Moldura.jsx";
import { Rotulo } from "../components/Rotulo.jsx";
import { abrirPainel, useMovimento } from "../motion/index.js";
import { config, VERBO_ACAO } from "../config.js";
import { camada, crus, envelope, grao, linha, painel, painelRodape, vazado } from "../ui.js";

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
    <section id="fechamento" className={`${painel} ${grao}`} ref={raiz}>
      <FundoCapa />
      <Moldura />

      <div className={`${envelope} flex-auto flex flex-col justify-center items-start gap-2 pt-3 pb-2 min-h-0 relative z-1`}>
        <Rotulo className="painel__kicker" margem="mb-2">o caminho começa aqui</Rotulo>

        <Fio />
        <h2
          className="painel__titulo flex flex-col w-full my-2 text-bone font-secundaria text-display-xxl uppercase tabular-nums tela-baixa:text-[length:clamp(56px,20vw,120px)]"
          data-revelar
        >
          <span className={linha}>
            <span className={`linha__texto block ${camada} ${vazado}`}>Natural</span>
          </span>{" "}
          <span className={linha}>
            <span className={`linha__texto block ${camada}`}>Cresce.</span>
          </span>
        </h2>
        <Fio />

        <p className="painel__corpo max-w-prose mt-3 text-silver font-terciaria text-body-lg" data-revelar>
          O que não cresce é a comparação com quem não é natural.
        </p>
      </div>

      <div className="painel__acao w-full mt-0 mb-24 relative z-1" data-revelar>
        <Marquise
          palavras={[VERBO_ACAO, "Natural cresce", VERBO_ACAO, "Regra do 12"]}
          sentido={-1}
          tempo={20000}
          className="mb-6"
        />
        <div className={`${envelope} flex flex-col items-center text-center`}>
          <Botao params={params} posicao="fechamento" />
          <p className="mt-3 text-silver font-terciaria text-mono-reg tabular-nums">
            {config.oferta.garantiaDias
              ? `Garantia de ${config.oferta.garantiaDias} dias · reembolso por e-mail`
              : "Garantia em texto, na seção acima · reembolso por e-mail"}
          </p>
        </div>
      </div>

      <div className={`${envelope} ${painelRodape}`} data-revelar>
        <ul className={crus} role="list">
          <li>
            <b className="text-bone font-bold">Link</b> no e-mail
          </li>
          <li>
            <b className="text-bone font-bold">7</b> anexos no Kit
          </li>
          <li>
            <b className="text-bone font-bold">Pix</b> à vista
          </li>
        </ul>
      </div>
    </section>
  );
}
