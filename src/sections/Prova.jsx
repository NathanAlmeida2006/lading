import { Fragment, useRef } from "react";
import { Botao } from "../components/Botao.jsx";
import { CampoDePontos } from "../components/CampoDePontos.jsx";
import { Regua } from "../components/Regua.jsx";
import { Rotulo } from "../components/Rotulo.jsx";
import { acenderEmSequencia, carimbar, revelar, useMovimento } from "../motion/index.js";
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
 * Lastro: dossie-hipertrofia, o achado de Kouri e colaboradores (1995) sobre o
 * teto natural e o de Damas e colaboradores (2016) sobre o que e musculo e o
 * que e inchaco de reparo. Toda alegacao continua vindo com o seu limite.
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
const STATEMENT =
  "Existe um teto pra quem não usa nada. Ele fica muito acima de quem nunca treinou " +
  "com constância. E ele não é opinião: foi medido, tem autor e tem ano.";

// Como o manifesto, mas apagada em .22 e com a cor entrando na transicao: a
// palavra da fronteira (`data-atual`) fica no acento, a unica ocorrencia dele
// nesta tela. Sob movimento reduzido tudo nasce aceso e a fronteira nao pinta.
const PALAVRA =
  "palavra inline-block transition-[opacity,color] duration-(--motion-fast) ease-(--ease-corte-2) " +
  "js:opacity-[0.22] data-acesa:opacity-100 data-atual:text-acento " +
  "motion-reduce:js:opacity-100 motion-reduce:data-atual:text-inherit";

const NOTA = "block pl-3 border-l border-line-strong text-silver font-terciaria text-caption";

export function Prova({ params }) {
  const raiz = useRef(null);
  const palco = useRef(null);

  useMovimento(() => {
    const no = raiz.current;
    if (!no) return;
    const anim = acenderEmSequencia(no.querySelectorAll(".palavra"), palco.current, {
      atributoAtual: "data-atual",
    });
    revelar(no.querySelector(".rotulo"));
    carimbar(no.querySelector(".intervalo__numero"));
    for (const el of no.querySelectorAll(".prova__nota, .intervalo__texto, .honesta, .chamada")) {
      revelar(el);
    }
    return () => anim?.revert?.();
  }, []);

  return (
    <section id="prova" className={`${bloco} pt-0 pb-24`} ref={raiz}>
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

      <div className={`${envelope} relative z-1 pt-16 lg:pt-24`}>
        <Regua>
          <p className={`prova__nota max-w-prose mt-8 ${NOTA}`} data-revelar>
            Kouri e colaboradores, 1995. Entre atletas <strong className="text-bone font-semibold">livres de drogas</strong>, o índice de
            massa livre de gordura ficou praticamente todo em 25 ou abaixo, com média perto de 21,8.
            A faixa de 25 a 35 era de quem usava.
          </p>
        </Regua>

        <div className="mt-12 pt-12 border-t border-line">
          <p
            className="intervalo__numero mb-3 text-bone font-secundaria font-extrabold normal-case tracking-[0.01em] leading-[0.86] tabular-nums text-[length:clamp(56px,16vw,132px)]"
            data-revelar
          >
            1 a 1,6 kg
          </p>
          <p
            className="intervalo__texto max-w-prose text-silver font-terciaria text-body-lg"
            data-revelar
          >
            de massa magra em <strong className="text-bone font-semibold">10 a 12 semanas</strong>, em homens que não treinavam. Parte
            do que muda nas primeiras semanas nem é músculo novo, é inchaço de reparo. O músculo de
            verdade aparece entre a terceira e a décima semana.
          </p>
          <p className={`prova__nota mt-4 ${NOTA}`} data-revelar>
            Damas e colaboradores, 2016.
          </p>

          {/* Superficie opaca por cima do campo: texto corrido sobre malha de pontos
              reprova no `TR-07`, que exige scrim, moldura ou tratamento por baixo. */}
          <div role="note" className="honesta mt-12 p-6 lg:p-8 border border-line-strong bg-surface-1" data-revelar>
            <p className="max-w-prose font-terciaria text-body-lg">
              Essa faixa foi medida em quem nunca treinou com constância. Se esse não é o seu caso,
              o número muda, e nenhum estudo desta página mediu o seu.
            </p>
            <p className="max-w-prose mt-3 text-silver font-terciaria text-body lg:text-body-lg">
              Dizer isso custa uma venda de vez em quando. Inventar um número custa a próxima.
            </p>
          </div>

          <div className="chamada flex flex-col items-start mt-12" data-revelar>
            <Botao params={params} posicao="prova" />
            <p className="mt-3 text-silver font-terciaria text-mono-reg tabular-nums">
              Fontes completas, com autor e ano, dentro do protocolo.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
