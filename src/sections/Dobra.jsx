import { useEffect, useRef } from "react";
import { Botao } from "../components/Botao.jsx";
import { Moldura } from "../components/Moldura.jsx";
import { Rotulo } from "../components/Rotulo.jsx";
import { Wordmark } from "../components/Wordmark.jsx";
import { abrirPainel } from "../motion/index.js";
import { introPendente } from "../components/Intro.jsx";
import { config } from "../config.js";

/**
 * A dobra, em painel de tela cheia.
 *
 * A headline e TIPOGRAFIA COMO ARQUITETURA, que e a licao do Rep Republic: duas
 * linhas compostas a mao, encostando nas bordas do container, a segunda so em
 * contorno de fio. Nao e tamanho de texto, e cartaz - e por isso a escala
 * `display-xxl` existe so aqui e no fechamento.
 *
 * O que compoe o resto e so o que ja e do sistema: kit de molduras e cantos,
 * fios de 1px como grade, grao, e numeros crus como ornamento honesto. Nenhum
 * sigilo, porque os tres do RF-G03 ainda nao existem na base.
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
      linhas: no.querySelectorAll(".linha__texto"),
      corpo: no.querySelector(".painel__corpo"),
      acao: no.querySelector(".painel__acao"),
      rodape: no.querySelector(".painel__rodape"),
      seta: no.querySelector(".painel__seta"),
      // O heroi compoe DEBAIXO da cortina e ja esta parado quando ela
      // levanta, como no site de origem. Comecar depois do fim da cortina
      // empurraria o LCP (RNF-L01) para perto do teto: o que esta coberto
      // continua contando como pintado.
      atrasoBase: introPendente() ? 300 : 0,
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
        <Rotulo className="painel__kicker">hipertrofia · natural</Rotulo>

        <Fio />
        <h1 className="painel__titulo display-xxl" data-revelar>
          <span className="linha">
            <span className="linha__texto">Natural</span>
          </span>
          <span className="linha">
            <span className="linha__texto vazado">Cresce.</span>
          </span>
        </h1>
        <Fio />

        <p className="painel__corpo body-lg" data-revelar>
          O que não cresce é a comparação com quem não é natural. O teto de
          quem não usa nada <strong>foi medido</strong>, e ele fica muito
          acima de onde a onda de motivação para.
        </p>

        <div className="painel__acao" data-revelar>
          <Botao params={params} posicao="dobra" />
          <span className="microregistro mono-reg">
            {config.oferta.preco
              ? `${config.oferta.moeda} ${config.oferta.preco} · Pix · garantia de ${config.oferta.garantiaDias} dias`
              : "12 semanas · Pix à vista · garantia em texto, mais abaixo"}
          </span>
        </div>
      </div>

      <div className="painel__rodape envelope" data-revelar>
        <span className="rolar overline" aria-hidden="true">
          <span>rolar</span>
          <span>pra ver</span>
          <span className="painel__seta">&#8595;</span>
        </span>
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
      </div>
    </header>
  );
}

/** Fio de 1px como grade de painel. Entra desenhado, da esquerda. */
export function Fio() {
  return (
    <svg className="painel__fio" viewBox="0 0 100 1" preserveAspectRatio="none" aria-hidden="true">
      <line x1="0" y1="0.5" x2="100" y2="0.5" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}
