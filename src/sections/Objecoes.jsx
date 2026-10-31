import { useRef } from "react";
import { CampoDePontos } from "../components/CampoDePontos.jsx";
import { PerguntasFrequentes } from "../components/PerguntasFrequentes.jsx";
import { Rotulo } from "../components/Rotulo.jsx";
import { conteudo } from "../conteudo.js";
import { mascaraDeLinha, revelar, revelarEmCascata, useMovimento } from "../motion/index.js";
import { semMovimento } from "../motion/tokens.js";
import { bloco, envelope, grade12, mascara } from "../ui.js";

/** As perguntas frequentes, em acordeao, sobre o campo estelar (pontos que cintilam e somem). */
export function Objecoes() {
  const raiz = useRef(null);
  useMovimento(() => {
    if (semMovimento()) return;
    const no = raiz.current;
    if (!no) return;
    revelar(no.querySelector(".rotulo"));
    mascaraDeLinha(no.querySelector(".titulo"), { atraso: 60 });
    // Revelar o item inteiro preserva a resposta após recolher e reabrir.
    revelarEmCascata(no.querySelectorAll(".dialogo > div"), { intervalo: 90 });
  }, []);

  return (
    <section id="objecoes" className={`${bloco} py-8 md:py-24`} ref={raiz}>
      <CampoDePontos variante="estelar" />
      <div className={`${envelope} relative z-1 ${grade12}`}>
        <div className="min-w-0 lg:col-[1/span_5] lg:sticky lg:top-24 lg:self-start">
          <Rotulo>{conteudo.objecoesRotulo}</Rotulo>
          <h2 className={`titulo text-bone font-secundaria text-h1 uppercase lg:text-display ${mascara}`} data-revelar>
            Perguntas frequentes
          </h2>
        </div>
        <div className="mt-6 min-w-0 lg:mt-0 lg:col-[6/span_7] lg:pt-4">
          <PerguntasFrequentes itens={conteudo.objecoes} />
        </div>
      </div>
    </section>
  );
}
