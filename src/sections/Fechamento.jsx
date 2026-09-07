import { useEffect, useRef } from "react";
import { Botao } from "../components/Botao.jsx";
import { Marquise } from "../components/Marquise.jsx";
import { Moldura } from "../components/Moldura.jsx";
import { Rotulo } from "../components/Rotulo.jsx";
import { abrirPainel } from "../motion/index.js";
import { config, VERBO_ACAO } from "../config.js";
import { Fio } from "./Dobra.jsx";

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

  useEffect(() => {
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
      naRolagem: true,
    });
  }, []);

  return (
    <section id="fechamento" className="painel painel--fechamento grao" ref={raiz}>
      <Moldura />

      <div className="painel__centro envelope">
        <Rotulo className="painel__kicker">o caminho começa aqui</Rotulo>

        <Fio />
        <h2 className="painel__titulo display-xxl" data-revelar>
          <span className="linha">
            <span className="linha__texto vazado">Natural</span>
          </span>
          <span className="linha">
            <span className="linha__texto">Cresce.</span>
          </span>
        </h2>
        <Fio />

        <p className="painel__corpo body-lg" data-revelar>
          O que não cresce é a comparação com quem não é natural.
        </p>
      </div>

      <div className="painel__acao painel__acao--fechamento" data-revelar>
        <Marquise palavras={[VERBO_ACAO, "Natural cresce", VERBO_ACAO, "Regra do 12"]} sentido={-1} tempo={20000} />
        <div className="envelope painel__acao-centro">
          <Botao params={params} posicao="fechamento" />
          <span className="microregistro mono-reg">
            {config.oferta.garantiaDias
              ? `Garantia de ${config.oferta.garantiaDias} dias · reembolso por e-mail`
              : "Garantia em texto, na seção acima · reembolso por e-mail"}
          </span>
        </div>
      </div>

      <div className="painel__rodape envelope" data-revelar>
        <ul className="crus mono-reg" data-num>
          <li>
            <b>PDF</b> no e-mail
          </li>
          <li>
            <b>7</b> anexos no Kit
          </li>
          <li>
            <b>Pix</b> à vista
          </li>
        </ul>
      </div>
    </section>
  );
}
