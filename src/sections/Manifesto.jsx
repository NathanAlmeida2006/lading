import { Fragment, useRef } from "react";
import { CONTENT } from "../content/content.js";
import { DotField } from "../components/visuals/DotField.jsx";
import { useCurtain } from "../sensory/curtain.js";
import { Label } from "../components/ui/Label.jsx";
import { useManifesto } from "../sensory/manifesto.js";
import { BLOCK, ENVELOPE, WORD } from "../app/ui.js";

// O texto vem do contrato editorial. O realce complementa a leitura: nenhuma
// palavra depende da animação para ficar legível. Sem medição, tudo fica no fluxo.

// Palavras em vermelho (o acento do protocolo, ja vermelho) dentro do texto. A lista vem de `CONTENT.reconhecimento.destaques`.
const HIGHLIGHTS = new Set(CONTENT.reconhecimento.destaques);

/**
 * Seção Manifesto: texto de reconhecimento em palavras, com as destacadas em acento.
 * @param {object} props - Sem props.
 * @returns {JSX.Element} A seção Manifesto.
 */
export function Manifesto() {
  const root = useRef(null);
  useCurtain(root);
  useManifesto(root);

  // A altura do trilho, declarada na classe do section abaixo, e o RHYTHM de sensory/manifesto.js andam juntos: mudar um pede mudar o outro.
  return (
    // data-oculta-doca: a regua do treino esconde a doca enquanto tiver qualquer pixel na tela (a regua e alta; ver o threshold em Dock.jsx).
    <section id="reconhecimento" data-oculta-doca="" className={`${BLOCK} isolate group/manifesto data-cabe:min-h-[271svh] motion-reduce:min-h-0`} ref={root}>
      <DotField variant="estelar" />
      <div className={`${ENVELOPE} manifesto__texto relative z-1 top-0 min-h-svh flex flex-col items-center justify-center group-data-cabe/manifesto:sticky motion-reduce:static`}>
        <div>
        <Label as="h2">{CONTENT.reconhecimento.rotulo}</Label>
        <p className="font-secundaria font-bold text-[length:49.2px] leading-[1.05] normal-case tracking-normal max-w-prose text-bone lg:text-[length:clamp(61px,6.93vw,86px)] lg:leading-none lg:max-w-[32ch]">
          {CONTENT.reconhecimento.texto.split(" ").map((word, index) => (
            // O espaco fica FORA do span: espaco no fim de um inline-block e
            // descartado pelo navegador, e as palavras colavam.
            <Fragment key={`${word}-${index}`}>
              <span className={HIGHLIGHTS.has(word.replace(/\W+$/, "").toLowerCase()) ? `${WORD} text-acento` : WORD}>{word}</span>{" "}
            </Fragment>
          ))}
        </p>
        </div>
      </div>
    </section>
  );
}
