import { useEffect, useRef } from "react";
import { Botao } from "../components/Botao.jsx";
import { Moldura } from "../components/Moldura.jsx";
import { abrirPainel } from "../motion/index.js";
import { config } from "../config.js";

/**
 * Fechamento: o mesmo painel de tela cheia da dobra, espelhado.
 *
 * Mesma escala, mesma familia, mesma frase, mesma moldura. A engenharia reversa
 * registra esse espelhamento de abertura e fechamento no site de origem, e ele
 * funciona pela mesma razao aqui: fecha o arco em vez de so terminar a pagina.
 *
 * Sem argumento novo (RF-L08). O que muda em relacao a dobra sao os numeros
 * crus do rodape: la eles anunciam o programa, aqui anunciam a entrega.
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
      corpo: no.querySelector(".painel__corpo"),
      acao: no.querySelector(".painel__acao"),
      rodape: no.querySelector(".painel__rodape"),
      naRolagem: true,
    });
  }, []);

  return (
    <section id="fechamento" className="painel painel--fechamento grao" ref={raiz}>
      <Moldura />

      <span className="painel__indice stat" aria-hidden="true" data-num>
        09
      </span>

      <div className="painel__centro envelope">
        <span className="painel__kicker overline" data-revelar>
          <span className="glifo" aria-hidden="true">
            &#8627;
          </span>
          O caminho começa aqui
        </span>

        <Fio />
        <h2 className="painel__titulo display-xl" data-revelar>
          Natural Cresce
        </h2>
        <Fio />

        <p className="painel__corpo body-lg" data-revelar>
          O que não cresce é a comparação com quem não é natural.
        </p>

        <div className="painel__acao" data-revelar>
          <Botao params={params} posicao="fechamento" />
          <span className="microregistro mono-reg">
            {config.oferta.garantiaDias
              ? `Garantia de ${config.oferta.garantiaDias} dias · reembolso por e-mail`
              : "Prazo de garantia a definir"}
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

function Fio() {
  return (
    <svg
      className="painel__fio"
      viewBox="0 0 100 1"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <line x1="0" y1="0.5" x2="100" y2="0.5" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}
