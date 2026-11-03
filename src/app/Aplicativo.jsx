import { useEffect } from "react";
import "lenis/dist/lenis.css";
import "../estilos/tokens/cor.css";
import "../estilos/tokens/forma-espaco.css";
import "../estilos/tokens/movimento.css";
import "../estilos/fontes.css";
import "../estilos/tailwind.css";

import { Consentimento } from "../componentes/layout/Consentimento.jsx";
import { Doca } from "../componentes/layout/Doca.jsx";
import { Intro } from "../componentes/visuais/Intro.jsx";
import { IndiceFixo } from "../componentes/layout/IndiceFixo.jsx";
import { PausaMovimento } from "../componentes/visuais/PausaMovimento.jsx";
import { Dobra } from "../secoes/Dobra.jsx";
import { Manifesto } from "../secoes/Manifesto.jsx";
import { PilhaDeValor } from "../secoes/PilhaDeValor.jsx";
import { Espelho } from "../secoes/Espelho.jsx";
import { Leva } from "../secoes/Leva.jsx";
import { Semanas } from "../secoes/Semanas.jsx";
import { Video } from "../secoes/video/Video.jsx";
import { Objecoes } from "../secoes/Objecoes.jsx";
import { Fechamento } from "../secoes/Fechamento.jsx";
import { RodapeLegal } from "../secoes/RodapeLegal.jsx";

import { iniciarMensuracao } from "../infra/instrumentacao.js";
import { garantirVisibilidade, ligarLenis, useMovimento } from "../sensorial/index.js";
import { alcancePorId, secoesPorId } from "../conteudo/secoes.js";
import { alvoDeTeclado } from "./ui.js";

/** O registro em secoes.js fixa ids, etapas e presença; a árvore preserva RF-L08. */
export function Aplicativo() {
  // Medicao: roda sempre, com ou sem `js` (nao e movimento). Os parametros de campanha nao passam por
  // aqui: o `Botao` os le direto de instrumentacao.js (`useParametros`).
  useEffect(() => iniciarMensuracao(alcancePorId), []);
  useMovimento(garantirVisibilidade);
  useMovimento(ligarLenis);

  // Por ultimo, depois de hidratar e de os efeitos acima rodarem: avisa o relogio do
  // index.html que o pacote acordou. Sem este aviso, aos 8 s ele tira a classe `js` e a
  // pagina abre inteira (RNF-L35).
  useEffect(() => {
    document.documentElement.classList.add("pronto");
  }, []);

  return (
    <>
      <Intro />

      {/* Primeiro alvo do teclado: fora da tela ate receber foco. */}
      <a
        className={`${alvoDeTeclado} underline`}
        href="#conteudo"
      >
        Pular para o conteúdo
      </a>

      <PausaMovimento />

      {/* Logo depois do "pular": quem navega por teclado ou leitor encontra o aviso antes
          de a pagina comecar. E fixo na base, entao a ordem do DOM nao mexe no desenho. */}
      <Consentimento />

      <main id="conteudo">
        <Dobra />
        {/* A cortina pina o Manifesto, e este conteiner define ate onde o pino vale: a secao de
            baixo sobe por cima, e o pino termina com a de cima toda coberta. */}
        <div>
          <Manifesto />
          <Video />
          <PilhaDeValor />
          <Espelho />
        </div>
        <Leva />
        {secoesPorId.mapa.presente && <Semanas />}
        {/* A oferta e a mesma pilha de valor, com a ancora `#oferta` e a posicao `oferta` do CTA. */}
        <PilhaDeValor id="oferta" posicao="oferta" />
        <Objecoes />
        <Fechamento />
      </main>

      <RodapeLegal />
      <IndiceFixo />
      <Doca />
    </>
  );
}
