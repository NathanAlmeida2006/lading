import { useEffect } from "react";
import "lenis/dist/lenis.css";
import "../styles/tokens/color.css";
import "../styles/tokens/shape-spacing.css";
import "../styles/tokens/motion.css";
import "../styles/fonts.css";
import "../styles/tailwind.css";

import { ConsentBanner } from "../components/layout/ConsentBanner.jsx";
import { Dock } from "../components/layout/Dock.jsx";
import { FixedIndex } from "../components/layout/FixedIndex.jsx";
import { MotionPause } from "../components/visuals/MotionPause.jsx";
import { Fold } from "../sections/Fold.jsx";
import { ValueStack } from "../sections/ValueStack.jsx";
import { AppShowcase } from "../sections/AppShowcase.jsx";
import { Proof } from "../sections/Proof.jsx";
import { Spectrum } from "../sections/Spectrum.jsx";
import { Mirror } from "../sections/Mirror.jsx";
import { Batch } from "../sections/Batch.jsx";
import { Weeks } from "../sections/Weeks.jsx";
import { Video } from "../sections/video/Video.jsx";
import { Objections } from "../sections/Objections.jsx";
import { Closing } from "../sections/Closing.jsx";
import { LegalFooter } from "../sections/LegalFooter.jsx";

import { startMeasurement } from "../infra/instrumentation.js";
import { ensureVisibility, startLenis, useMotion } from "../sensory/index.js";
import { REACH_BY_ID, SECTIONS_BY_ID } from "../content/sections.js";
import { KEYBOARD_TARGET } from "./ui.js";

/**
 * O registro em sections.js fixa ids, etapas e presença; a árvore preserva RF-L08.
 * @returns {JSX.Element} A pagina inteira, na ordem das secoes.
 */
export function App() {
  // Medicao: roda sempre, com ou sem `js` (nao e movimento). Os parametros de campanha nao passam por
  // aqui: o `CtaButton` os le direto de instrumentation.js (`useCampaignParams`).
  useEffect(() => startMeasurement(REACH_BY_ID), []);
  useMotion(ensureVisibility);
  useMotion(startLenis);

  // Por ultimo, depois de hidratar e de os efeitos acima rodarem: avisa o relogio do
  // index.html que o pacote acordou. Sem este aviso, aos 8 s ele tira a classe `js` e a
  // pagina abre inteira (RNF-L35).
  useEffect(() => {
    document.documentElement.classList.add("pronto");
  }, []);

  return (
    <>
      {/* Primeiro alvo do teclado: fora da tela ate receber foco. */}
      <a
        className={`${KEYBOARD_TARGET} underline`}
        href="#conteudo"
      >
        Pular para o conteúdo
      </a>

      <MotionPause />

      {/* Logo depois do "pular": quem navega por teclado ou leitor encontra o aviso antes
          de a pagina comecar. E fixo na base, entao a ordem do DOM nao mexe no desenho. */}
      <ConsentBanner />

      <main id="conteudo">
        <Fold />
        <Video />
        <AppShowcase />
        <Mirror />
        <Spectrum />
        <Batch />
        <Proof />
        {SECTIONS_BY_ID.mapa.presente && <Weeks />}
        <Objections />
        {/* A unica oferta e preco da pagina: depois da dor, do mecanismo, do valor e das objecoes. A doca nao a esconde. */}
        <ValueStack />
        <Closing />
      </main>

      <LegalFooter />
      <FixedIndex />
      <Dock />
    </>
  );
}
