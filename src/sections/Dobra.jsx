import { useEffect, useRef } from "react";
import { Botao } from "../components/Botao.jsx";
import { Moldura } from "../components/Moldura.jsx";
import { Wordmark } from "../components/Wordmark.jsx";
import { abrirPainel } from "../motion/index.js";
import { config } from "../config.js";

/**
 * A dobra, agora em painel de tela cheia.
 *
 * O que compoe o painel e so o que ja e do sistema: o kit de molduras e cantos
 * do RF-G03, fios de 1px como grade de paineis (a camada Cartaz do RF-G02),
 * tipografia em escala display, grao, e numeros crus como ornamento honesto.
 *
 * NAO ha sigilo aqui, e a ausencia e deliberada: o RF-G03 fixa que o sistema
 * entrega tres sigilos, um por protocolo, e nenhum deles existe na base ainda.
 * Desenhar um seria criar ativo de marca de dentro de uma landing, e ativo de
 * marca vive em `00-fundacao/identidade-visual/`.
 *
 * `100svh` e nao `100vh`: no celular a barra do navegador entra e sai, e `vh`
 * mede a viewport grande - o botao cairia para fora da tela justamente em quem
 * chega pelo anuncio (RF-L09).
 */
export function Dobra({ params }) {
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
      seta: no.querySelector(".painel__seta"),
    });
  }, []);

  return (
    <header className="painel painel--dobra grao" id="inicio" ref={raiz}>
      <Moldura />

      <div className="painel__cabecalho envelope">
        <Wordmark />
        <span className="mono-reg" data-num>
          Protocolo 01
        </span>
      </div>

      <div className="painel__centro envelope">
        <span className="painel__kicker overline" data-revelar data-num>
          <span className="glifo" aria-hidden="true">
            &#8627;
          </span>
          Hipertrofia
        </span>

        <Fio />
        <h1 className="painel__titulo display-xl" data-revelar>
          Natural Cresce
        </h1>
        <Fio />

        <p className="painel__corpo body-lg" data-revelar>
          O que não cresce é a comparação com quem não é natural. O teto
          existe, ele foi medido, e a <strong>Regra do 12</strong> é o que te
          move até perto dele.
        </p>

        <div className="painel__acao" data-revelar>
          <Botao params={params} posicao="dobra" />
          <span className="microregistro mono-reg">
            {config.oferta.preco
              ? `${config.oferta.moeda} ${config.oferta.preco} · Pix · garantia de ${config.oferta.garantiaDias} dias`
              : "Preço e garantia a definir"}
          </span>
        </div>
      </div>

      {/* Numeros crus do RF-T02, no rodape do painel. Eles anunciam o mapa das
          12 semanas antes de o visitante chegar nele. */}
      <div className="painel__rodape envelope" data-revelar>
        <ul className="crus mono-reg" data-num>
          <li>
            <b>12</b> semanas
          </li>
          <li>
            <b>3</b> sessões por semana
          </li>
          <li>
            <b>4 a 5</b> horas
          </li>
        </ul>
        <span className="painel__seta" aria-hidden="true">
          &#8595;
        </span>
      </div>
    </header>
  );
}

/** Fio de 1px como grade de painel. Entra desenhado, da esquerda. */
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
