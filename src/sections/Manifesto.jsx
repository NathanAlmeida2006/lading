import { Fragment, useRef } from "react";
import { conteudo } from "../conteudo.js";
import { CampoDePontos } from "../components/CampoDePontos.jsx";
import { useCortina } from "../motion/cortina.js";
import { Rotulo } from "../components/Rotulo.jsx";
import { useManifesto } from "../motion/manifesto.js";
import { bloco, envelope, palavra as PALAVRA } from "../ui.js";

// O texto vem do contrato editorial. O realce complementa a leitura: nenhuma
// palavra depende da animação para ficar legível. Sem medição, tudo fica no fluxo.

// Palavras em vermelho (o acento do protocolo, ja vermelho) dentro do texto.
const DESTAQUE = /^(verdadeiro|potencial)\W*$/i;

export function Manifesto() {
  const raiz = useRef(null);
  useCortina(raiz);
  useManifesto(raiz);

  // A altura do trilho, declarada na classe do section abaixo, e o RITMO de motion/manifesto.js andam juntos: mudar um pede mudar o outro.
  return (
    <section id="reconhecimento" className={`${bloco} isolate group/manifesto data-cabe:min-h-[271svh] motion-reduce:min-h-0`} ref={raiz}>
      <CampoDePontos variante="estelar" />
      <div className={`${envelope} manifesto__texto relative z-1 top-0 min-h-svh flex flex-col items-center justify-center group-data-cabe/manifesto:sticky motion-reduce:static`}>
        <div>
        <Rotulo como="h2">{conteudo.reconhecimento.rotulo}</Rotulo>
        <p className="font-secundaria font-bold text-[length:49.2px] leading-[1.05] normal-case tracking-normal max-w-prose text-bone lg:text-[length:clamp(61px,6.93vw,86px)] lg:leading-none lg:max-w-[32ch]">
          {conteudo.reconhecimento.texto.split(" ").map((palavra, indice) => (
            // O espaco fica FORA do span: espaco no fim de um inline-block e
            // descartado pelo navegador, e as palavras colavam.
            <Fragment key={`${palavra}-${indice}`}>
              <span className={DESTAQUE.test(palavra) ? `${PALAVRA} text-acento` : PALAVRA}>{palavra}</span>{" "}
            </Fragment>
          ))}
        </p>
        </div>
      </div>
    </section>
  );
}
