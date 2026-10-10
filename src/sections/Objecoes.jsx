import { useRef } from "react";
import { CampoDePontos } from "../components/CampoDePontos.jsx";
import { PerguntasFrequentes } from "../components/PerguntasFrequentes.jsx";
import { Rotulo } from "../components/Rotulo.jsx";
import { Wordmark } from "../components/Wordmark.jsx";
import { conteudo } from "../conteudo.js";
import { mascaraDeLinha, revelar, revelarEmCascata, useMovimento } from "../motion/index.js";
import { semMovimento } from "../motion/tokens.js";
import { bloco, envelope, mascara } from "../ui.js";

/** Três objeções em diálogo, sobre o campo de pontos original. */
export function Objecoes() {
  const raiz = useRef(null);
  useMovimento(() => {
    if (semMovimento()) return;
    const no = raiz.current;
    if (!no) return;
    revelar(no.querySelector(".rotulo"));
    mascaraDeLinha(no.querySelector(".titulo"), { atraso: 60 });
    // Revelar o item inteiro preserva a resposta após recolher e reabrir.
    revelarEmCascata(no.querySelectorAll(".dialogo > details"), { intervalo: 90 });
  }, []);

  return (
    <section id="objecoes" className={`${bloco} py-8 md:py-24`} ref={raiz}>
      <CampoDePontos variante="fiel" />
      <div className={`${envelope} relative z-1 lg:grid lg:grid-cols-[repeat(12,1fr)] lg:gap-x-8`}>
        <div className="min-w-0 lg:col-[1/span_6]">
          <Rotulo>{conteudo.objecoesRotulo}</Rotulo>
          <h2 className={`titulo text-bone font-secundaria text-h1 uppercase lg:text-display ${mascara}`} data-revelar>
            Perguntas frequentes
          </h2>
          <div className="mt-6 lg:mt-10">
            <PerguntasFrequentes itens={conteudo.objecoes} />
          </div>
        </div>
        {/* O painel da direita (a "foto" do original): so no monitor, para o celular caber numa tela. */}
        <div
          className="hidden lg:flex lg:col-[7/-1] items-center justify-center min-h-120 bg-surface-1 border border-line-strong"
          aria-hidden="true"
        >
          <Wordmark className="block w-3/5 text-bone" />
        </div>
      </div>
    </section>
  );
}
