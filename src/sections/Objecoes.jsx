import { useRef } from "react";
import { CampoDePontos } from "../components/CampoDePontos.jsx";
import { PerguntasFrequentes } from "../components/PerguntasFrequentes.jsx";
import { Rotulo } from "../components/Rotulo.jsx";
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
    <section id="objecoes" className={`${bloco} py-16 md:py-24`} ref={raiz}>
      <CampoDePontos variante="fiel" />
      {/* Esmaece o campo na base: as ondas nao chegam cortadas na secao de baixo. */}
      <div className="absolute inset-x-0 bottom-0 h-56 pointer-events-none bg-linear-to-t from-void via-void/70 to-transparent" aria-hidden="true" />
      <div className={`${envelope} relative z-1 lg:grid lg:grid-cols-[repeat(12,1fr)] lg:gap-x-8 lg:items-start`}>
        <header className="mb-8 lg:mb-0 lg:col-[1/span_4] lg:sticky lg:top-12">
          <Rotulo>{conteudo.objecoesRotulo}</Rotulo>
          <h2 className={`titulo text-bone font-secundaria text-h1 uppercase lg:text-display ${mascara}`} data-revelar>
            As três perguntas
          </h2>
        </header>
        <PerguntasFrequentes itens={conteudo.objecoes} />
      </div>
    </section>
  );
}
