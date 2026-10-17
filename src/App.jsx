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
import { Amostra } from "./sections/Amostra.jsx";
import { Objecoes } from "./sections/Objecoes.jsx";
import { Fechamento } from "./sections/Fechamento.jsx";
import { RodapeLegal } from "./sections/RodapeLegal.jsx";

import { iniciarMensuracao } from "./instrumentacao.js";
import { garantirVisibilidade, ligarLenis, useMovimento } from "./motion/index.js";
import { alcancePorId, idsDoIndice, secoesPorId } from "./secoes.js";

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
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-10 focus:inline-flex focus:items-center focus:min-h-12 focus:px-4 focus:py-3 focus:bg-bone focus:text-void underline font-secundaria text-label uppercase"
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
        {/* Cortinas (`useCortina`): a secao de cima fica pinada e a de baixo sobe por cima. Cada par
            vive num conteiner proprio, onde o pino termina com a de cima toda coberta. */}
        <div>
          <Manifesto />
          <PilhaDeValor />
          <Espelho />
        </div>
        <Leva />
        {secoesPorId.mapa.presente && <Semanas />}
        <div>
          {secoesPorId.amostra.presente && <Amostra />}
          {/* A oferta e a mesma pilha de valor, com a ancora `#oferta` e a posicao `oferta` do CTA. */}
          <PilhaDeValor id="oferta" posicao="oferta" />
        </div>
        <Objecoes />
        <Fechamento />
      </main>

      <RodapeLegal />
      <IndiceFixo ids={idsDoIndice} />
      <Doca />
    </>
  );
}
