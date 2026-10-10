import { Fragment, useRef } from "react";
import { CampoDePontos } from "../components/CampoDePontos.jsx";
import { useCortina } from "../motion/cortina.js";
import { Rotulo } from "../components/Rotulo.jsx";
import { conteudo } from "../conteudo.js";
import { acenderEmSequencia, revelar, useMovimento } from "../motion/index.js";
import { bloco, envelope } from "../ui.js";

/**
 * A prova, na forma do fecho do Google Cloud x Team USA.
 *
 * Lido ao vivo em 07/09/2026: o bloco fica pinado no meio da tela sobre um
 * campo de pontos animado, e o texto - grande, centrado, quebrado a mao -
 * acende PALAVRA A PALAVRA conforme a pagina desce, com a palavra da fronteira
 * no acento. Passado o texto, vem o CTA. Nada de fundo colorido: o campo e
 * monocromatico e a cor entra uma vez so.
 *
 * O campo de pontos esbarra no `TR-03`, que reprova "faisca ou particula".
 * A decisao esta em aberto no contrato, e o componente vive isolado em
 * `CampoDePontos.jsx` justamente para poder sair numa linha. Ver o comentario
 * de la.
 *
 * O CONTEUDO nao mudou, e nao podia mudar: e ele que sustenta a pagina.
 * Lastro no contrato editorial: Kouri (1995), com limites da amostra, e Damas
 * (2016), somente sobre inchaco de reparo. Intervalo de ganho permanece pendente.
 *
 * Duas travas do angulo valem literalmente aqui: substancia so como DADO
 * COMPARATIVO, sem composto, dose ou fonte; e nenhum corpo, nenhum antes e
 * depois, nenhum nome de pessoa real (RF-L17). O alvo e a regua.
 *
 * O palco e o trilho: e ele que MEDE a travessia que acende as palavras. O
 * bloco de dentro e quem gruda e exibe. Quem gruda nunca e quem mede. A palavra
 * apagada e opacidade, nao cor: e a mesma convencao do manifesto, e e o que o
 * `verificar` sabe descontar na checagem de contraste.
 */
const STATEMENT = conteudo.prova.statement.texto;

// Como o manifesto, mas apagada em .22 e com a cor entrando na transicao: a
// palavra da fronteira (`data-atual`) fica no acento, a unica ocorrencia dele
// nesta tela. Sob movimento reduzido tudo nasce aceso e a fronteira nao pinta.
const PALAVRA =
  "palavra inline-block transition-[opacity,color] duration-(--motion-fast) ease-(--ease-corte-2) " +
  "js:opacity-[0.22] data-acesa:opacity-100 data-atual:text-acento " +
  "motion-reduce:js:opacity-100 motion-reduce:data-atual:text-inherit";


export function Prova() {
  const raiz = useRef(null);
  useCortina(raiz);
  const palco = useRef(null);

  useMovimento(() => {
    const no = raiz.current;
    if (!no) return;
    const anim = acenderEmSequencia(no.querySelectorAll(".palavra"), palco.current, {
      atributoAtual: "data-atual",
    });
    revelar(no.querySelector(".rotulo"));
    return () => anim?.revert?.();
  }, []);

  return (
    <section id="prova" className={`${bloco} isolate pt-0`} ref={raiz}>
      <CampoDePontos />

      <div className="min-h-[190svh] flex items-start relative z-1 motion-reduce:min-h-0" ref={palco}>
        <div className={`${envelope} sticky top-0 min-h-svh flex flex-col justify-center items-center text-center gap-6 py-12 motion-reduce:static motion-reduce:min-h-0 motion-reduce:py-16`}>
          <Rotulo como="h2">a prova</Rotulo>
          <p className="font-secundaria text-display normal-case tracking-[-0.005em] leading-[1.08] max-w-[18ch] text-bone lg:text-[length:clamp(48px,5vw,72px)] lg:max-w-[22ch]">
            {STATEMENT.split(" ").map((palavra, indice) => (
              <Fragment key={`${palavra}-${indice}`}>
                <span className={PALAVRA}>{palavra}</span>{" "}
              </Fragment>
            ))}
          </p>
        </div>
      </div>

    </section>
  );
}
