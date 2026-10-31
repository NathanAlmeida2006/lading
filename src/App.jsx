import { useEffect } from "react";
import "lenis/dist/lenis.css";
import "./styles/tokens/cor.css";
import "./styles/tokens/forma-espaco.css";
import "./styles/tokens/movimento.css";
import "./styles/fontes.css";
import "./styles/tailwind.css";

import { Consentimento } from "./components/Consentimento.jsx";
import { Doca } from "./components/Doca.jsx";
import { Intro } from "./components/Intro.jsx";
import { IndiceFixo } from "./components/IndiceFixo.jsx";
import { PausaMovimento } from "./components/PausaMovimento.jsx";
import { Dobra } from "./sections/Dobra.jsx";
import { Manifesto } from "./sections/Manifesto.jsx";
import { PilhaDeValor } from "./sections/PilhaDeValor.jsx";
import { Espelho } from "./sections/Espelho.jsx";
import { Leva } from "./sections/Leva.jsx";
import { Semanas } from "./sections/Semanas.jsx";
import { Video } from "./sections/video/Video.jsx";
import { Objecoes } from "./sections/Objecoes.jsx";
import { Fechamento } from "./sections/Fechamento.jsx";
import { RodapeLegal } from "./sections/RodapeLegal.jsx";

import { iniciarMensuracao } from "./instrumentacao.js";
import { garantirVisibilidade, ligarLenis, useMovimento } from "./motion/index.js";
import { alcancePorId, secoesPorId } from "./secoes.js";
import { alvoDeTeclado } from "./ui.js";

/** O registro em secoes.js fixa ids, etapas e presença; a árvore preserva RF-L08. */
export function App() {
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
